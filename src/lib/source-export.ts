import "server-only";
import { zipSync } from "fflate";
import { sandboxd, type SandboxdFileEntry } from "@/lib/sandboxd-server";

export const MAX_FILE_BYTES = 2 * 1024 * 1024;
export const MAX_ARCHIVE_BYTES = 50 * 1024 * 1024;
const MAX_FILES = 2_000;
const EXCLUDED_SEGMENTS = new Set(["node_modules", ".git", "dist", ".vite", ".next", ".cache", ".turbo", "coverage", "build", "out"]);

function safeExportPath(value: string): string | null {
  if (!value || value.length > 1_024 || value.includes("\\") || value.startsWith("/")) return null;
  const segments = value.split("/");
  if (segments.some((part) => !part || part === "." || part === ".." || part.startsWith(".env") || EXCLUDED_SEGMENTS.has(part))) return null;
  return segments.join("/");
}

/** Fetch only the sandboxd app tree, then build a bounded archive in memory. */
export async function exportSandboxSource(sandboxId: string): Promise<Uint8Array> {
  const listing = await sandboxd.listFiles(sandboxId, { recursive: true });
  const files = (listing.entries as SandboxdFileEntry[])
    .filter((entry) => entry.type === "file")
    .map((entry) => ({ ...entry, path: safeExportPath(entry.path) }))
    .filter((entry): entry is SandboxdFileEntry & { path: string } => Boolean(entry.path));
  if (!files.length) throw new Error("SOURCE_EXPORT_EMPTY");
  if (files.length > MAX_FILES) throw new Error("SOURCE_EXPORT_TOO_LARGE");
  let total = 0;
  for (const file of files) {
    if (!Number.isSafeInteger(file.size) || file.size < 0 || file.size > MAX_FILE_BYTES) throw new Error("SOURCE_EXPORT_TOO_LARGE");
    total += file.size;
    if (total > MAX_ARCHIVE_BYTES) throw new Error("SOURCE_EXPORT_TOO_LARGE");
  }
  const archive: Record<string, Uint8Array> = {};
  for (const file of files) archive[file.path] = await sandboxd.readFile(sandboxId, file.path, MAX_FILE_BYTES);
  const zipped = zipSync(archive, { level: 6 });
  if (zipped.byteLength > MAX_ARCHIVE_BYTES) throw new Error("SOURCE_EXPORT_TOO_LARGE");
  return zipped;
}
