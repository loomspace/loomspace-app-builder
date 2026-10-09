import Link from "next/link";
import {
  ArrowRight,
  Check,
  Code2,
  Database,
  Eye,
  Figma,
  GitBranch,
  Globe2,
  Layers3,
  PlugZap,
} from "lucide-react";

const proofItems = [
  ["01", "A running preview", "See the product as a person would use it. Check hierarchy, responsive behavior, interaction states, and copy before the next instruction.", Eye],
  ["02", "Working source", "Open the files behind the preview when you need to understand, direct, or continue the build beyond a single conversation.", Code2],
  ["03", "Project data", "Create applications that can hold records and managed state, then work with that data from the same project workspace.", Database],
  ["04", "Saved project state", "Return to task history, source, files, versions, and release controls instead of losing the work to a completed prompt.", Layers3],
] as const;

const useCases = [
  ["Client portals", "Give clients a focused place for files, approvals, timelines, and decisions.", "PORTAL / REVIEW"],
  ["Internal tools", "Turn a process with too many tabs into a purpose-built workspace for your team.", "OPS / WORKFLOW"],
  ["Product prototypes", "Test the real structure, states, and language of a product before the handoff becomes expensive.", "PRODUCT / PROTOTYPE"],
  ["Data-backed apps", "Pair an interface with managed records, structured forms, and the data views a workflow needs.", "DATA / APPLICATION"],
  ["Marketing sites", "Build a site with a clear point of view, inspect the implementation, and keep a release-ready project.", "SITE / LAUNCH"],
  ["Design-led revisions", "Start with a reference, then make specific visual changes against the running interface.", "DESIGN / ITERATION"],
] as const;

const loop = [
  ["01", "Frame", "Describe the person using it, the outcome they need, the pages or states that matter, and the visual direction."],
  ["02", "Build", "Start a project from that brief. The work takes shape in a workspace rather than disappearing into a chat transcript."],
  ["03", "Review", "Use the live preview, source, files, and data to decide what is true before requesting a focused change."],
  ["04", "Refine", "Continue the same project through prompts, visual edits, code changes, and saved versions."],
  ["05", "Release", "When the result is ready, use the project’s release controls, source connection, and domain path deliberately."],
] as const;

const comparisons = [
  ["The unit of work", "A project with a workspace", "A one-off answer or exported artifact"],
  ["Evidence for review", "Running preview, source, files, and project state", "A completion message or screenshot"],
  ["Iteration", "Focused prompts, visual editing, source changes, and versions", "Start another conversation and recreate context"],
  ["Data", "Managed records alongside the application", "A separate concern after the interface"],
  ["Release path", "Project controls for publishing, source connection, and domains", "A handoff outside the build loop"],
] as const;

const faqs = [
  ["What is Loomspace?", "Loomspace is an AI project workspace for building applications from a clear brief and then continuing the work. The project retains its preview, source, files, data, task history, versions, and release controls."],
  ["Is Loomspace just a prompt-to-site tool?", "No. A prompt starts the work, but the workspace is designed for the rest of the loop: inspect the running result, ask for precise changes, work with source and data, then prepare the project for release."],
  ["What can I review before releasing?", "You can review the live preview alongside project source, files, task history, data, and saved versions. Release controls are part of the project rather than a separate final export."],
  ["Can I work from a design reference?", "The workspace includes a design-reference connection and visual editing tools so you can use a reference as part of the build and revision process."],
  ["Does Loomspace offer an API or MCP today?", "Loomspace MCP is planned. It is not presented as a live integration on this site. Today, the product focus is the project workspace and its built-in build, review, data, source, and release surfaces."],
] as const;

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="font-mono text-[11px] uppercase tracking-[.16em] text-white/45">{children}</p>;
}

