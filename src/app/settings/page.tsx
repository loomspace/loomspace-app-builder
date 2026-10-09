"use client";

import { usePrivy } from "@privy-io/react-auth";
import { Activity, ShieldCheck, UserRound } from "lucide-react";
import { AppAuthGate } from "@/components/app-auth-gate";
import { LoomspaceAppShell } from "@/components/loomspace-app-shell";
import { UsagePanel } from "@/components/workspace/usage-panel";

function SettingsContent() {
  const { user } = usePrivy();
  const email = user?.email?.address ?? "Connected through Privy";
  return <div className="loom-dashboard min-h-screen relative overflow-hidden">
    <div className="fixed inset-0 -z-10" />
    <div className="mx-auto grid max-w-[1240px] gap-10 px-6 py-12 lg:grid-cols-[210px_minmax(0,1fr)] lg:px-9">
      <aside className="text-sm"><p className="font-mono text-[10px] uppercase tracking-[.15em] text-white/40">Settings</p><nav className="mt-4 grid gap-1"><a href="#usage" className="flex items-center gap-3 rounded-xl bg-white/9 px-3 py-2.5 text-white"><Activity className="size-4"/>Usage</a><a href="#profile" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-white/60 hover:bg-white/6 hover:text-white"><UserRound className="size-4"/>Profile</a><a href="#security" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-white/60 hover:bg-white/6 hover:text-white"><ShieldCheck className="size-4"/>Security</a></nav></aside>
      <div><section id="usage"><p className="font-mono text-[10px] uppercase tracking-[.15em] text-white/40">Plan & usage</p><h1 className="mt-3 text-4xl font-semibold tracking-[-.06em]">Usage</h1><p className="mt-3 max-w-xl text-white/60">See the account-level credits consumed by projects and the actions that used them.</p><UsagePanel /></section>
        <section id="profile" className="mt-16 border-t border-white/10 pt-10"><p className="font-mono text-[10px] uppercase tracking-[.15em] text-white/40">Account</p><h2 className="mt-3 text-2xl font-semibold tracking-[-.04em]">Profile</h2><div className="mt-5 rounded-xl border border-white/10 bg-white/[.035] p-5"><p className="text-xs text-white/45">Connected identity</p><p className="mt-2 text-sm text-white">{email}</p><p className="mt-3 text-xs leading-5 text-white/50">Identity is managed through your connected sign-in method. There is no separate Loomspace password.</p></div></section>
        <section id="security" className="mt-16 border-t border-white/10 pt-10"><p className="font-mono text-[10px] uppercase tracking-[.15em] text-white/40">Account</p><h2 className="mt-3 text-2xl font-semibold tracking-[-.04em]">Security</h2><div className="mt-5 rounded-xl border border-white/10 bg-white/[.035] p-5"><p className="text-sm font-medium text-white">Private project session</p><p className="mt-2 max-w-xl text-sm leading-6 text-white/55">Your project workspace is protected by a verified Privy session. Project ownership is checked before project data, previews, files, and build controls are served.</p></div></section>
      </div>
    </div>
  </div>;
}

export default function SettingsPage() {
  return <AppAuthGate><LoomspaceAppShell><SettingsContent /></LoomspaceAppShell></AppAuthGate>;
}
