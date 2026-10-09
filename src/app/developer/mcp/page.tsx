"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Copy, KeyRound } from "lucide-react";
import { AppAuthGate } from "@/components/app-auth-gate";
import { LoomspaceAppShell } from "@/components/loomspace-app-shell";

type Token = { id: string; revokedAt: string | null };

function CopyBlock({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => { await navigator.clipboard.writeText(value); setCopied(true); window.setTimeout(() => setCopied(false), 1500); };
  return <section className="mt-6 rounded-2xl border border-white/10 bg-white/[.035] p-5"><div className="flex items-center justify-between gap-4"><h2 className="text-base font-semibold">{label}</h2><button onClick={() => void copy()} className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-xs text-white/75 hover:bg-white/8">{copied ? <Check className="size-3.5"/> : <Copy className="size-3.5"/>}{copied ? "Copied" : "Copy"}</button></div><pre className="mt-4 overflow-x-auto rounded-xl bg-black/25 p-4 text-xs leading-5 text-white/80"><code>{value}</code></pre></section>;
}

function McpContent() {
  const [tokens, setTokens] = useState<Token[] | null>(null);
  const [token, setToken] = useState("");
  const [origin, setOrigin] = useState("");
  useEffect(() => { setOrigin(window.location.origin); void fetch("/api/developer/tokens", { cache: "no-store" }).then(async (response) => { const data = await response.json(); setTokens(response.ok ? data.tokens : []); }).catch(() => setTokens([])); }, []);
  const hasToken = Boolean(tokens?.some((item) => !item.revokedAt));
  const endpoint = `${origin || "https://your-loomspace-domain"}/mcp`;
  const trimmed = token.trim();
  const configs = useMemo(() => {
    if (!trimmed) return null;
    const authorization = `Bearer ${trimmed}`;
    return {
      "Claude Code": JSON.stringify({ mcpServers: { loomspace: { type: "http", url: endpoint, headers: { Authorization: authorization } } } }, null, 2),
      Codex: `[mcp_servers.loomspace]\nurl = "${endpoint}"\n\n[mcp_servers.loomspace.http_headers]\nAuthorization = "${authorization}"`,
      Cursor: JSON.stringify({ mcpServers: { loomspace: { url: endpoint, headers: { Authorization: authorization } } } }, null, 2),
    };
  }, [endpoint, trimmed]);
  return <div className="loom-dashboard min-h-screen"><div className="mx-auto max-w-[980px] px-6 py-12 lg:px-9"><p className="font-mono text-[10px] uppercase tracking-[.15em] text-white/40">Developer</p><h1 className="mt-3 text-4xl font-semibold tracking-[-.06em]">MCP connection</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-white/60">Connect Claude Code, Codex, or Cursor to your own Loomspace projects. The remote server only offers read-only project and build-status tools.</p>
    {tokens === null ? <p className="mt-8 text-sm text-white/50">Checking your developer tokens…</p> : !hasToken ? <section className="mt-8 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-5"><div className="flex gap-3"><KeyRound className="mt-0.5 size-5 shrink-0 text-amber-100"/><div><h2 className="font-medium text-amber-50">No token available</h2><p className="mt-1 text-sm leading-6 text-amber-50/75">Create a <code>projects:read</code> token in <a href="/developer" className="underline">Developer</a>, copy it when shown, then return here to make a configuration.</p></div></div></section> : <><section className="mt-8 rounded-2xl border border-white/10 bg-white/[.035] p-5"><h2 className="text-lg font-semibold">Enter your token locally</h2><p className="mt-2 text-sm leading-6 text-white/55">Token values are only shown when created. Paste an active <code>projects:read</code> token to generate config; it stays only in this browser page and is never sent by this form.</p><input value={token} onChange={(event) => setToken(event.target.value)} type="password" autoComplete="off" spellCheck={false} placeholder="loom_…" className="mt-4 w-full rounded-xl border border-white/10 bg-black/15 px-3 py-2.5 font-mono text-sm outline-none placeholder:text-white/35 focus:border-white/30"/></section>
      {configs && <div className="mt-8"><p className="text-sm text-white/55">Copy the matching block into your client configuration. It includes only your user-scoped token, never Loomspace infrastructure credentials.</p><CopyBlock label="Claude Code" value={configs["Claude Code"]}/><CopyBlock label="Codex" value={configs.Codex}/><CopyBlock label="Cursor" value={configs.Cursor}/></div>}</>}</div></div>;
}

export default function McpPage() { return <AppAuthGate><LoomspaceAppShell><McpContent /></LoomspaceAppShell></AppAuthGate>; }
