import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { vcaasRequest } from "@/lib/vcaas-server";
import { userOwnsProject, visibleProjectIds } from "@/lib/loomspace-ownership";
import { z } from "zod";

const TOOL_TIMEOUT_MS = 180_000;
const MAX_TOOL_OUTPUT_CHARS = 24_000;

export type McpPrincipal = { ownerDid: string; scopes: readonly string[] } | null;

type UpstreamEnvelope = { data?: unknown; errors?: { errorMessage?: string; errorCode?: string } | null };

function text(value: unknown) {
  const json = JSON.stringify(value, null, 2);
  return json.length <= MAX_TOOL_OUTPUT_CHARS ? json : `${json.slice(0, MAX_TOOL_OUTPUT_CHARS)}\n…truncated by Loomspace MCP response limit.`;
}

function result(value: unknown, isError = false) {
  return { content: [{ type: "text" as const, text: text(value) }], ...(isError ? { isError: true } : {}) };
}

async function withinTimeout<T>(operation: (signal: AbortSignal) => Promise<T>): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TOOL_TIMEOUT_MS);
  try {
    return await operation(controller.signal);
  } finally {
    clearTimeout(timeout);
  }
}

async function request(path: string) {
  try {
    const response = await withinTimeout((signal) => vcaasRequest(path, { signal }));
    const body = await response.json().catch(() => null) as UpstreamEnvelope | null;
    if (!response.ok || body?.errors) {
      return { ok: false as const, error: body?.errors?.errorMessage ?? `Upstream request failed (${response.status}).` };
    }
    return { ok: true as const, data: body?.data ?? null };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error && error.name === "AbortError" ? "Request timed out after 180 seconds." : "Upstream request failed." };
  }
}

function requireReadPrincipal(principal: McpPrincipal) {
  return principal && principal.scopes.includes("projects:read") ? principal : null;
}

/** One fresh server per stateless HTTP exchange prevents transport cross-talk. */
export function createLoomspaceMcpServer(principal: McpPrincipal) {
  const server = new McpServer({ name: "loomspace", version: "1.0.0" });
  const readPrincipal = requireReadPrincipal(principal);

  server.registerTool("loomspace_status", {
    title: "Loomspace MCP status",
    description: "Safe setup guidance. This tool is available without a token.",
    annotations: { readOnlyHint: true },
  }, async () => result({
    service: "Loomspace MCP",
    authenticated: Boolean(readPrincipal),
    guidance: readPrincipal
      ? "Connected with a user-scoped read token. Project tools are limited to projects owned by this token's account."
      : "No valid token is configured. Create a projects:read token in Loomspace Developer, then configure this server with Authorization: Bearer <token>.",
    endpoint: "/mcp",
  }));

  if (!readPrincipal) return server;

  server.registerTool("loomspace_list_projects", {
    title: "List Loomspace projects",
    description: "List only projects owned by the authenticated token owner.",
    annotations: { readOnlyHint: true },
  }, async () => {
    const allowed = await visibleProjectIds(readPrincipal.ownerDid);
    const upstream = await request("/projects?limit=100");
    if (!upstream.ok) return result({ error: upstream.error }, true);
    const projects = Array.isArray(upstream.data) ? upstream.data.filter((project) => {
      const id = project && typeof project === "object" ? (project as { projectId?: unknown }).projectId : null;
      return typeof id === "string" && allowed.has(id);
    }) : [];
    return result({ projects });
  });

  server.registerTool("loomspace_get_project", {
    title: "Get a Loomspace project",
    description: "Get a project only when it belongs to the authenticated token owner.",
    inputSchema: { projectId: z.string().min(1).max(200) },
    annotations: { readOnlyHint: true },
  }, async ({ projectId }) => {
    if (!(await userOwnsProject(readPrincipal.ownerDid, projectId))) return result({ error: "Project not found." }, true);
    const upstream = await request(`/projects/${encodeURIComponent(projectId)}`);
    return upstream.ok ? result({ project: upstream.data }) : result({ error: upstream.error }, true);
  });

  server.registerTool("loomspace_get_build_status", {
    title: "Get Loomspace build status",
    description: "Get rebuild status only when the project belongs to the authenticated token owner.",
    inputSchema: { projectId: z.string().min(1).max(200) },
    annotations: { readOnlyHint: true },
  }, async ({ projectId }) => {
    if (!(await userOwnsProject(readPrincipal.ownerDid, projectId))) return result({ error: "Project not found." }, true);
    const upstream = await request(`/projects/${encodeURIComponent(projectId)}/rebuild/status`);
    return upstream.ok ? result({ build: upstream.data }) : result({ error: upstream.error }, true);
  });

  return server;
}
