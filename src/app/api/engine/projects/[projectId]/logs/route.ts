import { NextResponse } from "next/server";
import { authFailed, isRoutableProjectSlug, resolveVcaasContext } from "@/app/api/vcaas/_shared";
import { engineLogs, ownedEngineProject } from "@/lib/engine-service";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const auth = await resolveVcaasContext();
  if (authFailed(auth)) return auth.response;
  const { projectId } = await params;
  if (!isRoutableProjectSlug(projectId)) return NextResponse.json({ ok: false, code: "NOT_FOUND", error: "Project not found." }, { status: 404 });
  const project = await ownedEngineProject(projectId, auth.ctx.accountUserId);
  if (!project) return NextResponse.json({ ok: false, code: "NOT_FOUND", error: "Project not found." }, { status: 404 });
  try {
    return NextResponse.json({ ok: true, data: await engineLogs(project) }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ ok: false, code: "SANDBOXD_LOGS_FAILED", error: "Logs are temporarily unavailable." }, { status: 502 });
  }
}
