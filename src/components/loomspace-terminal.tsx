"use client";

import { useMemo, useState } from "react";

type Row = { tone: "prompt" | "muted" | "ok" | "plain"; text: string };
const scenes: { name: string; rows: Row[] }[] = [
  { name: "build", rows: [
    { tone: "prompt", text: "> build a private client portal for a design studio" },
    { tone: "muted", text: "project: atelier-client-portal · workspace ready" },
    { tone: "plain", text: "" },
    { tone: "ok", text: "creating approval workflow" },
    { tone: "ok", text: "adding client-only project access" },
    { tone: "ok", text: "building responsive project dashboard" },
    { tone: "ok", text: "running project checks" },
    { tone: "plain", text: "" },
    { tone: "plain", text: "preview ready · 3 source files updated" },
  ]},
  { name: "review", rows: [
    { tone: "prompt", text: "> make the hero calmer and remove invented metrics" },
    { tone: "muted", text: "reviewing preview and source together" },
    { tone: "plain", text: "" },
    { tone: "ok", text: "opening src/app/page.tsx" },
    { tone: "ok", text: "editing visual hierarchy and copy" },
    { tone: "ok", text: "checking desktop and mobile preview" },
    { tone: "plain", text: "" },
    { tone: "plain", text: "change complete · version saved" },
  ]},
  { name: "ship", rows: [
    { tone: "prompt", text: "> prepare this project for release" },
    { tone: "muted", text: "checking source, data, and release configuration" },
    { tone: "plain", text: "" },
    { tone: "ok", text: "source inspection passed" },
    { tone: "ok", text: "preview health check passed" },
    { tone: "ok", text: "release path available" },
    { tone: "plain", text: "" },
    { tone: "plain", text: "project is ready for final review" },
  ]},
];

export function LoomspaceTerminal() {
  const [active, setActive] = useState(0);
  const scene = scenes[active]!;
  const rows = useMemo(() => scene.rows, [scene]);
  return <div className="flex h-[390px] flex-col bg-[#11110f] font-mono text-[12px] text-[#f1efe8] sm:h-[470px]">
    <div className="flex items-center justify-between border-b border-white/10 bg-[#191917] px-4 py-3 text-[10px] text-white/50"><span>mode <b className="font-medium text-white/85">{scene.name}</b></span><span className="inline-flex items-center gap-2"><i className="size-1.5 rounded-full bg-[#e47938]"/>agent running</span></div>
    <div className="flex-1 overflow-auto px-5 py-4 leading-[1.75]">{rows.map((r,i)=><div key={`${scene.name}-${i}`} className={r.tone === "prompt" ? "text-white" : r.tone === "ok" ? "text-[#c9d5ad]" : r.tone === "muted" ? "text-white/45" : "text-white/75"}>{r.text || " "}</div>)}</div>
    <div className="flex gap-1 border-t border-white/10 bg-[#191917] p-2">{scenes.map((s,i)=><button key={s.name} onClick={()=>setActive(i)} className={`rounded px-3 py-1 text-[10px] transition ${i===active ? "bg-white/10 text-white" : "text-white/45 hover:text-white"}`}>{i===active?"*":""}{s.name}</button>)}</div>
  </div>;
}
