import { createHash, randomBytes, randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";

const databaseDir = process.env.LOOMSPACE_DATA_DIR ?? "data";
mkdirSync(databaseDir, { recursive: true, mode: 0o700 });
const database = new DatabaseSync(`${databaseDir}/ownership.sqlite`);
// Next evaluates route modules in parallel during builds; wait for concurrent schema setup.
database.exec("PRAGMA busy_timeout = 5000;");

database.exec(`
  CREATE TABLE IF NOT EXISTS project_owners (
    project_id TEXT PRIMARY KEY NOT NULL,
    owner_id TEXT NOT NULL,
    created_at TEXT NOT NULL
  ) STRICT;
  CREATE INDEX IF NOT EXISTS project_owners_owner_idx ON project_owners(owner_id);
  CREATE TABLE IF NOT EXISTS owner_action_limits (
    owner_id TEXT NOT NULL,
    action TEXT NOT NULL,
    created_at_ms INTEGER NOT NULL
  ) STRICT;
  CREATE INDEX IF NOT EXISTS owner_action_limits_idx ON owner_action_limits(owner_id, action, created_at_ms);

  CREATE TABLE IF NOT EXISTS credit_accounts (
    owner_did TEXT PRIMARY KEY NOT NULL,
    balance_microcredits INTEGER NOT NULL DEFAULT 0 CHECK(balance_microcredits >= 0),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  ) STRICT;
  CREATE TABLE IF NOT EXISTS credit_ledger_transactions (
    id TEXT PRIMARY KEY NOT NULL,
    owner_did TEXT NOT NULL REFERENCES credit_accounts(owner_did),
    amount_microcredits INTEGER NOT NULL CHECK(amount_microcredits != 0),
    kind TEXT NOT NULL CHECK(kind IN ('grant', 'debit', 'reservation_hold', 'reservation_release')),
    reference TEXT,
    reservation_id TEXT,
    created_at TEXT NOT NULL
  ) STRICT;
  CREATE INDEX IF NOT EXISTS credit_ledger_owner_idx ON credit_ledger_transactions(owner_did, created_at);
  CREATE UNIQUE INDEX IF NOT EXISTS credit_ledger_reference_idx ON credit_ledger_transactions(reference) WHERE reference IS NOT NULL;
  CREATE TRIGGER IF NOT EXISTS credit_ledger_no_update BEFORE UPDATE ON credit_ledger_transactions BEGIN SELECT RAISE(ABORT, 'credit ledger is immutable'); END;
  CREATE TRIGGER IF NOT EXISTS credit_ledger_no_delete BEFORE DELETE ON credit_ledger_transactions BEGIN SELECT RAISE(ABORT, 'credit ledger is immutable'); END;

  CREATE TABLE IF NOT EXISTS credit_reservations (
    id TEXT PRIMARY KEY NOT NULL,
    owner_did TEXT NOT NULL REFERENCES credit_accounts(owner_did),
    amount_microcredits INTEGER NOT NULL CHECK(amount_microcredits > 0),
    reference TEXT NOT NULL UNIQUE,
    expires_at TEXT,
    created_at TEXT NOT NULL
  ) STRICT;
  CREATE INDEX IF NOT EXISTS credit_reservations_owner_idx ON credit_reservations(owner_did, created_at);
  CREATE TRIGGER IF NOT EXISTS credit_reservations_no_update BEFORE UPDATE ON credit_reservations BEGIN SELECT RAISE(ABORT, 'credit reservations are immutable'); END;
  CREATE TRIGGER IF NOT EXISTS credit_reservations_no_delete BEFORE DELETE ON credit_reservations BEGIN SELECT RAISE(ABORT, 'credit reservations are immutable'); END;

  CREATE TABLE IF NOT EXISTS developer_api_tokens (
    id TEXT PRIMARY KEY NOT NULL,
    owner_did TEXT NOT NULL,
    name TEXT NOT NULL,
    token_digest TEXT NOT NULL UNIQUE,
    scopes_json TEXT NOT NULL,
    created_at TEXT NOT NULL,
    revoked_at TEXT,
    last_used_at TEXT
  ) STRICT;
  CREATE INDEX IF NOT EXISTS developer_api_tokens_owner_idx ON developer_api_tokens(owner_did, created_at);
`);

type OwnerRow = { owner_id: string };
type ProjectRow = { project_id: string };
type AccountRow = { balance_microcredits: number };
type TokenRow = { id: string; name: string; scopes_json: string; created_at: string; revoked_at: string | null; last_used_at: string | null };

export const DEVELOPER_TOKEN_SCOPES = ["projects:read", "projects:write"] as const;
export type DeveloperTokenScope = typeof DEVELOPER_TOKEN_SCOPES[number];
export type DeveloperTokenMetadata = { id: string; name: string; scopes: DeveloperTokenScope[]; createdAt: string; revokedAt: string | null; lastUsedAt: string | null };

function now(): string { return new Date().toISOString(); }
function requireDid(ownerDid: string): void { if (!ownerDid || ownerDid.length > 512) throw new Error("Invalid account identity."); }
function requireMicrocredits(amount: number): void { if (!Number.isSafeInteger(amount) || amount <= 0) throw new Error("Credits must be a positive integer number of microcredits."); }
function parseScopes(scopesJson: string): DeveloperTokenScope[] { try { const parsed = JSON.parse(scopesJson); return Array.isArray(parsed) ? parsed.filter((scope): scope is DeveloperTokenScope => typeof scope === "string" && (DEVELOPER_TOKEN_SCOPES as readonly string[]).includes(scope)) : []; } catch { return []; } }
function tokenMetadata(row: TokenRow): DeveloperTokenMetadata { return { id: row.id, name: row.name, scopes: parseScopes(row.scopes_json), createdAt: row.created_at, revokedAt: row.revoked_at, lastUsedAt: row.last_used_at }; }

function ensureAccount(ownerDid: string): void {
  const timestamp = now();
  database.prepare("INSERT OR IGNORE INTO credit_accounts(owner_did, balance_microcredits, created_at, updated_at) VALUES (?, 0, ?, ?)").run(ownerDid, timestamp, timestamp);
}

export function recordProjectOwner(projectId: string, ownerId: string): void {
  database.prepare("INSERT OR IGNORE INTO project_owners(project_id, owner_id, created_at) VALUES (?, ?, ?)").run(projectId, ownerId, now());
}

export function userOwnsProject(ownerId: string, projectId: string): boolean {
  const row = database.prepare("SELECT owner_id FROM project_owners WHERE project_id = ?").get(projectId) as OwnerRow | undefined;
  return row?.owner_id === ownerId;
}

export function visibleProjectIds(ownerId: string): Set<string> {
  const rows = database.prepare("SELECT project_id FROM project_owners WHERE owner_id = ?").all(ownerId) as ProjectRow[];
  return new Set(rows.map((row) => row.project_id));
}

/** Returns zero for an identity that has never received an operator grant. */
export function getCreditBalance(ownerDid: string): number {
  requireDid(ownerDid);
  return (database.prepare("SELECT balance_microcredits FROM credit_accounts WHERE owner_did = ?").get(ownerDid) as AccountRow | undefined)?.balance_microcredits ?? 0;
}

/** Server-only alpha operation. It is deliberately the only path that credits an account. */
export function grantCredits(ownerDid: string, amountMicrocredits: number, reference: string): number {
  requireDid(ownerDid); requireMicrocredits(amountMicrocredits);
  if (!reference || reference.length > 200) throw new Error("A grant reference is required.");
  database.exec("BEGIN IMMEDIATE");
  try {
    ensureAccount(ownerDid);
    database.prepare("INSERT INTO credit_ledger_transactions(id, owner_did, amount_microcredits, kind, reference, reservation_id, created_at) VALUES (?, ?, ?, 'grant', ?, NULL, ?)").run(randomUUID(), ownerDid, amountMicrocredits, reference, now());
    database.prepare("UPDATE credit_accounts SET balance_microcredits = balance_microcredits + ?, updated_at = ? WHERE owner_did = ?").run(amountMicrocredits, now(), ownerDid);
    database.exec("COMMIT");
    return getCreditBalance(ownerDid);
  } catch (error) { database.exec("ROLLBACK"); throw error; }
}

/**
 * Creates an immutable reservation record and matching ledger event. Callers must wire this
 * into paid operations before relying on it to block spending.
 */
export function reserveCredits(ownerDid: string, amountMicrocredits: number, reference: string, expiresAt?: string): string {
  requireDid(ownerDid); requireMicrocredits(amountMicrocredits);
  if (!reference || reference.length > 200) throw new Error("A reservation reference is required.");
  const reservationId = randomUUID();
  database.exec("BEGIN IMMEDIATE");
  try {
    ensureAccount(ownerDid);
    database.prepare("INSERT INTO credit_reservations(id, owner_did, amount_microcredits, reference, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?)").run(reservationId, ownerDid, amountMicrocredits, reference, expiresAt ?? null, now());
    database.prepare("INSERT INTO credit_ledger_transactions(id, owner_did, amount_microcredits, kind, reference, reservation_id, created_at) VALUES (?, ?, ?, 'reservation_hold', ?, ?, ?)").run(randomUUID(), ownerDid, -amountMicrocredits, `reservation:${reference}`, reservationId, now());
    database.exec("COMMIT");
    return reservationId;
  } catch (error) { database.exec("ROLLBACK"); throw error; }
}

export function hashDeveloperToken(token: string): string { return createHash("sha256").update(token).digest("hex"); }

export function createDeveloperToken(ownerDid: string, name: string, scopes: DeveloperTokenScope[]): { token: string; metadata: DeveloperTokenMetadata } {
  requireDid(ownerDid);
  const cleanName = name.trim();
  if (!cleanName || cleanName.length > 80) throw new Error("Token name must be between 1 and 80 characters.");
  const uniqueScopes = [...new Set(scopes)];
  if (!uniqueScopes.length || uniqueScopes.length > DEVELOPER_TOKEN_SCOPES.length || uniqueScopes.some((scope) => !(DEVELOPER_TOKEN_SCOPES as readonly string[]).includes(scope))) throw new Error("Invalid token scopes.");
  const token = `loom_${randomBytes(32).toString("base64url")}`;
  const createdAt = now();
  const row: TokenRow = { id: randomUUID(), name: cleanName, scopes_json: JSON.stringify(uniqueScopes), created_at: createdAt, revoked_at: null, last_used_at: null };
  database.prepare("INSERT INTO developer_api_tokens(id, owner_did, name, token_digest, scopes_json, created_at, revoked_at, last_used_at) VALUES (?, ?, ?, ?, ?, ?, NULL, NULL)").run(row.id, ownerDid, row.name, hashDeveloperToken(token), row.scopes_json, createdAt);
  return { token, metadata: tokenMetadata(row) };
}

export function listDeveloperTokens(ownerDid: string): DeveloperTokenMetadata[] {
  requireDid(ownerDid);
  const rows = database.prepare("SELECT id, name, scopes_json, created_at, revoked_at, last_used_at FROM developer_api_tokens WHERE owner_did = ? ORDER BY created_at DESC").all(ownerDid) as TokenRow[];
  return rows.map(tokenMetadata);
}

/** Looks up an opaque bearer token by its SHA-256 digest; plaintext tokens are never stored. */
export function findDeveloperToken(token: string): { ownerDid: string; scopes: DeveloperTokenScope[] } | null {
  if (!token || token.length > 512) return null;
  const row = database.prepare("SELECT owner_did, scopes_json FROM developer_api_tokens WHERE token_digest = ? AND revoked_at IS NULL").get(hashDeveloperToken(token)) as { owner_did: string; scopes_json: string } | undefined;
  if (!row) return null;
  database.prepare("UPDATE developer_api_tokens SET last_used_at = ? WHERE token_digest = ?").run(now(), hashDeveloperToken(token));
  return { ownerDid: row.owner_did, scopes: parseScopes(row.scopes_json) };
}

export function revokeDeveloperToken(ownerDid: string, tokenId: string): boolean {
  requireDid(ownerDid);
  if (!tokenId) return false;
  const result = database.prepare("UPDATE developer_api_tokens SET revoked_at = ? WHERE id = ? AND owner_did = ? AND revoked_at IS NULL").run(now(), tokenId, ownerDid);
  return result.changes === 1;
}

/** ponytail: local SQLite limiter; move to Redis only once app runs across several processes. */
export function consumeAction(ownerId: string, action: string, max: number, windowMs: number): { ok: true } | { ok: false; retryAfterSeconds: number } {
  const timestamp = Date.now();
  const since = timestamp - windowMs;
  database.prepare("DELETE FROM owner_action_limits WHERE created_at_ms < ?").run(since);
  const rows = database.prepare("SELECT created_at_ms FROM owner_action_limits WHERE owner_id = ? AND action = ? ORDER BY created_at_ms ASC").all(ownerId, action) as { created_at_ms: number }[];
  if (rows.length >= max) return { ok: false, retryAfterSeconds: Math.max(1, Math.ceil((rows[0]!.created_at_ms + windowMs - timestamp) / 1000)) };
  database.prepare("INSERT INTO owner_action_limits(owner_id, action, created_at_ms) VALUES (?, ?, ?)").run(ownerId, action, timestamp);
  return { ok: true };
}
