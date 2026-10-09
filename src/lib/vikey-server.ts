import "server-only";

type VikeyConfig = { apiKey: string; baseUrl: string; model: string };

export function getVikeyConfig(): VikeyConfig | null {
  const apiKey = process.env.GLM_API_KEY ?? process.env.VIKEY_API_KEY ?? process.env.HERMES_CUSTOM_API_VIKEY_AI_API_KEY ?? "";
  if (!apiKey) return null;
  return { apiKey, baseUrl: process.env.VIKEY_BASE_URL ?? process.env.GLM_BASE_URL ?? "https://api.vikey.ai/v1", model: process.env.ENGINE_GLM_MODEL ?? "glm/glm-5.3-flash" };
}

export async function vikeyReady(): Promise<boolean> {
  const config = getVikeyConfig();
  if (!config) return false;
  try {
    const response = await fetch(new URL("models", `${config.baseUrl.replace(/\/$/, "")}/`), { headers: { authorization: `Bearer ${config.apiKey}` }, signal: AbortSignal.timeout(10_000), cache: "no-store" });
    return response.ok;
  } catch { return false; }
}

/** Called only for a user-requested build; it intentionally makes a billable GLM request. */
export async function makeBuildPlan(prompt: string): Promise<string> {
  const config = getVikeyConfig();
  if (!config) throw new Error("Vikey GLM is not configured.");
  const response = await fetch(new URL("chat/completions", `${config.baseUrl.replace(/\/$/, "")}/`), {
    method: "POST",
    headers: { authorization: `Bearer ${config.apiKey}`, "content-type": "application/json" },
    body: JSON.stringify({ model: config.model, temperature: 0.2, max_tokens: 1_200, messages: [{ role: "system", content: "You are the planning stage of a coding agent. Produce a concise implementation plan for the sandbox coding agent. Do not claim edits were made." }, { role: "user", content: prompt }] }),
    signal: AbortSignal.timeout(90_000),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Vikey GLM request failed (${response.status}).`);
  const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
  const plan = payload.choices?.[0]?.message?.content?.trim();
  if (!plan) throw new Error("Vikey GLM returned no build plan.");
  return plan.slice(0, 12_000);
}
