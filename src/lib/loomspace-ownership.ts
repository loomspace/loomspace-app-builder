import "server-only";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import * as sqlite from "@/lib/loomspace-ownership-sqlite";

export const DEVELOPER_TOKEN_SCOPES = ["projects:read", "projects:write"] as const;
export type DeveloperTokenScope = typeof DEVELOPER_TOKEN_SCOPES[number];
export type DeveloperTokenMetadata = { id: string; name: string; scopes: DeveloperTokenScope[]; createdAt: string; revokedAt: string | null; lastUsedAt: string | null };
type TokenRow = { id: string; name: string; scopes: DeveloperTokenScope[]; created_at: string; revoked_at: string | null; last_used_at: string | null };

const PERSONAL_WORKSPACE = "Personal workspace";
const now = () => new Date().toISOString();
const configured = () => Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SECRET_KEY);
const unavailable = (error: unknown) => !configured() || error instanceof TypeError || error instanceof Error && /supabase is not configured|fetch failed|network|timeout|econn|enotfound|socket/i.test(error.message);
function fail(error: { message: string } | null) { if (error) throw new Error(error.message); }
function requireDid(ownerDid: string) { if (!ownerDid || ownerDid.length > 512) throw new Error("Invalid account identity."); }
function requireMicrocredits(amount: number) { if (!Number.isSafeInteger(amount) || amount <= 0) throw new Error("Credits must be a positive integer number of microcredits."); }
function parseScopes(scopes: unknown): DeveloperTokenScope[] { return Array.isArray(scopes) ? scopes.filter((scope): scope is DeveloperTokenScope => typeof scope === "string" && (DEVELOPER_TOKEN_SCOPES as readonly string[]).includes(scope)) : []; }
function metadata(row: TokenRow): DeveloperTokenMetadata { return { id: row.id, name: row.name, scopes: parseScopes(row.scopes), createdAt: row.created_at, revokedAt: row.revoked_at, lastUsedAt: row.last_used_at }; }

/** Creates the legacy owner's default workspace before any platform record is written. */
async function workspaceFor(ownerDid: string): Promise<string> {
  const db = getSupabaseAdmin();
  fail((await db.from("profiles").upsert({ privy_did: ownerDid, updated_at: now() }, { onConflict: "privy_did" })).error);
  const existing = await db.from("workspaces").select("id").eq("owner_did", ownerDid).eq("name", PERSONAL_WORKSPACE).limit(1).maybeSingle();
  fail(existing.error);
  let workspaceId = existing.data?.id as string | undefined;
  if (!workspaceId) {
    const inserted = await db.from("workspaces").insert({ owner_did: ownerDid, name: PERSONAL_WORKSPACE }).select("id").single();
    fail(inserted.error); workspaceId = inserted.data.id as string;
  }
  fail((await db.from("workspace_members").upsert({ workspace_id: workspaceId, privy_did: ownerDid, role: "owner" }, { onConflict: "workspace_id,privy_did" })).error);
  fail((await db.from("credit_accounts").upsert({ workspace_id: workspaceId }, { onConflict: "workspace_id", ignoreDuplicates: true })).error);
  return workspaceId;
}

