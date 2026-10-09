import { NextResponse } from "next/server";
import { authFailed, resolveVcaasContext } from "@/app/api/vcaas/_shared";
import { engineReadiness } from "@/lib/engine-service";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await resolveVcaasContext();
  if (authFailed(auth)) return auth.response;
  return NextResponse.json({ ok: true, data: await engineReadiness() }, { headers: { "Cache-Control": "no-store" } });
}