export default function LandingPage() {
  return (
    <main className="loomspace-dark min-h-screen overflow-hidden bg-[#0b0b0a] text-[#f3f3ef] selection:bg-white/25">
      <div className="pointer-events-none fixed inset-y-0 left-1/2 hidden w-full max-w-[1320px] -translate-x-1/2 border-x border-white/10 md:block" />
      <div className="relative">
        <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0b0b0a]/90 backdrop-blur-xl">
          <nav className="mx-auto flex h-16 max-w-[1320px] items-center justify-between px-6">
            <Link href="/" className="text-[18px] font-semibold tracking-[-.06em]">loomspace<span className="text-white/40">.</span></Link>
            <div className="hidden items-center gap-7 text-sm text-white/55 md:flex">
              <a href="#loop" className="transition hover:text-white">Build loop</a>
              <a href="#use-cases" className="transition hover:text-white">Use cases</a>
              <a href="#capabilities" className="transition hover:text-white">Capabilities</a>
              <a href="#faq" className="transition hover:text-white">FAQ</a>
              <Link href="/docs" className="transition hover:text-white">Docs</Link>
            </div>
            <Link href="/app" className="rounded-sm bg-white px-3.5 py-2 text-sm font-medium text-black transition hover:bg-white/85">Open builder</Link>
          </nav>
        </header>

        <section className="mx-auto max-w-[1320px] border-x border-white/10 px-6 pb-0 pt-20 sm:px-10 md:pt-32">
          <div className="grid gap-14 lg:grid-cols-[1.05fr_.95fr] lg:items-end">
            <div className="max-w-3xl pb-2">
              <p className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[.16em] text-white/50"><span className="size-1.5 rounded-full bg-white" />AI project workspace</p>
              <h1 className="mt-6 text-5xl font-semibold leading-[.94] tracking-[-.075em] sm:text-7xl md:text-8xl">Build the application.<br />Keep the evidence.</h1>
              <p className="mt-7 max-w-2xl text-lg leading-8 text-white/65 md:text-xl">Loomspace turns a clear brief into a working project you can inspect, revise, and prepare for release. The preview, source, data, files, and versions stay in one place.</p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Link href="/app" className="inline-flex items-center gap-2 rounded-sm bg-white px-4 py-3 text-sm font-medium text-black transition hover:bg-white/85">Start a project <ArrowRight className="size-4" /></Link>
                <Link href="/docs" className="inline-flex items-center gap-2 rounded-sm border border-white/20 px-4 py-3 text-sm font-medium text-white transition hover:border-white/50">Read the manual <ArrowRight className="size-4" /></Link>
              </div>
            </div>
            <div className="border border-white/15 bg-[#11110f] p-3 shadow-[0_28px_100px_rgba(0,0,0,.38)] sm:p-4">
              <div className="flex items-center justify-between border-b border-white/10 px-2 pb-3 font-mono text-[10px] tracking-[.12em] text-white/45"><span>PROJECT / STUDIO-PORTAL</span><span className="inline-flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-white" />ACTIVE</span></div>
              <div className="grid gap-5 py-5 sm:grid-cols-[.85fr_1.15fr]">
                <div className="rounded-sm border border-white/10 bg-white/[.035] p-4">
                  <p className="font-mono text-[10px] uppercase tracking-[.14em] text-white/40">The brief</p>
                  <h2 className="mt-4 text-2xl font-semibold leading-tight tracking-[-.05em]">A calmer way for a design studio and its clients to make decisions.</h2>
                  <p className="mt-4 text-sm leading-6 text-white/55">Approvals, files, timelines, and an explicit request-changes flow for each client.</p>
                  <div className="mt-7 border-t border-white/10 pt-4 font-mono text-[11px] leading-6 text-white/60"><p>✓ workspace created</p><p>✓ preview available</p><p>✓ source ready to inspect</p><p>✓ project state retained</p></div>
                </div>
                <div className="overflow-hidden rounded-sm border border-white/10 bg-[#0a0a09]">
                  <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 font-mono text-[10px] text-white/45"><span>PREVIEW / HOME</span><span>DESKTOP</span></div>
                  <div className="flex min-h-[330px] flex-col justify-between gap-6 bg-[#e8e8e3] p-6 text-[#0d0d0c]">
                    <div className="flex items-center justify-between text-[10px] font-semibold tracking-[.15em] text-[#0d0d0c]"><span>ATELIER</span><span>CLIENT SPACE</span></div>
                    <div><p className="max-w-xs text-4xl font-semibold leading-[.92] tracking-[-.07em]">Work that makes every review feel considered.</p><button className="mt-6 rounded-sm bg-[#0d0d0c] px-3 py-2 text-xs font-medium text-white">Request access</button></div>
                    <div className="flex items-center justify-between border-t border-black/20 pt-4 text-xs font-semibold text-black/85"><span>Projects</span><span>Decisions</span><span>Files</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-16 grid border-t border-white/10 md:grid-cols-3">
            {["Brief → working project", "Review the running result", "Retain the work for the next decision"].map((item, index) => <div key={item} className={`flex items-center gap-3 px-0 py-5 text-sm text-white/60 md:px-6 ${index > 0 ? "md:border-l md:border-white/10" : ""}`}><span className="font-mono text-[10px] text-white/35">0{index + 1}</span>{item}</div>)}
          </div>
        </section>

        <section id="loop" className="mx-auto max-w-[1320px] border-x border-t border-white/10">
          <div className="grid lg:grid-cols-[.8fr_1.2fr]">
            <div className="border-b border-white/10 px-6 py-16 sm:px-10 lg:border-b-0 lg:border-r lg:py-24"><SectionLabel>The build loop</SectionLabel><h2 className="mt-5 text-4xl font-semibold leading-[1.01] tracking-[-.065em] md:text-6xl">A prompt should open a loop, not close a conversation.</h2></div>
            <div className="px-6 py-16 sm:px-10 lg:py-24"><p className="max-w-xl text-lg leading-8 text-white/65">Loomspace makes the next decision visible. Every step is anchored to the same project, so you can look at what changed and choose what deserves attention next.</p><Link href="/docs" className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-white hover:text-white/70">See the workspace guide <ArrowRight className="size-4" /></Link></div>
          </div>
          <div className="grid border-t border-white/10 md:grid-cols-5">
            {loop.map(([number, title, copy], index) => <article key={title} className={`min-h-[230px] px-6 py-8 sm:px-8 ${index > 0 ? "md:border-l md:border-white/10" : ""}`}><p className="font-mono text-[11px] text-white/35">{number}</p><h3 className="mt-9 text-2xl font-semibold tracking-[-.045em]">{title}</h3><p className="mt-4 text-sm leading-6 text-white/55">{copy}</p></article>)}
          </div>
        </section>

        <section id="capabilities" className="mx-auto max-w-[1320px] border-x border-t border-white/10">
          <div className="grid lg:grid-cols-[.9fr_1.1fr]">
            <div className="px-6 py-16 sm:px-10 md:py-24"><SectionLabel>Product proof surfaces</SectionLabel><h2 className="mt-5 max-w-xl text-4xl font-semibold leading-[1.01] tracking-[-.065em] md:text-6xl">More places to verify the work.</h2><p className="mt-6 max-w-lg text-lg leading-8 text-white/65">A completed task is not proof. Loomspace puts the useful surfaces around a build so you can assess the application, the implementation, and the retained project state.</p></div>
            <div className="border-t border-white/10 bg-white/[.025] p-5 sm:p-10 lg:border-l lg:border-t-0">
              <div className="overflow-hidden border border-white/15 bg-[#0e0e0d] shadow-[0_20px_55px_rgba(0,0,0,.32)]">
                <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 font-mono text-[10px] text-white/45"><span>INSPECT / PROJECT</span><span>READY FOR REVIEW</span></div>
                <div className="grid min-h-[330px] grid-cols-[130px_minmax(0,1fr)]">
                  <div className="border-r border-white/10 p-3 font-mono text-[10px] text-white/45"><p className="rounded bg-white/10 px-2 py-2 text-white">Preview</p><p className="mt-1 px-2 py-2">Source</p><p className="px-2 py-2">Files</p><p className="px-2 py-2">Data</p><p className="px-2 py-2">Versions</p></div>
                  <div className="p-5"><p className="font-mono text-[10px] uppercase tracking-[.14em] text-white/40">Preview evidence</p><div className="mt-4 overflow-hidden border border-white/10 bg-[#efefe9] p-4 text-[#11110f]"><div className="flex justify-between text-[9px] font-bold tracking-[.15em]"><span>NORTHLINE</span><span>MENU</span></div><p className="mt-12 max-w-[280px] text-3xl font-semibold leading-[.93] tracking-[-.06em]">Space for a team to see the work moving forward.</p><div className="mt-9 grid grid-cols-3 gap-2"><span className="h-12 bg-black/8" /><span className="h-12 bg-black/8" /><span className="h-12 bg-black/8" /></div></div><p className="mt-4 text-xs leading-5 text-white/50">Review the running interface before sending the next focused instruction.</p></div>
                </div>
              </div>
            </div>
          </div>
          <div className="grid border-t border-white/10 md:grid-cols-2 lg:grid-cols-4">{proofItems.map(([number, title, copy, Icon], index) => { const ItemIcon = Icon as typeof Eye; return <article key={title} className={`min-h-[270px] px-6 py-8 sm:px-10 ${index > 0 ? "lg:border-l lg:border-white/10" : ""}`}><p className="font-mono text-[11px] text-white/35">{number}</p><ItemIcon className="mt-8 size-5 text-white/80" /><h3 className="mt-8 text-2xl font-semibold tracking-[-.045em]">{title}</h3><p className="mt-4 text-sm leading-6 text-white/55">{copy}</p></article>; })}</div>
        </section>

        <section id="use-cases" className="mx-auto max-w-[1320px] border-x border-t border-white/10">
          <div className="flex flex-col justify-between gap-6 px-6 py-16 sm:px-10 md:flex-row md:items-end md:py-24"><div><SectionLabel>Use-case catalog</SectionLabel><h2 className="mt-5 text-4xl font-semibold tracking-[-.065em] md:text-6xl">Build for the work in front of you.</h2></div><p className="max-w-md text-base leading-7 text-white/60">Use Loomspace where the result benefits from a real project loop: build, inspect, revise, and retain the context.</p></div>
          <div className="grid border-t border-white/10 md:grid-cols-2 lg:grid-cols-3">{useCases.map(([title, copy, label], index) => <article key={title} className={`group min-h-[220px] px-6 py-8 sm:px-10 ${index % 3 !== 0 ? "lg:border-l lg:border-white/10" : ""} ${index > 2 ? "lg:border-t lg:border-white/10" : ""} ${index % 2 !== 0 ? "md:border-l lg:border-l" : ""}`}><p className="font-mono text-[10px] tracking-[.13em] text-white/35">{label}</p><h3 className="mt-10 text-2xl font-semibold tracking-[-.045em] transition group-hover:text-white/70">{title}</h3><p className="mt-4 max-w-sm text-sm leading-6 text-white/55">{copy}</p></article>)}</div>
        </section>

        <section className="mx-auto max-w-[1320px] border-x border-t border-white/10">
          <div className="grid lg:grid-cols-[1fr_.9fr]">
            <div className="bg-[#f0f0eb] px-6 py-16 text-[#0b0b0a] sm:px-10 md:py-24"><SectionLabel>Workspace, not a black box</SectionLabel><h2 className="mt-5 max-w-xl text-4xl font-semibold leading-[1.01] tracking-[-.065em] md:text-6xl">The project stays legible as it grows.</h2><p className="mt-6 max-w-lg text-lg leading-8 text-black/65">Move between task history, the preview, source, files, data, versions, design references, and release controls without resetting the context every time.</p><Link href="/app" className="mt-8 inline-flex items-center gap-2 rounded-sm bg-[#0b0b0a] px-4 py-3 text-sm font-medium text-white transition hover:bg-black/80">Open the builder <ArrowRight className="size-4" /></Link></div>
            <div className="border-t border-white/10 bg-[#11110f] lg:border-l lg:border-t-0"><div className="border-b border-white/10 p-6 sm:p-9"><GitBranch className="size-5 text-white/80" /><h3 className="mt-5 text-xl font-semibold">Versions and source connection</h3><p className="mt-2 max-w-md text-sm leading-6 text-white/55">Keep larger changes deliberate with saved versions and a route to connect project source.</p></div><div className="border-b border-white/10 p-6 sm:p-9"><Figma className="size-5 text-white/80" /><h3 className="mt-5 text-xl font-semibold">Design context and visual edits</h3><p className="mt-2 max-w-md text-sm leading-6 text-white/55">Use a design reference when it helps, then make visual changes against the running result.</p></div><div className="p-6 sm:p-9"><Globe2 className="size-5 text-white/80" /><h3 className="mt-5 text-xl font-semibold">Publishing and domains</h3><p className="mt-2 max-w-md text-sm leading-6 text-white/55">Review first, then use the project’s publishing and custom-domain controls when ready.</p></div></div>
          </div>
        </section>

        <section className="mx-auto max-w-[1320px] border-x border-t border-white/10">
          <div className="grid lg:grid-cols-[.82fr_1.18fr]">
            <div className="border-b border-white/10 px-6 py-16 sm:px-10 lg:border-b-0 lg:border-r md:py-24"><SectionLabel>Current capability</SectionLabel><h2 className="mt-5 text-4xl font-semibold leading-[1.01] tracking-[-.065em] md:text-5xl">Built to continue the work.</h2><p className="mt-6 max-w-md text-lg leading-8 text-white/65">The difference is not another claim about intelligence. It is keeping the project surfaces together after the first useful result.</p></div>
            <div className="overflow-x-auto"><table className="w-full min-w-[620px] border-collapse text-left"><thead className="font-mono text-[10px] uppercase tracking-[.13em] text-white/40"><tr className="border-b border-white/10"><th className="px-6 py-5 font-normal sm:px-8">Capability</th><th className="border-l border-white/10 px-6 py-5 font-normal sm:px-8">In Loomspace</th><th className="border-l border-white/10 px-6 py-5 font-normal sm:px-8">Prompt-only flow</th></tr></thead><tbody>{comparisons.map(([capability, loomspace, promptOnly]) => <tr key={capability} className="border-b border-white/10 last:border-b-0"><th className="px-6 py-5 text-sm font-medium sm:px-8">{capability}</th><td className="border-l border-white/10 px-6 py-5 text-sm leading-6 text-white/70 sm:px-8"><span className="inline-flex gap-2"><Check className="mt-1 size-3.5 shrink-0" />{loomspace}</span></td><td className="border-l border-white/10 px-6 py-5 text-sm leading-6 text-white/45 sm:px-8">{promptOnly}</td></tr>)}</tbody></table></div>
          </div>
        </section>

        <section className="mx-auto max-w-[1320px] border-x border-t border-white/10">
          <div className="grid lg:grid-cols-[1fr_.9fr]">
            <div className="px-6 py-16 sm:px-10 md:py-24"><SectionLabel>For teams and tools</SectionLabel><h2 className="mt-5 max-w-xl text-4xl font-semibold leading-[1.01] tracking-[-.065em] md:text-6xl">Keep the interface close to the project.</h2><p className="mt-6 max-w-lg text-lg leading-8 text-white/65">Loomspace is built around a workspace first: the place where a build can be reviewed, revised, and released without dissolving into an untraceable handoff.</p></div>
            <div className="border-t border-white/10 bg-white/[.025] p-5 sm:p-10 lg:border-l lg:border-t-0"><div className="border border-white/15 bg-[#11110f] p-6"><div className="flex items-center justify-between"><PlugZap className="size-5 text-white/80" /><span className="rounded-full border border-white/15 px-2 py-1 font-mono text-[9px] uppercase tracking-[.12em] text-white/55">Planned</span></div><h3 className="mt-10 text-3xl font-semibold tracking-[-.055em]">Loomspace MCP</h3><p className="mt-4 text-sm leading-6 text-white/55">A planned way to bring Loomspace project context into tool-driven workflows. It is not a live integration today.</p><div className="mt-8 border-t border-white/10 pt-4 font-mono text-[11px] leading-6 text-white/45"><p>STATUS / PLANNED</p><p>FOCUS / PROJECT CONTEXT</p></div></div></div>
          </div>
        </section>

        <section id="faq" className="mx-auto max-w-[1320px] border-x border-t border-white/10">
          <div className="grid lg:grid-cols-[.7fr_1.3fr]"><div className="border-b border-white/10 px-6 py-16 sm:px-10 lg:border-b-0 lg:border-r md:py-24"><SectionLabel>FAQ</SectionLabel><h2 className="mt-5 text-4xl font-semibold leading-[1.01] tracking-[-.065em] md:text-6xl">Questions before you begin.</h2></div><div>{faqs.map(([question, answer]) => <details key={question} className="group border-b border-white/10 px-6 py-0 last:border-b-0 sm:px-10"><summary className="flex cursor-pointer list-none items-center justify-between gap-5 py-6 text-lg font-medium tracking-[-.025em]"><span>{question}</span><span className="font-mono text-xl font-normal text-white/45 transition group-open:rotate-45">+</span></summary><p className="max-w-2xl pb-7 text-sm leading-7 text-white/60">{answer}</p></details>)}</div></div>
        </section>

        <section className="mx-auto max-w-[1320px] border-x border-t border-white/10 bg-[#f0f0eb] px-6 py-16 text-[#0b0b0a] sm:px-10 md:py-24"><div className="max-w-3xl"><p className="font-mono text-[11px] uppercase tracking-[.16em] text-black/45">Start with the work that matters</p><h2 className="mt-5 text-5xl font-semibold leading-[.94] tracking-[-.075em] md:text-7xl">Build the first version. Keep the project moving.</h2><p className="mt-6 max-w-xl text-lg leading-8 text-black/65">Start with a concrete brief, then use the workspace to review what changed and decide what comes next.</p><div className="mt-9 flex flex-wrap gap-3"><Link href="/app" className="inline-flex items-center gap-2 rounded-sm bg-[#0b0b0a] px-4 py-3 text-sm font-medium text-white transition hover:bg-black/80">Open Loomspace <ArrowRight className="size-4" /></Link><Link href="/docs" className="inline-flex items-center gap-2 rounded-sm border border-black/20 px-4 py-3 text-sm font-medium text-black transition hover:border-black/50">Read the docs <ArrowRight className="size-4" /></Link></div></div></section>

        <footer className="mx-auto flex max-w-[1320px] flex-col justify-between gap-5 border-x border-b border-white/10 px-6 py-8 text-sm text-white/50 sm:flex-row sm:items-center"><span className="font-semibold tracking-[-.04em] text-white">loomspace<span className="text-white/40">.</span></span><div className="flex flex-wrap gap-6"><Link href="/docs" className="hover:text-white">Docs</Link><a href="#loop" className="hover:text-white">Build loop</a><a href="#faq" className="hover:text-white">FAQ</a><Link href="/app" className="hover:text-white">Open builder</Link></div></footer>
      </div>
    </main>
  );
}
