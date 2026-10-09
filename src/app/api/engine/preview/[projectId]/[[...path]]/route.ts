import { NextResponse, type NextRequest } from "next/server";
import { authFailed, isRoutableProjectSlug, resolveVcaasContext } from "@/app/api/vcaas/_shared";
import { ownedEngineProject } from "@/lib/engine-service";
import { sandboxd } from "@/lib/sandboxd-server";

export const dynamic = "force-dynamic";
const blocked = new Set(["host", "connection", "cookie", "authorization", "origin", "referer", "transfer-encoding", "upgrade"]);
const responseBlocked = new Set(["connection", "content-length", "content-encoding", "set-cookie", "transfer-encoding", "upgrade"]);

async function handle(request: NextRequest, { params }: { params: Promise<{ projectId: string; path?: string[] }> }) {
  const auth = await resolveVcaasContext();
  if (authFailed(auth)) return auth.response;
  const { projectId, path = [] } = await params;
  if (!isRoutableProjectSlug(projectId)) return NextResponse.json({ ok: false, code: "NOT_FOUND", error: "Project not found." }, { status: 404 });
  const project = await ownedEngineProject(projectId, auth.ctx.accountUserId);
  if (!project?.sandbox_id) return NextResponse.json({ ok: false, code: "NOT_FOUND", error: "Project not found." }, { status: 404 });
  try {
    const sandbox = await sandboxd.getSandbox(project.sandbox_id);
    const preview = sandbox.preview?.url;
    if (!preview) return NextResponse.json({ ok: false, code: "NO_PREVIEW", error: "Preview is not ready." }, { status: 409 });
    const origin = new URL(preview);
    if (!/^https?:$/.test(origin.protocol)) throw new Error("invalid preview protocol");
    const target = new URL(`/${path.map(encodeURIComponent).join("/")}`, origin);
    target.search = request.nextUrl.search;
    const headers = new Headers();
    request.headers.forEach((value, key) => { if (!blocked.has(key.toLowerCase())) headers.set(key, value); });
    headers.set("accept-encoding", "identity");
    const upstream = await fetch(target, { method: request.method, headers, body: ["GET", "HEAD"].includes(request.method) ? undefined : await request.arrayBuffer(), redirect: "manual", cache: "no-store" });
    const location = upstream.headers.get("location");
    if (location && new URL(location, target).origin !== origin.origin) return NextResponse.json({ ok: false, code: "PREVIEW_REDIRECT_BLOCKED", error: "Preview redirect was blocked." }, { status: 502 });
    const output = new Headers();
    upstream.headers.forEach((value, key) => { if (!responseBlocked.has(key.toLowerCase())) output.set(key, value); });
    if (location) output.set("location", `/api/engine/preview/${encodeURIComponent(projectId)}${new URL(location, target).pathname}${new URL(location, target).search}`);
    return new NextResponse(location ? null : upstream.body, { status: upstream.status, headers: output });
  } catch {
    return NextResponse.json({ ok: false, code: "PREVIEW_UNREACHABLE", error: "Preview is temporarily unavailable." }, { status: 502 });
  }
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
export const HEAD = handle;
