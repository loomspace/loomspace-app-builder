"use client";

import { useEffect, useState } from "react";
import { Activity, TrendingUp, Wallet } from "lucide-react";

type Dimension = { dimension: string; units: number; unit: string; credits: number };
type UsageData = {
  totals: { credits: number; byDimension: Record<string, Dimension> };
  series: { ts: string; integration: string; units: number; unit: string; credits: number }[];
  account: { plan: string; balance: number; accountCaps: { hour: number; day: number }; consumedThisPeriod: number };
};

const LABELS: Record<string, string> = {
  agent_runs: "Agent runs",
  create_project: "Projects created",
  deploy: "Publishes",
  visual_edit: "Visual edits",
  rebuild_project: "Rebuilds",
  browser_session: "Cloud browser",
  email: "Emails",
  requests: "Requests",
};

function money(credits: number) {
  return credits >= 10 ? credits.toFixed(1) : credits.toFixed(2);
}

export function UsagePanel() {
  const [data, setData] = useState<UsageData | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    void (async () => {
      const response = await fetch("/api/usage?days=30");
      if (!response.ok) { setFailed(true); return; }
      const body = await response.json();
      if (body.ok) setData(body.data); else setFailed(true);
    })();
  }, []);

  if (failed) return null;
  if (!data) {
    return <div className="loom-usage grid gap-3 sm:grid-cols-3">
      {[1, 2, 3].map((i) => <div key={i} className="h-20 animate-pulse rounded-xl border border-white/10 bg-white/[.04]" />)}
    </div>;
  }

  const dimensions = Object.values(data.totals.byDimension).filter((d) => d.credits > 0).sort((a, b) => b.credits - a.credits);
  const maxSeries = Math.max(1, ...Object.values(data.series.reduce<Record<string, number>>((acc, point) => { acc[point.ts] = (acc[point.ts] ?? 0) + point.credits; return acc; }, {})));
  const byDay = data.series.reduce<Record<string, number>>((acc, point) => { acc[point.ts] = (acc[point.ts] ?? 0) + point.credits; return acc; }, {});
  const days = Object.entries(byDay).sort(([a], [b]) => a.localeCompare(b)).slice(-14);

  return <section className="loom-usage mt-14">
    <div className="flex items-center justify-between">
      <h2 className="text-lg font-semibold tracking-[-.03em]">Usage</h2>
      <span className="font-mono text-[10px] uppercase tracking-[.14em] text-white/40">Last 30 days</span>
    </div>
    <div className="mt-4 grid gap-3 sm:grid-cols-3">
      <div className="rounded-xl border border-white/10 bg-white/[.035] p-4">
        <div className="flex items-center gap-2 text-white/50"><TrendingUp className="size-3.5" /><span className="text-[11px] font-medium uppercase tracking-[.12em]">Credits spent</span></div>
        <p className="mt-3 text-2xl font-semibold tabular-nums">{money(data.totals.credits)}</p>
      </div>
      <div className="rounded-xl border border-white/10 bg-white/[.035] p-4">
        <div className="flex items-center gap-2 text-white/50"><Wallet className="size-3.5" /><span className="text-[11px] font-medium uppercase tracking-[.12em]">Balance</span></div>
        <p className="mt-3 text-2xl font-semibold tabular-nums">{money(data.account.balance)}</p>
        <p className="mt-1 text-[11px] text-white/40">{data.account.plan} plan · caps {data.account.accountCaps.day}/day</p>
      </div>
      <div className="rounded-xl border border-white/10 bg-white/[.035] p-4">
        <div className="flex items-center gap-2 text-white/50"><Activity className="size-3.5" /><span className="text-[11px] font-medium uppercase tracking-[.12em]">Top usage</span></div>
        <div className="mt-3 space-y-1.5">
          {dimensions.slice(0, 3).map((d) => <p key={d.dimension} className="flex items-center justify-between text-xs text-white/65"><span>{LABELS[d.dimension] ?? d.dimension}</span><span className="tabular-nums text-white/90">{money(d.credits)}</span></p>)}
        </div>
      </div>
    </div>
    {days.length > 0 && <div className="mt-3 rounded-xl border border-white/10 bg-white/[.035] p-4">
      <p className="text-[11px] font-medium uppercase tracking-[.12em] text-white/50">Over time</p>
      <div className="mt-4 flex h-24 items-end gap-1.5">
        {days.map(([ts, credits]) => <div key={ts} className="group relative flex-1" title={`${ts.slice(0, 10)}: ${money(credits)} credits`}>
          <div className="w-full rounded-t bg-white/25 transition group-hover:bg-white/45" style={{ height: `${Math.max(4, (credits / maxSeries) * 96)}px` }} />
        </div>)}
      </div>
      <div className="mt-2 flex justify-between font-mono text-[9px] text-white/35"><span>{days[0]![0].slice(0, 10)}</span><span>{days[days.length - 1]![0].slice(0, 10)}</span></div>
    </div>}
  </section>;
}
