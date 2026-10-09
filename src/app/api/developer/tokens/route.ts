import { NextResponse } from "next/server";
import { authFailed, resolveVcaasContext } from "@/app/api/vcaas/_shared";
import { createDeveloperToken, DEVELOPER_TOKEN_SCOPES, listDeveloperTokens, revokeDeveloperToken, type DeveloperTokenScope } from "@/lib/loomspace-ownership";

const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function GET() {
  const auth = await resolveVcaasContext();
  if (authFailed(auth)) return auth.response;
  return json({ ok: true, tokens: await listDeveloperTokens(auth.ctx.accountUserId) });
}

export async function POST(request: Request) {
  const auth = await resolveVcaasContext();
  if (authFailed(auth)) return auth.response;
  let body: { name?: unknown; scopes?: unknown };
  try { body = await request.json(); } catch { return json({ ok: false, error: "A JSON body is required." }, 400); }
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const scopes = Array.isArray(body.scopes) ? body.scopes : [];
  if (!name || name.length > 80 || !scopes.length || scopes.length > DEVELOPER_TOKEN_SCOPES.length || scopes.some((scope) => typeof scope !== "string" || !(DEVELOPER_TOKEN_SCOPES as readonly string[]).includes(scope))) return json({ ok: false, error: "Provide a token name and valid scopes." }, 400);
  try {
    const created = await createDeveloperToken(auth.ctx.accountUserId, name, scopes as DeveloperTokenScope[]);
    return json({ ok: true, token: created.metadata, secret: created.token }, 201);
  } catch { return json({ ok: false, error: "Unable to create token." }, 400); }
}

export async function DELETE(request: Request) {
  const auth = await resolveVcaasContext();
  if (authFailed(auth)) return auth.response;
  let body: { tokenId?: unknown };
  try { body = await request.json(); } catch { return json({ ok: false, error: "A JSON body is required." }, 400); }
  if (typeof body.tokenId !== "string" || !body.tokenId) return json({ ok: false, error: "A token id is required." }, 400);
  if (!(await revokeDeveloperToken(auth.ctx.accountUserId, body.tokenId))) return json({ ok: false, error: "Token not found." }, 404);
  return json({ ok: true });
}
