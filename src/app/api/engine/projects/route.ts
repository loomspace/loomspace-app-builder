import { NextResponse } from "next/server";
import { authFailed, resolveVcaasContext } from "@/app/api/vcaas/_shared";
import { parseEngineProjectInput } from "@/lib/engine-input";
import { createEngineProject } from "@/lib/engine-service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await resolveVcaasContext();
  if (authFailed(auth)) return auth.response;
  const input = parseEngineProjectInput(await request.json().catch(() => null));
  if (!input) return NextResponse.json({ ok: false, code: "VALIDATION", error: "Invalid project request." }, { status: 400 });
  try {
    return NextResponse.json({ ok: true, data: await createEngineProject(auth.ctx.accountUserId, input) }, { status: 201 });
  } catch (error) {
    console.error("[engine] project creation failed", error);
    return NextResponse.json({ ok: false, code: "SANDBOXD_CREATE_FAILED", error: "Could not create sandbox project." }, { status: 502 });
  }
}
