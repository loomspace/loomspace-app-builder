"use client";

import { useEffect, useState } from "react";
import { Check, Copy, KeyRound, Plus, ShieldAlert, Trash2 } from "lucide-react";
import { AppAuthGate } from "@/components/app-auth-gate";
import { LoomspaceAppShell } from "@/components/loomspace-app-shell";

type Token = { id: string; name: string; scopes: string[]; createdAt: string; revokedAt: string | null; lastUsedAt: string | null };

function DeveloperContent() {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [name, setName] = useState("");
  const [secret, setSecret] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const load = async () => { const response = await fetch("/api/developer/tokens", { cache: "no-store" }); const data = await response.json(); if (response.ok) setTokens(data.tokens); else setError(data.error ?? "Unable to load tokens."); };
  useEffect(() => { void load(); }, []);
  const create = async (event: React.FormEvent) => { event.preventDefault(); setBusy(true); setError(""); setSecret(null); try { const response = await fetch("/api/developer/tokens", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, scopes: ["projects:read"] }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error ?? "Unable to create token."); setSecret(data.secret); setName(""); await load(); } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to create token."); } finally { setBusy(false); } };
  const revoke = async (tokenId: string) => { setBusy(true); setError(""); try { const response = await fetch("/api/developer/tokens", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tokenId }) }); if (!response.ok) { const data = await response.json(); throw new Error(data.error ?? "Unable to revoke token."); } await load(); } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to revoke token."); } finally { setBusy(false); } };
  const copy = async () => { if (secret) await navigator.clipboard.writeText(secret); };
  return <div className="loom-dashboard min-h-screen"><div className="mx-auto max-w-[980px] px-6 py-12 lg:px-9"><p className="font-mono text-[10px] uppercase tracking-[.15em] text-white/40">Developer</p><h1 className="mt-3 text-4xl font-semibold tracking-[-.06em]">API tokens</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-white/60">Create user-scoped credentials for upcoming Loomspace developer features. External API access is not enabled yet, so a token cannot call a public endpoint today.</p>
    {error && <p role="alert" className="mt-6 rounded-xl border border-red-400/25 bg-red-400/10 px-4 py-3 text-sm text-red-100">{error}</p>}
    {secret && <section className="mt-8 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-5"><div className="flex gap-3"><ShieldAlert className="mt-0.5 size-5 shrink-0 text-emerald-200"/><div className="min-w-0"><h2 className="font-medium text-emerald-50">Copy this token now</h2><p className="mt-1 text-sm text-emerald-50/75">It will not be shown again.</p><div className="mt-4 flex gap-2"><code className="min-w-0 flex-1 overflow-x-auto rounded-lg bg-black/25 px-3 py-2 text-xs text-emerald-50">{secret}</code><button type="button" onClick={() => void copy()} className="rounded-lg border border-emerald-100/20 px-3 text-sm text-emerald-50"><Copy className="size-4"/></button><button type="button" onClick={() => setSecret(null)} className="rounded-lg border border-emerald-100/20 px-3 text-sm text-emerald-50"><Check className="size-4"/></button></div></div></div></section>}
    <section className="mt-8 rounded-2xl border border-white/10 bg-white/[.035] p-5"><h2 className="text-lg font-semibold">Create token</h2><form onSubmit={create} className="mt-4 flex flex-col gap-3 sm:flex-row"><input value={name} onChange={(event) => setName(event.target.value)} maxLength={80} required placeholder="Token name, e.g. local integration" className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/15 px-3 py-2.5 text-sm outline-none placeholder:text-white/35 focus:border-white/30"/><button disabled={busy} className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-black disabled:opacity-50"><Plus className="size-4"/>Create token</button></form><p className="mt-3 text-xs text-white/45">Scope: <code>projects:read</code>. More scopes may be made available with supported endpoints.</p></section>
    <section className="mt-10"><div className="flex items-center gap-2"><KeyRound className="size-4 text-white/55"/><h2 className="text-lg font-semibold">Your tokens</h2></div><div className="mt-4 overflow-hidden rounded-2xl border border-white/10">{tokens.length === 0 ? <p className="p-6 text-sm text-white/50">No developer tokens yet.</p> : tokens.map((token) => <div key={token.id} className="flex flex-col gap-3 border-b border-white/10 p-5 last:border-0 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-medium">{token.name}</p><p className="mt-1 text-xs text-white/45">{token.scopes.join(", ")} · Created {new Date(token.createdAt).toLocaleDateString()} {token.revokedAt ? "· Revoked" : ""}</p></div>{!token.revokedAt && <button disabled={busy} onClick={() => void revoke(token.id)} className="inline-flex items-center gap-2 self-start rounded-lg border border-white/15 px-3 py-2 text-sm text-white/75 hover:bg-white/8 disabled:opacity-50"><Trash2 className="size-4"/>Revoke</button>}</div>)}</div></section>
  </div></div>;
}

export default function DeveloperPage() { return <AppAuthGate><LoomspaceAppShell><DeveloperContent /></LoomspaceAppShell></AppAuthGate>; }
