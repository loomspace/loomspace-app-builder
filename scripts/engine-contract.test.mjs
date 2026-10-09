import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const sourcePath = new URL("../src/lib/engine-input.ts", import.meta.url);

test("engine input validation accepts bounded prompts and allowlisted presets", async () => {
  const source = await readFile(sourcePath, "utf8");
  assert.match(source, /export function parseEngineProjectInput/);
  assert.match(source, /export function parseEngineBuildInput/);
  assert.match(source, /const PRESETS = new Set/);
  assert.match(source, /prompt\.length >= 1 && prompt\.length <= 20_000/);
});
