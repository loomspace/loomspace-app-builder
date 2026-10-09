import { NextResponse } from "next/server";
import { authFailed, resolveVcaasContext } from "@/app/api/vcaas/_shared";
import { getCreditBalance, listDeveloperTokens } from "@/lib/loomspace-ownership";

export async function GET() {
  const auth = await resolveVcaasContext();
  if (authFailed(auth)) return auth.response;
  const did = auth.ctx.accountUserId;
  const [balanceMicrocredits, tokens] = await Promise.all([getCreditBalance(did), listDeveloperTokens(did)]);
  return NextResponse.json({ ok: true, account: { did, balanceMicrocredits, tokens } }, { headers: { "Cache-Control": "no-store" } });
}