export async function recordProjectOwner(projectId: string, ownerId: string): Promise<void> {
  try { const workspaceId = await workspaceFor(ownerId); fail((await getSupabaseAdmin().from("projects").upsert({ id: projectId, workspace_id: workspaceId, owner_did: ownerId, engine: "legacy" }, { onConflict: "id", ignoreDuplicates: true })).error); }
  catch (error) { if (unavailable(error)) return sqlite.recordProjectOwner(projectId, ownerId); throw error; }
}
export async function userOwnsProject(ownerId: string, projectId: string): Promise<boolean> {
  try { const result = await getSupabaseAdmin().from("projects").select("id").eq("id", projectId).eq("owner_did", ownerId).maybeSingle(); fail(result.error); return Boolean(result.data); }
  catch (error) { if (unavailable(error)) return sqlite.userOwnsProject(ownerId, projectId); throw error; }
}
export async function visibleProjectIds(ownerId: string): Promise<Set<string>> {
  try { const result = await getSupabaseAdmin().from("projects").select("id").eq("owner_did", ownerId); fail(result.error); return new Set((result.data ?? []).map((row: { id: string }) => row.id)); }
  catch (error) { if (unavailable(error)) return sqlite.visibleProjectIds(ownerId); throw error; }
}
export async function getCreditBalance(ownerDid: string): Promise<number> {
  requireDid(ownerDid);
  try { const workspaceId = await workspaceFor(ownerDid); const result = await getSupabaseAdmin().from("credit_accounts").select("balance_microcredits").eq("workspace_id", workspaceId).single(); fail(result.error); return Number(result.data.balance_microcredits); }
  catch (error) { if (unavailable(error)) return sqlite.getCreditBalance(ownerDid); throw error; }
}
export async function grantCredits(ownerDid: string, amountMicrocredits: number, reference: string): Promise<number> {
  requireDid(ownerDid); requireMicrocredits(amountMicrocredits); if (!reference || reference.length > 200) throw new Error("A grant reference is required.");
  try { const workspaceId = await workspaceFor(ownerDid); const db = getSupabaseAdmin(); fail((await db.from("credit_ledger_transactions").insert({ id: randomUUID(), workspace_id: workspaceId, amount_microcredits: amountMicrocredits, kind: "grant", reference })).error); const account = await db.from("credit_accounts").select("balance_microcredits").eq("workspace_id", workspaceId).single(); fail(account.error); const balance = Number(account.data.balance_microcredits) + amountMicrocredits; fail((await db.from("credit_accounts").update({ balance_microcredits: balance, updated_at: now() }).eq("workspace_id", workspaceId)).error); return balance; }
  catch (error) { if (unavailable(error)) return sqlite.grantCredits(ownerDid, amountMicrocredits, reference); throw error; }
}
export async function reserveCredits(ownerDid: string, amountMicrocredits: number, reference: string, expiresAt?: string): Promise<string> {
  requireDid(ownerDid); requireMicrocredits(amountMicrocredits); if (!reference || reference.length > 200) throw new Error("A reservation reference is required.");
  try { const workspaceId = await workspaceFor(ownerDid); const id = randomUUID(); const db = getSupabaseAdmin(); fail((await db.from("credit_reservations").insert({ id, workspace_id: workspaceId, amount_microcredits: amountMicrocredits, reference, expires_at: expiresAt ?? null })).error); fail((await db.from("credit_ledger_transactions").insert({ id: randomUUID(), workspace_id: workspaceId, amount_microcredits: -amountMicrocredits, kind: "reservation_hold", reference: `reservation:${reference}`, reservation_id: id })).error); return id; }
  catch (error) { if (unavailable(error)) return sqlite.reserveCredits(ownerDid, amountMicrocredits, reference, expiresAt); throw error; }
}
export function hashDeveloperToken(token: string): string { return createHash("sha256").update(token).digest("hex"); }
export async function createDeveloperToken(ownerDid: string, name: string, scopes: DeveloperTokenScope[]): Promise<{ token: string; metadata: DeveloperTokenMetadata }> {
  requireDid(ownerDid); const cleanName = name.trim(); const uniqueScopes = [...new Set(scopes)]; if (!cleanName || cleanName.length > 80 || !uniqueScopes.length || uniqueScopes.length > DEVELOPER_TOKEN_SCOPES.length || uniqueScopes.some((scope) => !(DEVELOPER_TOKEN_SCOPES as readonly string[]).includes(scope))) throw new Error("Invalid token scopes.");
  const token = `loom_${randomBytes(32).toString("base64url")}`; const row: TokenRow = { id: randomUUID(), name: cleanName, scopes: uniqueScopes, created_at: now(), revoked_at: null, last_used_at: null };
  try { const workspaceId = await workspaceFor(ownerDid); fail((await getSupabaseAdmin().from("developer_api_tokens").insert({ id: row.id, workspace_id: workspaceId, owner_did: ownerDid, name: row.name, token_digest: hashDeveloperToken(token), scopes: row.scopes, created_at: row.created_at })).error); return { token, metadata: metadata(row) }; }
  catch (error) { if (unavailable(error)) return sqlite.createDeveloperToken(ownerDid, name, scopes); throw error; }
}
export async function listDeveloperTokens(ownerDid: string): Promise<DeveloperTokenMetadata[]> {
  requireDid(ownerDid);
  try { const result = await getSupabaseAdmin().from("developer_api_tokens").select("id,name,scopes,created_at,revoked_at,last_used_at").eq("owner_did", ownerDid).order("created_at", { ascending: false }); fail(result.error); return (result.data ?? []).map((row: TokenRow) => metadata(row)); }
  catch (error) { if (unavailable(error)) return sqlite.listDeveloperTokens(ownerDid); throw error; }
}
export async function findDeveloperToken(token: string): Promise<{ ownerDid: string; scopes: DeveloperTokenScope[] } | null> {
  if (!token || token.length > 512) return null;
  try { const db = getSupabaseAdmin(); const result = await db.from("developer_api_tokens").select("id,owner_did,scopes").eq("token_digest", hashDeveloperToken(token)).is("revoked_at", null).maybeSingle(); fail(result.error); if (!result.data) return null; fail((await db.from("developer_api_tokens").update({ last_used_at: now() }).eq("id", result.data.id)).error); return { ownerDid: result.data.owner_did, scopes: parseScopes(result.data.scopes) }; }
  catch (error) { if (unavailable(error)) return sqlite.findDeveloperToken(token); throw error; }
}
export async function revokeDeveloperToken(ownerDid: string, tokenId: string): Promise<boolean> {
  requireDid(ownerDid); if (!tokenId) return false;
  try { const result = await getSupabaseAdmin().from("developer_api_tokens").update({ revoked_at: now() }).eq("id", tokenId).eq("owner_did", ownerDid).is("revoked_at", null).select("id"); fail(result.error); return (result.data?.length ?? 0) === 1; }
  catch (error) { if (unavailable(error)) return sqlite.revokeDeveloperToken(ownerDid, tokenId); throw error; }
}
/** ponytail: local SQLite limiter; move to Redis only once app runs across several processes. */
export function consumeAction(ownerId: string, action: string, max: number, windowMs: number): { ok: true } | { ok: false; retryAfterSeconds: number } { return sqlite.consumeAction(ownerId, action, max, windowMs); }
