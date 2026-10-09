import { NextResponse } from "next/server";
import { authFailed, isRoutableProjectSlug, resolveVcaasContext } from "@/app/api/vcaas/_shared";
import { parseEngineBuildInput } from "@/lib/engine-input";
import { ownedEngineProject, startEngineBuild } from "@/lib/engine-service";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const auth = await resolveVcaasContext();
  if (authFailed(auth)) return auth.response;
  const { projectId } = await params;
  if (!isRoutableProjectSlug(projectId)) return NextResponse.json({ ok: false, code: "NOT_FOUND", error: "Project not found." }, { status: 404 });
  const project = await ownedEngineProject(projectId, auth.ctx.accountUserId);
  if (!project) return NextResponse.json({ ok: false, code: "NOT_FOUND", error: "Project not found." }, { status: 404 });
  const input = parseEngineBuildInput(await request.json().catch(() => null));
  if (!input) return NextResponse.json({ ok: false, code: "VALIDATION", error: "Invalid build request." }, { status: 400 });
  try {
    return NextResponse.json({ ok: true, data: await startEngineBuild(project, auth.ctx.accountUserId, input) }, { status: 202 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Build could not start.";
    const status = /not ready/.test(message) ? 503 : 502;
    return NextResponse.json({ ok: false, code: status === 503 ? "AGENT_NOT_READY" : "BUILD_START_FAILED", error: message }, { status });
  }
}
