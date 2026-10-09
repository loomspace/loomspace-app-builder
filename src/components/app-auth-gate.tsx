"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { Boxes, Code2, HelpCircle, LayoutGrid, List, Paperclip, Search, Send, Settings2, Sparkles } from "lucide-react";

function ProjectSkeleton() {
  return <div className="overflow-hidden rounded-xl border border-white/10 bg-[#12151a]"><div className="h-40 border-b border-white/8 p-3"><div className="flex items-center gap-1.5"><i className="size-1.5 rounded-full bg-white/15"/><i className="size-1.5 rounded-full bg-white/15"/><i className="size-1.5 rounded-full bg-white/15"/><span className="ml-2 h-3 w-24 rounded bg-white/8"/></div><div className="mt-3 h-24 rounded bg-white/[.035]"/></div><div className="p-4"><div className="h-3.5 w-2/3 rounded bg-white/10"/><div className="mt-2 h-3 w-1/2 rounded bg-white/7"/><div className="mt-4 flex justify-between"><span className="h-2.5 w-14 rounded bg-white/7"/><span className="h-2.5 w-6 rounded bg-white/7"/></div></div></div>;
}

function LoginBackdrop() {
  return <div aria-hidden className="min-h-screen bg-[#090a0c] text-[#eef0f3]"><aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-white/10 bg-[#090a0c] lg:block"><div className="flex h-16 items-center border-b border-white/10 px-5 text-xl font-semibold tracking-[-.06em]">loomspace<span className="text-white/40">.</span></div><nav className="p-3 text-sm"><div className="flex items-center gap-3 rounded-xl bg-white/9 px-3 py-2.5"><Boxes className="size-4"/>Projects</div><div className="mt-1 flex items-center gap-3 px-3 py-2.5 text-white/50"><Settings2 className="size-4"/>Settings</div><div className="mt-1 flex items-center gap-3 px-3 py-2.5 text-white/50"><HelpCircle className="size-4"/>Help</div></nav><div className="absolute inset-x-3 bottom-4 rounded-xl border border-white/10 bg-white/[.035] p-3"><p className="font-mono text-[10px] uppercase tracking-[.14em] text-white/40">Private workspace</p><div className="mt-3 flex items-center gap-3"><span className="grid size-8 place-items-center rounded-full bg-white text-xs font-semibold text-black">L</span><span className="h-3 w-28 rounded bg-white/10"/></div></div></aside><main className="min-h-screen lg:pl-64"><div className="mx-auto max-w-[1240px] px-6 py-16 lg:px-10"><section className="mx-auto max-w-3xl"><h1 className="text-center text-5xl font-semibold tracking-[-.065em] sm:text-6xl">What do you want to <span className="text-white/55">build?</span></h1><p className="mt-4 text-center text-white/50">Describe the outcome. Your project keeps the preview, source, data, and history together.</p><div className="mt-9 overflow-hidden rounded-[26px] border border-white/10 bg-[#12151a] shadow-[0_30px_100px_rgba(0,0,0,.45)]"><div className="min-h-[135px] p-6 text-[15px] text-white/35">A booking app for a studio, with a calendar, client approvals, and a clear release path…</div><div className="flex items-center justify-between border-t border-white/8 px-4 py-3"><div className="flex items-center gap-3 text-white/50"><Paperclip className="size-4"/><Code2 className="size-4"/></div><button className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black">Start building <Send className="size-3.5"/></button></div></div></section><section className="mt-20"><div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Your projects</h2><div className="flex items-center gap-2"><div className="flex h-9 w-52 items-center gap-2 rounded-lg border border-white/10 bg-[#12151a] px-3 text-xs text-white/35"><Search className="size-3.5"/>Search projects…</div><div className="flex rounded-lg border border-white/10 bg-[#12151a] p-1"><LayoutGrid className="size-4 rounded bg-white/10 p-0.5"/><List className="ml-2 size-4 text-white/40"/></div></div></div><div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{[1,2,3,4,5,6].map((i)=><ProjectSkeleton key={i}/>)}</div></section></div></main></div>;
}

export function AppAuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { ready, authenticated, login, getAccessToken } = usePrivy();
  const [sessionReady, setSessionReady] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (!ready || started.current) return;
    if (!authenticated) { started.current = true; void login(); return; }
    started.current = true;
    void (async () => {
      const accessToken = await getAccessToken();
      const response = await fetch("/api/auth/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ accessToken }) });
      if (response.ok) { setSessionReady(true); router.refresh(); }
    })();
  }, [authenticated, getAccessToken, login, ready, router]);

  if (!sessionReady) return <LoginBackdrop />;
  return <>{children}</>;
}
