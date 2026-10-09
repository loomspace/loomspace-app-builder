import "server-only";
import { randomUUID } from "node:crypto";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { sandboxd, type SandboxdTask } from "@/lib/sandboxd-server";
import { getVikeyConfig, makeBuildPlan, vikeyReady } from "@/lib/vikey-server";
import type { EngineBuildInput, EngineProjectInput } from "@/lib/engine-input";

const PERSONAL_WORKSPACE = "Personal workspace";
const MISE_TOML = `[tools]\nnode = "22"\n\n[env]\nNODE_ENV = "development"\n\n[tasks.dev]\nrun = "npm run dev -- --host 0.0.0.0"\n\n[tasks.check]\nrun = "npm run build"\n\n[tasks.build]\nrun = "npm run build"\n\n[tasks.test]\nrun = "npm test"\n`;

type EngineProject = { id: string; workspace_id: string; owner_did: string; sandbox_app_id: string | null; sandbox_id: string | null; status: string; label: string | null };
type EngineJob = { id: string; project_id: string; sandbox_task_id: string | null; status: string; provider: string | null; model: string | null; error_code: string | null };
const fail = (error: { message: string } | null) => { if (error) throw new Error(error.message); };

async function workspaceFor(ownerDid: string): Promise<string> {
  const db = getSupabaseAdmin();
  fail((await db.from("profiles").upsert({ privy_did: ownerDid, updated_at: new Date().toISOString() }, { onConflict: "privy_did" })).error);
  const found = await db.from("workspaces").select("id").eq("owner_did", ownerDid).eq("name", PERSONAL_WORKSPACE).maybeSingle();
  fail(found.error);
  let id = found.data?.id as string | undefined;
  if (!id) {
    const created = await db.from("workspaces").insert({ owner_did: ownerDid, name: PERSONAL_WORKSPACE }).select("id").single();
    fail(created.error); id = created.data.id as string;
  }
  fail((await db.from("workspace_members").upsert({ workspace_id: id, privy_did: ownerDid, role: "owner" }, { onConflict: "workspace_id,privy_did" })).error);
  return id;
}

export async function ownedEngineProject(projectId: string, ownerDid: string): Promise<EngineProject | null> {
  const result = await getSupabaseAdmin().from("projects").select("id,workspace_id,owner_did,sandbox_app_id,sandbox_id,status,label").eq("id", projectId).eq("owner_did", ownerDid).eq("engine", "sandboxd").maybeSingle();
  fail(result.error);
  return result.data as EngineProject | null;
}

async function event(jobId: string, eventType: string, payload: Record<string, unknown>) {
  fail((await getSupabaseAdmin().from("build_events").insert({ job_id: jobId, event_type: eventType, payload })).error);
}

export async function createEngineProject(ownerDid: string, input: EngineProjectInput) {
  const db = getSupabaseAdmin();
  const workspaceId = await workspaceFor(ownerDid);
  const id = randomUUID();
  fail((await db.from("projects").insert({ id, workspace_id: workspaceId, owner_did: ownerDid, label: input.label, description: input.description, engine: "sandboxd", status: "queued" })).error);
  try {
    const app = await sandboxd.createApp({ name: input.label, description: input.description, external_user_id: ownerDid, external_project_id: id, runtime_preset: input.preset, tags: ["loomspace", `project:${id}`] });
    const sandbox = await sandboxd.createSandbox(app.id, { ports: [3000], runtime_preset: input.preset });
    await sandboxd.writeFile(sandbox.id, "workspace/app/mise.toml", MISE_TOML);
    fail((await db.from("projects").update({ sandbox_app_id: app.id, sandbox_id: sandbox.id, status: "created", updated_at: new Date().toISOString() }).eq("id", id)).error);
    return { id, status: "created", sandboxId: sandbox.id };
  } catch (error) {
    await db.from("projects").update({ status: "failed", updated_at: new Date().toISOString() }).eq("id", id);
    throw error;
  }
}

