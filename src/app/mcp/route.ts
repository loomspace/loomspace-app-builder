import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { findDeveloperToken } from "@/lib/loomspace-ownership";
import { createLoomspaceMcpServer } from "@/lib/loomspace-mcp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 1_048_576;

function jsonError(message: string, status: number) {
  return Response.json({ jsonrpc: "2.0", error: { code: -32600, message }, id: null }, { status, headers: { "Cache-Control": "no-store" } });
}

function bearerToken(request: Request) {
  const header = request.headers.get("authorization");
  const match = header?.match(/^Bearer ([A-Za-z0-9_-]{20,512})$/);
  return match ? match[1] : null;
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
  if (!contentType.startsWith("application/json") || !/^application\/json(?:\s*;|$)/.test(contentType)) {
    return jsonError("Content-Type must be application/json.", 415);
  }
  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) return jsonError("Request body is too large.", 413);

  const rawBody = await request.text();
  if (Buffer.byteLength(rawBody, "utf8") > MAX_BODY_BYTES) return jsonError("Request body is too large.", 413);
  let parsedBody: unknown;
  try {
    parsedBody = JSON.parse(rawBody);
  } catch {
    return jsonError("Request body must be valid JSON.", 400);
  }

  const token = bearerToken(request);
  const principal = token ? await findDeveloperToken(token) : null;
  const server = createLoomspaceMcpServer(principal);
  const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true, maxRequestBodySize: MAX_BODY_BYTES });
  try {
    await server.connect(transport);
    const response = await transport.handleRequest(request, { parsedBody });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch {
    return jsonError("Unable to process MCP request.", 500);
  } finally {
    await server.close().catch(() => undefined);
  }
}

export async function GET() {
  return new Response("Method Not Allowed", { status: 405, headers: { Allow: "POST", "Cache-Control": "no-store" } });
}
