import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpen, ChevronRight, CircleDot, ExternalLink } from "lucide-react";
import { docsGroups, docsPages, type DocsPage } from "@/lib/docs-data";

function DocsHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0a0a0a]/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-5 sm:px-8">
        <Link href="/" className="text-lg font-semibold tracking-[-.06em] text-[#f4f4f0]">loomspace<span className="text-white/35">.</span></Link>
        <nav className="flex items-center gap-5 text-sm text-white/55">
          <Link href="/" className="hidden transition hover:text-white sm:block">Overview</Link>
          <Link href="/app" className="rounded-md border border-white/15 bg-white px-3 py-2 font-medium text-[#0a0a0a] transition hover:bg-white/85">Open builder</Link>
        </nav>
      </div>
    </header>
  );
}

function DocsNav({ currentSlug }: { currentSlug?: string }) {
  return (
    <aside className="border-b border-white/10 px-5 py-7 lg:min-h-[calc(100vh-64px)] lg:border-b-0 lg:border-r lg:px-6">
      <Link href="/docs" className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition ${!currentSlug ? "bg-white/10 text-white" : "text-white/55 hover:bg-white/[.055] hover:text-white"}`}>
        <BookOpen className="size-4" /> Introduction
      </Link>
      <nav className="mt-5 grid gap-5 sm:grid-cols-2 lg:block">
        {docsGroups.map((group) => (
          <div key={group}>
            <p className="mb-1 px-3 font-mono text-[10px] uppercase tracking-[.16em] text-white/35">{group}</p>
            <div className="grid gap-0.5">
              {docsPages.filter((page) => page.group === group).map((page) => (
                <Link key={page.slug} href={`/docs/${page.slug}`} className={`rounded-md px-3 py-2 text-sm transition ${currentSlug === page.slug ? "bg-white/10 text-white" : "text-white/55 hover:bg-white/[.055] hover:text-white"}`}>
                  {page.title}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}

function PageFooter({ page }: { page: DocsPage }) {
  const index = docsPages.findIndex((item) => item.slug === page.slug);
  const previous = docsPages[index - 1];
  const next = docsPages[index + 1];
  return <footer className="mt-16 grid border-t border-white/10 pt-6 sm:grid-cols-2">
    {previous ? <Link href={`/docs/${previous.slug}`} className="group rounded-md p-3 transition hover:bg-white/[.055]"><span className="flex items-center gap-1 text-xs text-white/40"><ArrowLeft className="size-3" /> Previous</span><span className="mt-2 block text-sm font-medium text-white/80 group-hover:text-white">{previous.title}</span></Link> : <div />}
    {next ? <Link href={`/docs/${next.slug}`} className="group rounded-md p-3 text-left transition hover:bg-white/[.055] sm:text-right"><span className="flex items-center gap-1 text-xs text-white/40 sm:justify-end">Next <ArrowRight className="size-3" /></span><span className="mt-2 block text-sm font-medium text-white/80 group-hover:text-white">{next.title}</span></Link> : null}
  </footer>;
}

export function DocsFrame({ page, children }: { page?: DocsPage; children: React.ReactNode }) {
  return <main className="min-h-screen bg-[#0a0a0a] text-[#f4f4f0] selection:bg-white/20"><DocsHeader /><div className="mx-auto grid max-w-[1440px] lg:grid-cols-[264px_minmax(0,1fr)]"><DocsNav currentSlug={page?.slug} /><article className="min-w-0 px-6 py-12 sm:px-10 lg:px-16 lg:py-16">{children}{page ? <PageFooter page={page} /> : null}</article></div></main>;
}

export function DocsArticle({ page }: { page: DocsPage }) {
  return <DocsFrame page={page}>
    <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[.16em] text-white/40"><CircleDot className="size-3.5" /> {page.eyebrow}</p>
    <h1 className="mt-5 max-w-3xl text-4xl font-medium tracking-[-.065em] text-white sm:text-6xl">{page.title}</h1>
    <p className="mt-6 max-w-2xl text-lg leading-8 text-white/60">{page.intro}</p>
    <div className="mt-12 max-w-3xl border-t border-white/10">
      {page.sections.map((section, index) => <section key={section.heading} className="border-b border-white/10 py-9"><p className="font-mono text-[11px] text-white/30">0{index + 1}</p><h2 className="mt-3 text-2xl font-medium tracking-[-.045em] text-white">{section.heading}</h2>{section.paragraphs.map((paragraph) => <p key={paragraph} className="mt-4 max-w-2xl text-[15px] leading-7 text-white/60">{paragraph}</p>)}{section.bullets ? <ul className="mt-5 grid gap-2 border-l border-white/15 pl-4 text-sm leading-6 text-white/60">{section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul> : null}</section>)}
    </div>
    {page.note ? <aside className="mt-10 max-w-3xl border border-white/10 bg-white/[.045] p-5"><p className="font-mono text-[10px] uppercase tracking-[.16em] text-white/40">Note</p><p className="mt-2 text-sm leading-6 text-white/65">{page.note}</p></aside> : null}
  </DocsFrame>;
}

export function DocsOverview() {
  return <DocsFrame>
    <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[.16em] text-white/40"><BookOpen className="size-3.5" /> Loomspace manual</p>
    <h1 className="mt-5 max-w-4xl text-4xl font-medium tracking-[-.07em] text-white sm:text-6xl">Build with a project, not a throwaway prompt.</h1>
    <p className="mt-6 max-w-2xl text-lg leading-8 text-white/60">Loomspace turns a product brief into a project you can keep working on: inspect the preview, revise the implementation, work with data, and release deliberately.</p>
    <div className="mt-12 grid gap-px overflow-hidden border border-white/10 bg-white/10 sm:grid-cols-2 xl:grid-cols-3">
      {docsPages.map((page, index) => <Link href={`/docs/${page.slug}`} key={page.slug} className="group flex min-h-52 flex-col bg-[#0a0a0a] p-6 transition hover:bg-white/[.055]"><span className="font-mono text-[11px] text-white/35">{String(index + 1).padStart(2, "0")} / {page.group}</span><h2 className="mt-8 text-xl font-medium tracking-[-.04em] text-white/90 group-hover:text-white">{page.title}</h2><p className="mt-3 text-sm leading-6 text-white/50">{page.summary}</p><span className="mt-auto flex items-center gap-1 pt-6 text-xs font-medium text-white/65">Read guide <ChevronRight className="size-3" /></span></Link>)}
    </div>
    <div className="mt-10 flex max-w-3xl items-start gap-3 border border-white/10 bg-white/[.035] p-5"><ExternalLink className="mt-0.5 size-4 shrink-0 text-white/50" /><p className="text-sm leading-6 text-white/60">Need to start a project? Open the builder, write a concrete outcome, then use this manual while you review and extend the result.</p></div>
  </DocsFrame>;
}
