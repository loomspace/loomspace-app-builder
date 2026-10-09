import { NextResponse } from "next/server";
import { authFailed, isRoutableProjectSlug, resolveVcaasContext } from "@/app/api/vcaas/_shared";
import { ownedEngineProject } from "@/lib/engine-service";
import { exportSandboxSource } from "@/lib/source-export";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const auth = await resolveVcaasContext();
  if (authFailed(auth)) return auth.response;
  const { projectId } = await params;
  if (!isRoutableProjectSlug(projectId)) return NextResponse.json({ ok: false, code: "NOT_FOUND", error: "Project not found." }, { status: 404 });

  const project = await ownedEngineProject(projectId, auth.ctx.accountUserId);
  if (!project) return NextResponse.json({ ok: false, code: "NOT_FOUND", error: "Project not found." }, { status: 404 });
  if (!project.sandbox_id) return NextResponse.json({ ok: false, code: "ENGINE_PROJECT_NOT_READY", error: "This project has no sandbox workspace yet." }, { status: 409 });

  try {
    const zip = await exportSandboxSource(project.sandbox_id);
    return new NextResponse(zip as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="loomspace-${projectId}.zip"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    if (code === "SOURCE_EXPORT_TOO_LARGE") return NextResponse.json({ ok: false, code, error: "Project source exceeds the export limit." }, { status: 413 });
    if (code === "SOURCE_EXPORT_EMPTY") return NextResponse.json({ ok: false, code, error: "No source files found to export." }, { status: 409 });
    return NextResponse.json({ ok: false, code: "SOURCE_EXPORT_FAILED", error: "Source export is temporarily unavailable." }, { status: 502 });
  }
}