export async function engineReadiness() {
  const vikey = getVikeyConfig();
  const vikeyReachable = await vikeyReady();
  try {
    const [agents, settings] = await Promise.all([sandboxd.agents(), sandboxd.settings()]);
    const agent = agents.providers?.find((provider) => provider.id === "opencode");
    return { sandboxd: true, vikeyConfigured: Boolean(vikey), vikeyReachable, agent: { installed: agent?.installed_state === "installed", connected: agent?.status === "connected", runnable: agent?.runnable === true }, model: vikey?.model ?? null, defaultModel: settings.agents?.default_models?.opencode ?? null };
  } catch {
    return { sandboxd: false, vikeyConfigured: Boolean(vikey), vikeyReachable, agent: { installed: false, connected: false, runnable: false }, model: vikey?.model ?? null, defaultModel: null };
  }
}

export async function startEngineBuild(project: EngineProject, ownerDid: string, input: EngineBuildInput) {
  if (!project.sandbox_id) throw new Error("Project has no active sandbox.");
  const readiness = await engineReadiness();
  if (!readiness.vikeyConfigured || !readiness.vikeyReachable || !readiness.agent.connected || !readiness.agent.runnable || !readiness.model) throw new Error("Vikey GLM/OpenCode is not ready on the server.");
  const db = getSupabaseAdmin();
  const inserted = await db.from("build_jobs").insert({ project_id: project.id, workspace_id: project.workspace_id, requested_by: ownerDid, prompt: input.prompt, status: "queued", provider: "vikey", model: readiness.model }).select("id").single();
  fail(inserted.error);
  const jobId = inserted.data.id as string;
  await event(jobId, "queued", { provider: "vikey", agent: "opencode", model: readiness.model });
  try {
    // This is intentionally billable only after the caller explicitly starts a build.
    const plan = await makeBuildPlan(input.prompt);
    await event(jobId, "glm.plan", { model: readiness.model });
    // The configured opencode agent is sandboxd's credential-isolated coding-agent mechanism.
    const task = await sandboxd.createTask(project.sandbox_id, { prompt: `${input.prompt}\n\nGLM implementation plan:\n${plan}`, agent: "opencode", model: readiness.model });
    fail((await db.from("build_jobs").update({ status: task.status === "queued" ? "queued" : "running", sandbox_task_id: task.id, started_at: new Date().toISOString() }).eq("id", jobId)).error);
    fail((await db.from("projects").update({ status: "building", updated_at: new Date().toISOString() }).eq("id", project.id).eq("owner_did", ownerDid)).error);
    await event(jobId, "submitted", { sandboxTaskId: task.id, status: task.status });
    return { id: jobId, status: task.status, sandboxTaskId: task.id };
  } catch (error) {
    await db.from("build_jobs").update({ status: "failed", error_code: "SANDBOXD_SUBMIT_FAILED", finished_at: new Date().toISOString() }).eq("id", jobId);
    await event(jobId, "failed", { code: "SANDBOXD_SUBMIT_FAILED" });
    throw error;
  }
}

function statusOf(task: SandboxdTask): "queued" | "running" | "succeeded" | "failed" | "cancelled" { return ["queued", "running", "succeeded", "failed", "cancelled"].includes(task.status) ? task.status as "queued" | "running" | "succeeded" | "failed" | "cancelled" : "failed"; }

export async function syncEngineJob(project: EngineProject, jobId: string) {
  const db = getSupabaseAdmin();
  const job = await db.from("build_jobs").select("id,project_id,sandbox_task_id,status,provider,model,error_code").eq("id", jobId).eq("project_id", project.id).maybeSingle();
  fail(job.error); if (!job.data) return null;
  const row = job.data as EngineJob;
  if (!row.sandbox_task_id || !project.sandbox_id) return row;
  const task = await sandboxd.getTask(project.sandbox_id, row.sandbox_task_id);
  const status = statusOf(task);
  const terminal = ["succeeded", "failed", "cancelled"].includes(status);
  fail((await db.from("build_jobs").update({ status, ...(terminal ? { finished_at: new Date().toISOString() } : {}) }).eq("id", row.id)).error);
  if (terminal) fail((await db.from("projects").update({ status: status === "succeeded" ? "ready" : "failed", updated_at: new Date().toISOString() }).eq("id", project.id)).error);
  await event(row.id, "status", { status, filesChanged: task.files_changed ?? [], buildOk: task.build_ok, previewOk: task.preview_ok });
  return { ...row, status, task };
}

export async function engineLogs(project: EngineProject) {
  if (!project.sandbox_id) throw new Error("Project has no active sandbox.");
  return sandboxd.logs(project.sandbox_id);
}
