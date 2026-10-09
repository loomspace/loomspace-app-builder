import { NextResponse } from "next/server";
import { authFailed, isRoutableProjectSlug, resolveVcaasContext } from "@/app/api/vcaas/_shared";
import { ownedEngineProject, syncEngineJob } from "@/lib/engine-service";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ projectId: string; jobId: string }> }) {
  const auth = await resolveVcaasContext();
  if (authFailed(auth)) return auth.response;
  const { projectId, jobId } = await params;
  if (!isRoutableProjectSlug(projectId)) return NextResponse.json({ ok: false, code: "NOT_FOUND", error: "Project not found." }, { status: 404 });
  const project = await ownedEngineProject(projectId, auth.ctx.accountUserId);
  if (!project) return NextResponse.json({ ok: false, code: "NOT_FOUND", error: "Project not found." }, { status: 404 });
  try {
    const data = await syncEngineJob(project, jobId);
    if (!data) return NextResponse.json({ ok: false, code: "NOT_FOUND", error: "Build not found." }, { status: 404 });
    return NextResponse.json({ ok: true, data }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ ok: false, code: "SANDBOXD_STATUS_FAILED", error: "Build status is temporarily unavailable." }, { status: 502 });
  }
}
