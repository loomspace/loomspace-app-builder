/**
 * Catch-all proxy: `/api/vcaas/<path>` → `https://api-accounts.totalum.app/api/v1/vcaas/<path>`
 * with the operator's `api-key` header added server-side.
 *
 * 📖 What each forwarded path accepts and returns: https://www.totalum.app/totalum-api.md
 */
import { vcaasRequest, VcaasPathError } from "@/lib/vcaas-server";
import { normalizeVcaasError, toErrorEnvelope } from "@/lib/vcaas-errors";
import { NextRequest, NextResponse } from "next/server";
import { authFailed, enforceProjectScope, resolveVcaasContext } from "../_shared";
import { consumeAction, recordProjectOwner, visibleProjectIds } from "@/lib/loomspace-ownership";

interface VcaasApiResponse {
  /**
   * ⚠️ `errorDetails` IS OPTIONAL AND LOAD-BEARING. totalum-backend uses it to
   * separate two situations that share one `errorCode` — `SANDBOX_NOT_REACHABLE`
   * means both "the app is still starting" and "the app is broken", which need
   * opposite advice. Forwarding it is what lets the workspace say which.
   */
  errors:
    | {
        errorCode: string;
        errorMessage: string;
        errorDetails?: { reason?: string; httpStatus?: number };
      }
    | null;
  data: unknown;
}

function projectIdFromLaunch(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const record = data as Record<string, unknown>;
  const direct = record.projectId ?? record.id;
  if (typeof direct === "string") return direct;
  const nested = record.project;
  if (nested && typeof nested === "object") {
    const candidate = (nested as Record<string, unknown>).projectId ?? (nested as Record<string, unknown>).id;
    return typeof candidate === "string" ? candidate : null;
  }
  return null;
}

function isProjectDetailPath(path: string[]): boolean {
  return path[0] === "projects" && Boolean(path[1]) && path[1] !== "launch" && path[1] !== "import";
}

function billableAction(path: string[], method: string): { name: string; max: number; windowMs: number } | null {
  if (method !== "POST") return null;
  if (path[0] === "projects" && path[1] === "launch") return { name: "launch", max: 1, windowMs: 5 * 60_000 };
  if (path[0] === "projects" && path[2] === "agent") return { name: "agent-run", max: 3, windowMs: 10 * 60_000 };
  return null;
}

async function handleRequest(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;
    const auth = await resolveVcaasContext();
    if (authFailed(auth)) return auth.response;
    if (isProjectDetailPath(path)) {
      const denied = await enforceProjectScope(auth.team, req.method, path);
      if (denied) return denied;
    }
    const billable = billableAction(path, req.method);
    if (billable) {
      const limit = consumeAction(auth.ctx.accountUserId, billable.name, billable.max, billable.windowMs);
      if (limit.ok === false) {
        return NextResponse.json({ ok: false, error: "Build limit reached. Try again shortly.", code: "RATE_LIMITED", retryAfterSeconds: limit.retryAfterSeconds }, { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } });
      }
    }
    const vcaasPath = "/" + path.join("/");

    // Forward query parameters
    const url = new URL(req.url);
    const queryString = url.searchParams.toString();
    const fullPath = queryString ? `${vcaasPath}?${queryString}` : vcaasPath;

    // Get body for non-GET/HEAD requests
    let body: string | undefined;
    if (req.method !== "GET" && req.method !== "HEAD") {
      try {
        const text = await req.text();
        if (text) body = text;
      } catch {
        // No body
      }
    }

    const response = await vcaasRequest(fullPath, {
      method: req.method,
      body,
    });

    const json = (await response.json()) as VcaasApiResponse;

    /**
     * ═══⭐⭐ THE ERROR ENVELOPE THE WORKSPACE SWITCHES ON ══════════════════
     *
     * ⚠️⚠️ THIS USED TO EMIT `errorCode`, WHICH NOTHING READS. The client layer and
     * every panel expect `{ ok:false, error, code, upstreamCode }` — `code` is a
     * small stable union to branch on, `upstreamCode` is VCaaS's own name kept
     * intact. Two features depend on the raw name surviving the hop: the wake
     * (`SERVER_NOT_READY`, which normalises to `UNKNOWN` because it is not in the
     * stable union) and the publish refusal (`SANDBOX_NOT_REACHABLE`). With only
     * `errorCode` on the wire, both were invisible to the UI.
     */
    if (json.errors) {
      const normalized = normalizeVcaasError(json.errors, response.status);
      return NextResponse.json(toErrorEnvelope(normalized), { status: normalized.status });
    }

    // One upstream Totalum key can power many people only if its global project
    // list is reduced to the authenticated Privy user's locally recorded projects.
    if (req.method === "GET" && path.length === 1 && path[0] === "projects" && Array.isArray(json.data)) {
      const allowed = await visibleProjectIds(auth.ctx.accountUserId);
      const scoped = json.data.filter((project) => {
        if (!project || typeof project !== "object") return false;
        const id = (project as Record<string, unknown>).projectId;
        return typeof id === "string" && allowed.has(id);
      });
      return NextResponse.json({ ok: true, data: scoped }, { status: 200 });
    }

    if (req.method === "POST" && path[0] === "projects" && (path[1] === "launch" || path.length === 1)) {
      const projectId = projectIdFromLaunch(json.data);
      if (!projectId) {
        return NextResponse.json({ ok: false, error: "Project was created but ownership could not be recorded.", code: "OWNERSHIP_RECORD_FAILED" }, { status: 502 });
      }
      await recordProjectOwner(projectId, auth.ctx.accountUserId);
    }

    return NextResponse.json(
      { ok: true, data: json.data },
      { status: 200 }
    );
  } catch (error) {
    // ⚠️ A path that tried to leave the VCaaS API — see `resolveVcaasUrl`. A plain 400,
    // with no hint of what the key could otherwise have reached.
    if (error instanceof VcaasPathError) {
      return NextResponse.json(
        { ok: false, error: "Invalid path", code: "VALIDATION", data: null },
        { status: 400 }
      );
    }
    /**
     * ⚠️ IT USED TO SWALLOW THE REASON. Every failure in here — a body that could not be
     * read, an upstream that answered non-JSON, a thrown fetch — came out as the same
     * opaque "Internal server error" toast with nothing in the server log to explain it,
     * which is a debugging dead end for the one layer every request passes through.
     */
    console.error(`[vcaas] ${req.method} proxy failed:`, error);
    return NextResponse.json(
      { ok: false, error: "Internal server error", code: "UNKNOWN", data: null },
      { status: 500 }
    );
  }
}

export const GET = handleRequest;
export const POST = handleRequest;
export const PUT = handleRequest;
export const DELETE = handleRequest;
export const PATCH = handleRequest;
