import "server-only";
import { readFile } from "node:fs/promises";

const defaultEnvPath = process.env.SANDBOXD_ENV_PATH ?? "sandboxd.env";
const baseUrl = () => process.env.SANDBOXD_URL ?? "http://127.0.0.1:9090";
let tokenPromise: Promise<string> | undefined;

export class SandboxdError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = "SandboxdError";
  }
}

export type SandboxdApp = { id: string; current_sandbox_id?: string; name: string; created_at: string };
export type SandboxdSandbox = { id: string; status: string; preview?: { url?: string; status?: string }; processes?: unknown[] };
export type SandboxdFileEntry = { path: string; type: "file" | "dir"; size: number };
export type SandboxdTask = { id: string; status: string; sandbox_id: string; events_url?: string; files_changed?: string[]; agent_message_final?: string; build_ok?: boolean; build_status?: string; preview_ok?: boolean; app_healthy?: boolean };

async function sandboxdToken(): Promise<string> {
  if (!tokenPromise) tokenPromise = (async () => {
    const path = process.env.SANDBOXD_ENV_PATH ?? defaultEnvPath;
    const env = await readFile(/* turbopackIgnore: true */ path, "utf8");
    const line = env.split(/\r?\n/).find((value) => value.startsWith("SANDBOXD_API_TOKENS="));
    const raw = line?.slice("SANDBOXD_API_TOKENS=".length).trim() ?? "";
    const separator = raw.indexOf("=");
    const token = separator >= 0 ? raw.slice(separator + 1) : "";
    if (!token) throw new Error("sandboxd token is not configured");
    return token;
  })();
  return tokenPromise;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(new URL(path, baseUrl()), {
    ...init,
    headers: { authorization: `Bearer ${await sandboxdToken()}`, ...(init.body ? { "content-type": "application/json" } : {}), ...init.headers },
    cache: "no-store",
  });
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new SandboxdError(body.slice(0, 500) || `sandboxd request failed (${response.status})`, response.status);
  }
  return response.json() as Promise<T>;
}

export const sandboxd = {
  settings: () => request<{ agents?: { providers?: string[]; default_models?: Record<string, string> } }>("/v1/settings"),
  agents: () => request<{ providers?: Array<{ id: string; installed_state: string; status: string; runnable: boolean }> }>("/v1/agents"),
  presets: () => request<{ presets?: Array<{ id: string }> }>("/v1/presets"),
  createApp: (body: Record<string, unknown>) => request<SandboxdApp>("/v1/apps", { method: "POST", body: JSON.stringify(body) }),
  createSandbox: (appId: string, body: Record<string, unknown>) => request<SandboxdSandbox>(`/v1/apps/${encodeURIComponent(appId)}/sandbox`, { method: "POST", body: JSON.stringify(body) }),
  getSandbox: (sandboxId: string) => request<SandboxdSandbox>(`/v1/sandboxes/${encodeURIComponent(sandboxId)}`),
  writeFile: async (sandboxId: string, path: string, content: string) => {
    const response = await fetch(new URL(`/v1/sandboxes/${encodeURIComponent(sandboxId)}/files?path=${encodeURIComponent(path)}`, baseUrl()), { method: "PUT", headers: { authorization: `Bearer ${await sandboxdToken()}`, "content-type": "text/plain" }, body: content, cache: "no-store" });
    if (!response.ok) throw new SandboxdError(`sandboxd file write failed (${response.status})`, response.status);
  },
  createTask: (sandboxId: string, body: Record<string, unknown>) => request<SandboxdTask>(`/v1/sandboxes/${encodeURIComponent(sandboxId)}/tasks`, { method: "POST", body: JSON.stringify(body) }),
  getTask: (sandboxId: string, taskId: string) => request<SandboxdTask>(`/v1/sandboxes/${encodeURIComponent(sandboxId)}/tasks/${encodeURIComponent(taskId)}`),
  taskEvents: (taskId: string) => request<unknown>(`/v1/tasks/${encodeURIComponent(taskId)}/events`),
  logs: (sandboxId: string) => request<{ process: string; lines: string[] }>(`/v1/sandboxes/${encodeURIComponent(sandboxId)}/processes/web/logs`),
  listFiles: (sandboxId: string, options: { recursive?: boolean } = {}) => request<{ entries: SandboxdFileEntry[] }>(`/v1/sandboxes/${encodeURIComponent(sandboxId)}/files?recursive=${options.recursive ? "true" : "false"}`),
  /** Reads an app-relative file with a hard byte cap, so oversized bodies are never fully buffered. */
  readFile: async (sandboxId: string, filePath: string, maxBytes: number): Promise<Uint8Array> => {
    const response = await fetch(new URL(`/v1/sandboxes/${encodeURIComponent(sandboxId)}/files/content?path=${encodeURIComponent(filePath)}`, baseUrl()), { headers: { authorization: `Bearer ${await sandboxdToken()}` }, cache: "no-store" });
    if (!response.ok || !response.body) throw new SandboxdError(`sandboxd file read failed (${response.status})`, response.status);
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) { await reader.cancel(); throw new SandboxdError("SOURCE_EXPORT_TOO_LARGE", 413); }
      chunks.push(value);
    }
    const out = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) { out.set(chunk, offset); offset += chunk.byteLength; }
    return out;
  },
};
