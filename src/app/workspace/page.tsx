"use client";

import { useEffect, useState } from "react";
import { Users } from "lucide-react";
import { AppAuthGate } from "@/components/app-auth-gate";
import { LoomspaceAppShell } from "@/components/loomspace-app-shell";

type Workspace = { id: string; name: string; role: string; created_at: string };

function WorkspaceContent() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    fetch("/api/workspaces", { cache: "no-store" }).then(async (response) => {
      const data = await response.json();
      if (response.ok) setWorkspaces(data.data); else setError(data.error ?? "Unable to load workspace.");
    }).catch(() => setError("Unable to load workspace."));
  }, []);
  return <div className="loom-dashboard min-h-screen"><div className="mx-auto max-w-[900px] px-6 py-12 lg:px-9">
    <p className="font-mono text-[10px] uppercase tracking-[.15em] text-white/40">Workspace</p>
    <h1 className="mt-3 text-4xl font-semibold tracking-[-.06em]">Your workspaces</h1>
    <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60">Only workspaces you are a member of appear here. Team invitations are not available yet.</p>
    {error && <p role="alert" className="mt-6 rounded-xl border border-red-400/25 bg-red-400/10 px-4 py-3 text-sm text-red-100">{error}</p>}
    <div className="mt-8 overflow-hidden rounded-2xl border border-white/10">
      {workspaces.length === 0 ? <p className="p-6 text-sm text-white/50">No workspace yet. One is created when you first open Support or build a project.</p> : workspaces.map((w) => <div key={w.id} className="flex items-center justify-between gap-4 p-5"><div className="flex items-center gap-3"><Users className="size-4 text-white/55" /><div><p className="text-sm font-medium">{w.name}</p><p className="mt-1 text-xs text-white/45">Role: {w.role}</p></div></div><p className="text-xs text-white/45">Created {new Date(w.created_at).toLocaleDateString()}</p></div>)}
    </div>
  </div></div>;
}

export default function WorkspacePage() { return <AppAuthGate><LoomspaceAppShell><WorkspaceContent /></LoomspaceAppShell></AppAuthGate>; }
