export type EngineProjectInput = { label: string; description: string; preset: string };
export type EngineBuildInput = { prompt: string };

const PRESETS = new Set(["react-vite", "nextjs", "node-express", "fastapi", "worker"]);

export function parseEngineProjectInput(value: unknown): EngineProjectInput | null {
  if (!value || typeof value !== "object") return null;
  const input = value as Record<string, unknown>;
  const label = typeof input.label === "string" ? input.label.trim() : "";
  const description = typeof input.description === "string" ? input.description.trim() : "";
  const preset = typeof input.preset === "string" ? input.preset : "react-vite";
  if (!label || label.length > 120 || description.length > 2_000 || !PRESETS.has(preset)) return null;
  return { label, description, preset };
}

export function parseEngineBuildInput(value: unknown): EngineBuildInput | null {
  if (!value || typeof value !== "object") return null;
  const candidate = (value as Record<string, unknown>).prompt;
  const prompt = typeof candidate === "string" ? candidate.trim() : "";
  return prompt.length >= 1 && prompt.length <= 20_000 ? { prompt } : null;
}
