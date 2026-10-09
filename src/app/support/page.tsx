"use client";

import { useEffect, useState } from "react";
import { LifeBuoy, MessageSquare, Plus, Send } from "lucide-react";
import { AppAuthGate } from "@/components/app-auth-gate";
import { LoomspaceAppShell } from "@/components/loomspace-app-shell";

type Ticket = { id: string; subject: string; status: string; created_at: string; updated_at: string };
type Message = { id: string; author_role: string; body: string; created_at: string };

function SupportContent() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [active, setActive] = useState<{ ticket: Ticket; messages: Message[] } | null>(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [reply, setReply] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const response = await fetch("/api/support/tickets", { cache: "no-store" });
    const data = await response.json();
    if (response.ok) setTickets(data.data); else setError(data.error ?? "Unable to load support tickets.");
  };
  const open = async (id: string) => {
    const response = await fetch(`/api/support/tickets/${id}`, { cache: "no-store" });
    const data = await response.json();
    if (response.ok) setActive(data.data); else setError(data.error ?? "Unable to open ticket.");
  };
  useEffect(() => { void load(); }, []);

  const create = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const response = await fetch("/api/support/tickets", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subject, body }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to create ticket.");
      setSubject(""); setBody(""); await load(); await open(data.data.id);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to create ticket."); } finally { setBusy(false); }
  };
  const send = async (event: React.FormEvent) => {
    event.preventDefault(); if (!active) return; setBusy(true); setError("");
    try {
      const response = await fetch(`/api/support/tickets/${active.ticket.id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body: reply }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to send message.");
      setReply(""); await open(active.ticket.id); await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to send message."); } finally { setBusy(false); }
  };

  return <div className="loom-dashboard min-h-screen"><div className="mx-auto max-w-[1080px] px-6 py-12 lg:px-9">
    <p className="font-mono text-[10px] uppercase tracking-[.15em] text-white/40">Support</p>
    <h1 className="mt-3 text-4xl font-semibold tracking-[-.06em]">Get help</h1>
    <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60">Tickets are stored for your personal workspace. Replies from the Loomspace team will appear here.</p>
    {error && <p role="alert" className="mt-6 rounded-xl border border-red-400/25 bg-red-400/10 px-4 py-3 text-sm text-red-100">{error}</p>}
    <div className="mt-8 grid gap-6 lg:grid-cols-[360px_1fr]">
      <section className="rounded-2xl border border-white/10 bg-white/[.035] p-5">
        <h2 className="flex items-center gap-2 text-lg font-semibold"><Plus className="size-4" />New ticket</h2>
        <form onSubmit={create} className="mt-4 flex flex-col gap-3">
          <input value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={200} required placeholder="Subject" className="rounded-xl border border-white/10 bg-black/15 px-3 py-2.5 text-sm outline-none placeholder:text-white/35 focus:border-white/30" />
          <textarea value={body} onChange={(e) => setBody(e.target.value)} maxLength={12000} required rows={5} placeholder="Describe the issue" className="rounded-xl border border-white/10 bg-black/15 px-3 py-2.5 text-sm outline-none placeholder:text-white/35 focus:border-white/30" />
          <button disabled={busy} className="rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-black disabled:opacity-50">Open ticket</button>
        </form>
        <h2 className="mt-8 flex items-center gap-2 text-lg font-semibold"><LifeBuoy className="size-4" />Your tickets</h2>
        <div className="mt-3 divide-y divide-white/10 overflow-hidden rounded-xl border border-white/10">
          {tickets.length === 0 ? <p className="p-4 text-sm text-white/50">No tickets yet.</p> : tickets.map((t) => <button key={t.id} onClick={() => void open(t.id)} className="block w-full p-4 text-left hover:bg-white/5"><p className="text-sm font-medium">{t.subject}</p><p className="mt-1 text-xs text-white/45">{t.status} · {new Date(t.updated_at).toLocaleDateString()}</p></button>)}
        </div>
      </section>
      <section className="rounded-2xl border border-white/10 bg-white/[.035] p-5">
        {!active ? <p className="flex min-h-64 items-center justify-center gap-2 text-sm text-white/50"><MessageSquare className="size-4" />Select a ticket to read the conversation.</p> : <>
          <h2 className="text-lg font-semibold">{active.ticket.subject}</h2>
          <p className="mt-1 text-xs text-white/45">Status: {active.ticket.status}</p>
          <div className="mt-5 space-y-3">{active.messages.map((m) => <div key={m.id} className={`rounded-xl border border-white/10 p-4 text-sm ${m.author_role === "user" ? "bg-white/[.04]" : "bg-emerald-400/10"}`}><p className="mb-1 text-xs text-white/45">{m.author_role === "user" ? "You" : "Loomspace support"} · {new Date(m.created_at).toLocaleString()}</p><p className="whitespace-pre-wrap">{m.body}</p></div>)}</div>
          <form onSubmit={send} className="mt-5 flex gap-3">
            <textarea value={reply} onChange={(e) => setReply(e.target.value)} maxLength={12000} required rows={2} placeholder="Reply" className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/15 px-3 py-2.5 text-sm outline-none placeholder:text-white/35 focus:border-white/30" />
            <button disabled={busy} className="inline-flex items-center gap-2 self-end rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-black disabled:opacity-50"><Send className="size-4" />Send</button>
          </form>
        </>}
      </section>
    </div>
  </div></div>;
}

export default function SupportPage() { return <AppAuthGate><LoomspaceAppShell><SupportContent /></LoomspaceAppShell></AppAuthGate>; }
