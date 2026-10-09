import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const directory = mkdtempSync(join(tmpdir(), "loomspace-ledger-"));
process.env.LOOMSPACE_DATA_DIR = directory;
delete process.env.NEXT_PUBLIC_SUPABASE_URL;
delete process.env.SUPABASE_SECRET_KEY;
// The repository's fallback implementation is intentionally executable without Next.
const ledger = await import("../src/lib/loomspace-ownership-sqlite.ts");

try {
  const did = "did:privy:self-check";
  if (await ledger.getCreditBalance(did) !== 0) throw new Error("New accounts must report zero balance.");
  if (await ledger.grantCredits(did, 2500000, "self-check-grant") !== 2500000) throw new Error("Grant balance mismatch.");
  let duplicateRejected = false;
  try { await ledger.grantCredits(did, 1, "self-check-grant"); } catch { duplicateRejected = true; }
  if (!duplicateRejected) throw new Error("Ledger references must be unique.");
  const created = await ledger.createDeveloperToken(did, "self-check", ["projects:read"]);
  if (!created.token.startsWith("loom_") || ledger.hashDeveloperToken(created.token).length !== 64) throw new Error("Token generation or hashing failed.");
  const tokens = await ledger.listDeveloperTokens(did);
  if (tokens.length !== 1 || "token" in tokens[0]) throw new Error("Token metadata exposed a secret.");
  if (!(await ledger.revokeDeveloperToken(did, created.metadata.id)) || await ledger.revokeDeveloperToken("did:privy:other", created.metadata.id)) throw new Error("Token revocation ownership failed.");
  console.log("ledger-token self-check passed");
} finally { rmSync(directory, { recursive: true, force: true }); }
