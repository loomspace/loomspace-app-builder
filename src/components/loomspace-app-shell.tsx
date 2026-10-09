"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { BookOpen, Boxes, ChevronLeft, CircleHelp, Code2, KeyRound, LifeBuoy, LogOut, Moon, Settings2, ShieldCheck, Sun, UserRound, Users } from "lucide-react";

type Theme = "dark" | "light";

export function LoomspaceAppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = usePrivy();
  const [theme, setTheme] = useState<Theme>("dark");
  const email = user?.email?.address ?? "Connected with Privy";
  useEffect(() => { const saved = window.localStorage.getItem("loomspace-theme"); if (saved === "light" || saved === "dark") setTheme(saved); }, []);
  const toggleTheme = () => setTheme((current) => { const next = current === "dark" ? "light" : "dark"; window.localStorage.setItem("loomspace-theme", next); return next; });
  const active = (href: string) => pathname === href;
  return <div className="loom-app min-h-screen" data-theme={theme}>
    <aside className="loom-sidebar fixed inset-y-0 left-0 z-20 hidden w-64 flex-col lg:flex">
      <div className="flex h-16 items-center justify-between border-b px-5"><Link href="/" className="text-xl font-semibold tracking-[-.06em]">loomspace<span className="text-current/40">.</span></Link><ChevronLeft className="size-4 opacity-35" /></div>
      <nav className="flex flex-col gap-1 px-3 py-4 text-sm">
        <Link href="/app" className={`${active("/app") ? "loom-nav-active" : "loom-nav-link"} flex items-center gap-3 rounded-xl px-3 py-2.5`}><Boxes className="size-4"/>Projects</Link>
        <Link href="/developer" className={`${active("/developer") ? "loom-nav-active" : "loom-nav-link"} flex items-center gap-3 rounded-xl px-3 py-2.5`}><Code2 className="size-4"/>Developer</Link>
        <Link href="/developer/mcp" className={`${active("/mcp") ? "loom-nav-active" : "loom-nav-link"} flex items-center gap-3 rounded-xl px-3 py-2.5`}><KeyRound className="size-4"/>MCP</Link>
        <Link href="/workspace" className={`${active("/workspace") ? "loom-nav-active" : "loom-nav-link"} flex items-center gap-3 rounded-xl px-3 py-2.5`}><Users className="size-4"/>Workspace</Link>
        <Link href="/support" className={`${active("/support") ? "loom-nav-active" : "loom-nav-link"} flex items-center gap-3 rounded-xl px-3 py-2.5`}><LifeBuoy className="size-4"/>Support</Link>
        <Link href="/settings" className={`${active("/settings") ? "loom-nav-active" : "loom-nav-link"} flex items-center gap-3 rounded-xl px-3 py-2.5`}><Settings2 className="size-4"/>Settings</Link>
        <Link href="/docs" className="loom-nav-link flex items-center gap-3 rounded-xl px-3 py-2.5"><BookOpen className="size-4"/>Docs</Link>
      </nav>
      <div className="mx-3 border-t" />
      <div className="mt-auto border-t p-3"><Link href="/docs#quickstart" className="loom-nav-link flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm"><CircleHelp className="size-4"/>Builder guide</Link><button onClick={toggleTheme} className="loom-nav-link mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm">{theme === "dark" ? <Sun className="size-4"/> : <Moon className="size-4"/>}{theme === "dark" ? "Light theme" : "Dark theme"}</button><button onClick={() => logout()} className="loom-nav-link mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm"><LogOut className="size-4"/>Disconnect</button><div className="loom-profile mt-3 flex items-center gap-3 rounded-xl border p-3"><div className="loom-avatar grid size-8 place-items-center rounded-full text-xs font-semibold">{email.slice(0, 1).toUpperCase()}</div><div className="min-w-0"><p className="truncate text-xs font-medium">Private workspace</p><p className="truncate text-[11px] opacity-50">{email}</p></div></div></div>
    </aside>
    <main className="min-h-screen lg:pl-64">{children}</main>
  </div>;
}
