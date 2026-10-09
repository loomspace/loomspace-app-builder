export type DocsPage = {
  slug: string;
  group: "Start" | "Build" | "Operate" | "Connect" | "Platform" | "Developers";
  title: string;
  summary: string;
  eyebrow: string;
  intro: string;
  sections: { heading: string; paragraphs: string[]; bullets?: string[] }[];
  note?: string;
};

export const docsPages: DocsPage[] = [
  {
    slug: "getting-started",
    group: "Start",
    title: "Getting started",
    summary: "Turn a clear brief into a project you can inspect and continue.",
    eyebrow: "Start here",
    intro: "Loomspace keeps the brief, working application, files, data, and release controls together in one project workspace.",
    sections: [
      { heading: "Start with an outcome", paragraphs: ["Describe who the product is for, the outcome it should create, the pages it needs, and the visual direction. A focused brief produces a result that is easier to review."], bullets: ["Name the primary user and their task.", "Call out required pages and states.", "Mention integrations or data the application needs."] },
      { heading: "Review before you revise", paragraphs: ["Wait for the run to finish, then inspect the live preview and the project workspace. Follow-up work stays attached to the same project rather than becoming a separate disposable response."] },
    ],
  },
  {
    slug: "projects",
    group: "Start",
    title: "Projects",
    summary: "A project is the durable unit for a build and its operational history.",
    eyebrow: "Workspace",
    intro: "Each project contains its build conversation, running preview, source files, managed data, versions, integrations, and release state.",
    sections: [
      { heading: "Keep related work together", paragraphs: ["Create a project by sending the first brief. Continue with focused requests in that workspace so the next run has the project context it needs."] },
      { heading: "Work from the current state", paragraphs: ["The project view refreshes after completed work. Use the current preview address and project state when reviewing a result; do not rely on a previously copied development link."] },
    ],
  },
  {
    slug: "agent-runs",
    group: "Build",
    title: "Agent runs",
    summary: "Send a build or revision, then follow its progress to completion.",
    eyebrow: "Build loop",
    intro: "A run is asynchronous. Loomspace shows its state while the project is being changed and refreshes the project after it completes.",
    sections: [
      { heading: "Use focused follow-ups", paragraphs: ["After you review the preview, describe the one change you want next. Include context about the target screen, behavior, and expected result instead of asking for a vague improvement."] },
      { heading: "Stop with intent", paragraphs: ["Stopping a run requires confirmation. A stopped paid run cannot be resumed, so use it only when the work should end rather than when you simply need to inspect the result."] },
    ],
    note: "Runs and release actions complete asynchronously. Treat a started operation as in progress until the workspace reports its final state.",
  },
  {
    slug: "preview",
    group: "Build",
    title: "Live preview",
    summary: "Use the running application as the evidence for every build decision.",
    eyebrow: "Review",
    intro: "The preview is a live development environment for the current project. Use it to assess hierarchy, content, behavior, and responsive states.",
    sections: [
      { heading: "Navigate project routes", paragraphs: ["The preview address picker discovers routes from the project file tree and excludes API handlers. Search for a page path, then open it in the preview to review that exact surface."] },
      { heading: "Handle a sleeping server", paragraphs: ["A project server may be archived when it is inactive. Interacting with the workspace can start it; wait for the server notice to clear before expecting the preview or editor to respond."] },
    ],
  },
  {
    slug: "files-and-source",
    group: "Build",
    title: "Files and source",
    summary: "Inspect and edit the files behind the preview.",
    eyebrow: "Source",
    intro: "The code panel exposes the project source. Saving an edit writes the file and starts a rebuild so the preview can reflect the new implementation.",
    sections: [
      { heading: "Edit deliberately", paragraphs: ["Use the editor for precise source changes that are easier to make directly than through a prompt. After saving, wait for the rebuild, then revisit the preview to verify the result."] },
      { heading: "Attach supporting files", paragraphs: ["You can include attachments with build requests. Files are checked before upload, and individual attachments are limited to 8 MB. For larger material, provide a public link in the request instead."] },
    ],
  },
  {
    slug: "visual-edits",
    group: "Build",
    title: "Visual edits",
    summary: "Select an element in the preview and turn a visual change into a source change.",
    eyebrow: "Direct manipulation",
    intro: "The visual editor is available on desktop when the live development server is ready. It applies supported changes back into the project source, then rebuilds the application.",
    sections: [
      { heading: "Edit from the rendered result", paragraphs: ["Open the visual editing mode, select the element in the preview, adjust the supported property, and apply the change. Use the refreshed preview to confirm the source-backed result."] },
      { heading: "Know when to use a run instead", paragraphs: ["If an element cannot be safely matched to source, the editor leaves the project unchanged. Use a focused follow-up request for structural or ambiguous changes instead of forcing a visual edit."] },
    ],
  },
  {
    slug: "data",
    group: "Build",
    title: "Data",
    summary: "Manage application records through a typed table and record workspace.",
    eyebrow: "Managed data",
    intro: "The data workspace supports tables, records, typed fields, file fields, and linked records so a project can carry real application state.",
    sections: [
      { heading: "Work with tables and records", paragraphs: ["Choose a table to browse records, open a record for a typed editing form, and create or delete records when needed. File fields include upload and gallery workflows."] },
      { heading: "Filter at the source", paragraphs: ["Paging, sorting, search, and filters are applied by the data query rather than after a page of records reaches the browser. Use the filter builder for linked-record conditions when a relationship needs to narrow results."] },
    ],
  },
  {
    slug: "versions",
    group: "Operate",
    title: "Versions",
    summary: "Keep recoverable project checkpoints before consequential changes.",
    eyebrow: "Recovery",
    intro: "Versions let you inspect a prior project state and restore it when a direction should be undone. Restoration is an asynchronous project operation.",
    sections: [
      { heading: "Create a review point", paragraphs: ["Use versions before a substantial change or when the project reaches a meaningful milestone. They make it easier to compare a later result with a known usable state."] },
      { heading: "Restore carefully", paragraphs: ["Review the version before recovery, start the restore, and wait for the project operation to complete. Then inspect the live preview and source rather than assuming the restored state is ready to release."] },
    ],
  },
  {
    slug: "logs",
    group: "Operate",
    title: "Logs",
    summary: "Read project output when behavior needs evidence beyond the preview.",
    eyebrow: "Diagnostics",
    intro: "Logs provide operational context for a project. Use them alongside the preview and a clear reproduction path when diagnosing a problem.",
    sections: [
      { heading: "Start with an observed behavior", paragraphs: ["Open the affected route, reproduce the behavior, note the action and expected outcome, then inspect relevant logs. This gives a follow-up request a concrete signal to work from."] },
      { heading: "Separate build state from app behavior", paragraphs: ["A completed run does not automatically prove that every route works as intended. Combine run status, preview review, and logs when you need confidence in a change."] },
    ],
  },
  {
    slug: "secrets",
    group: "Operate",
    title: "Secrets",
    summary: "Provide private values to a project without putting them in source code.",
    eyebrow: "Configuration",
    intro: "Project secrets are for credentials and configuration values an application needs at runtime. Keep them out of prompts, source files, and client-side code.",
    sections: [
      { heading: "Add only what the project needs", paragraphs: ["Create a named secret when an integration requires a private value. Use an environment setting where appropriate so development and production configuration can be separated."] },
      { heading: "Keep the boundary clear", paragraphs: ["A secret belongs in project configuration, not in a browser bundle or repository file. If an external service needs a key, add it as a secret before asking for the integration to use it."] },
    ],
    note: "Treat every secret as sensitive. Do not paste credentials into a brief, a public issue, or a client-side configuration value.",
  },
  {
    slug: "github",
    group: "Connect",
    title: "GitHub sync",
    summary: "Connect a repository, inspect its status, and pull its latest changes.",
    eyebrow: "Source control",
    intro: "GitHub sync links a project with a repository and branch. Connection status and pull progress are available from the project workspace.",
    sections: [
      { heading: "Connect with a direction", paragraphs: ["Choose the repository and branch intentionally when creating the connection. Keep the project and repository aligned before beginning a pull so you know which source state should win."] },
      { heading: "Pull and rebuild", paragraphs: ["Pulling retrieves the latest repository changes and starts a project rebuild. Wait for the pull status to finish, then review the live preview and project files."] },
    ],
  },
  {
    slug: "figma",
    group: "Connect",
    title: "Figma",
    summary: "Connect design context to a project before or during a build.",
    eyebrow: "Design context",
    intro: "A Figma connection can be validated before it is used and then attached to a project build. The connection state is available from the workspace.",
    sections: [
      { heading: "Validate before you build", paragraphs: ["Confirm the access token before starting work from a design. This catches access problems before the token is used to provide project context."] },
      { heading: "Use design as context", paragraphs: ["Pair the connected design with a clear build request that names the intended page, behavior, and responsive expectations. A design connection is context, not a substitute for an implementation brief."] },
    ],
  },
  {
    slug: "domains-and-release",
    group: "Connect",
    title: "Domains and release",
    summary: "Move from a reviewed preview to a deliberate public release.",
    eyebrow: "Publish",
    intro: "Publishing is a long-running project operation. A custom domain can be connected once the released application and domain configuration are ready.",
    sections: [
      { heading: "Release after review", paragraphs: ["Check the live preview, routes, and critical interactions before publishing. Start the release and wait for its status instead of treating the initial request as completion."] },
      { heading: "Attach a domain when ready", paragraphs: ["Use the domain workflow to connect a hostname to the project. Keep the required domain configuration accurate and verify the published application through the intended public address."] },
    ],
  },
  {
    slug: "transfers",
    group: "Connect",
    title: "Transfers",
    summary: "Export, import, or duplicate project work with care.",
    eyebrow: "Portability",
    intro: "Project transfer tools support moving or copying project state. Import is destructive and may be rate-limited, so it should be treated as a deliberate operation.",
    sections: [
      { heading: "Export or duplicate before risk", paragraphs: ["Use export or duplication when you need a portable copy or a safe branch for experimentation. Keep track of which project remains the active release candidate."] },
      { heading: "Confirm imports", paragraphs: ["An import replaces project state. Review the source and destination before continuing, then inspect the resulting files, data, and preview after the operation completes."] },
    ],
    note: "Do not use import as a casual undo mechanism. Versions are the safer tool for returning a project to an earlier checkpoint.",
  },
  {
    slug: "platform-overview",
    group: "Platform",
    title: "Platform overview",
    summary: "How a brief becomes a durable application project with reviewable state.",
    eyebrow: "Product model",
    intro: "Loomspace is a project workspace around an AI build loop. It keeps the request, running preview, source, files, data, versions, and release controls attached to the same project.",
    sections: [
      { heading: "A project is the boundary", paragraphs: ["A project is not a chat thread. It is the unit that owns the live preview, source, data, task state and later release decisions. Users should continue work in the same project when the goal is related."] },
      { heading: "Evidence before acceptance", paragraphs: ["A completed agent response is not proof that an application works. Use the preview, project files and relevant logs to verify the behavior before sending the next revision or releasing work."] },
    ],
  },
  {
    slug: "security-and-ownership",
    group: "Platform",
    title: "Security and ownership",
    summary: "How identity and project ownership are used to protect private workspaces.",
    eyebrow: "Security model",
    intro: "Loomspace uses a verified identity session before exposing the builder. Project records are associated with the authenticated identity so a project is not a global dashboard item.",
    sections: [
      { heading: "Identity session", paragraphs: ["The browser signs in through the configured identity provider. The server verifies the access token before creating the private session used by project APIs."] },
      { heading: "Project scope", paragraphs: ["Project lists are filtered by ownership, and project detail, preview, visual edit and build routes validate ownership before forwarding a request. An unknown or out-of-scope project returns not found."] },
    ],
    note: "Do not share a session cookie or paste private project links into a public channel. A project URL is not a replacement for an authenticated session.",
  },
  {
    slug: "usage-and-limits",
    group: "Platform",
    title: "Usage and limits",
    summary: "Understand credits, project caps, and the build safeguards that prevent accidental spend.",
    eyebrow: "Operations",
    intro: "Building and operating an application uses metered resources. Usage in Settings reports account-level credits and the dimensions that consumed them.",
    sections: [
      { heading: "Development and infrastructure", paragraphs: ["Creation, agent runs, publishing, source operations and similar actions can consume development credits. A running application can also consume infrastructure credits through the features it uses."] },
      { heading: "Protect a project", paragraphs: ["Use project credit limits and feature budgets before giving a project to external users. Limits should be set before a public release, not after an unexpected bill."] },
    ],
  },
  {
    slug: "project-lifecycle",
    group: "Developers",
    title: "Project lifecycle",
    summary: "Create, build, review, release, and retain the project over time.",
    eyebrow: "Lifecycle",
    intro: "A project progresses from a concrete brief to a running preview and then through deliberate revisions. Release is a later operation, not the default result of a first prompt.",
    sections: [
      { heading: "Create and build", paragraphs: ["The first brief creates a project and starts its first build. Name the user, outcome and required screens so the first implementation is reviewable."] },
      { heading: "Review and retain", paragraphs: ["Inspect the running result, keep a version before consequential work, then use source control or export when the project needs an external handoff."] },
    ],
  },
  {
    slug: "developer-workflow",
    group: "Developers",
    title: "Developer workflow",
    summary: "Work with source, GitHub, project data, and release controls after the first build.",
    eyebrow: "Developers",
    intro: "Generated work remains inspectable through the project workspace. Developers can use the source editor, connected repository workflow and project data controls to take over precise work.",
    sections: [
      { heading: "Source is part of the workspace", paragraphs: ["The code panel edits project files and starts a rebuild. Pair direct edits with preview review so the visible result and implementation continue to agree."] },
      { heading: "Connect deliberately", paragraphs: ["Use repository sync when a project needs to join an existing engineering workflow. Pulling external changes rebuilds the project, so review the branch and state before initiating it."] },
    ],
  },
  {
    slug: "mcp",
    group: "Developers",
    title: "MCP",
    summary: "The planned path for coding agents to work with user-scoped Loomspace projects.",
    eyebrow: "MCP — planned",
    intro: "Loomspace MCP is not publicly enabled today. The intended design is a remote MCP service that authenticates a Loomspace user, scopes tools to their projects, and never reveals an operator infrastructure credential.",
    sections: [
      { heading: "Why it needs a user boundary", paragraphs: ["An MCP client must not receive the platform operator key. It should use a user-scoped token, then the server must validate project ownership for every tool call."] },
      { heading: "Planned tool set", paragraphs: ["The first tools will cover listing owned projects, starting a build, reading build status, retrieving a preview URL and sending a focused revision. Publish, delete and credential actions will require explicit policy checks."] },
    ],
    note: "There is no Loomspace MCP endpoint or user API token to configure yet. Do not paste an operator credential into an MCP client.",
  },
  {
    slug: "white-label",
    group: "Developers",
    title: "White-label architecture",
    summary: "What is required to offer the builder inside another product without exposing shared infrastructure credentials.",
    eyebrow: "White-label",
    intro: "A white-label builder needs more than a project form. It needs identity, project ownership, per-user spend controls, scoped access, support operations and a clear release policy.",
    sections: [
      { heading: "Keep infrastructure credentials private", paragraphs: ["A browser client must talk to the Loomspace server, not directly to an operator account. The server is responsible for validating the user, enforcing ownership and applying spend limits before it calls build infrastructure."] },
      { heading: "Meter before public access", paragraphs: ["Before external users can start expensive builds, record their credit balance, reserve a budget for the operation, and reconcile the result after it completes. A shared account balance is not a billing model."] },
    ],
  },
  {
    slug: "agency-workflow",
    group: "Developers",
    title: "Agency workflow",
    summary: "Use project workspaces to move from a client brief to review and handoff.",
    eyebrow: "Agencies",
    intro: "For service delivery, the value is a repeatable review loop: brief a project, show a running result, keep client revisions attached to that project, and hand off source or a released application deliberately.",
    sections: [
      { heading: "Begin with an already-sold outcome", paragraphs: ["Start with a specific client requirement rather than a generic experiment. The brief should include pages, brand constraints, required forms or data and the decision the client needs to make first."] },
      { heading: "Keep handoff explicit", paragraphs: ["Use versions, source export and repository connection to make ownership and maintenance clear at the end of a project. A preview alone is not a complete handoff."] },
    ],
  },
  {
    slug: "api-boundary",
    group: "Developers",
    title: "API boundary",
    summary: "How programmable access should be designed without placing secret credentials in a browser.",
    eyebrow: "API — planned",
    intro: "Loomspace does not currently issue user API tokens. Any future API will be user-scoped, server-validated and limited to the caller’s owned projects.",
    sections: [
      { heading: "Server-side only", paragraphs: ["Credentials with authority to create builds or access project state belong on a trusted server. Browser bundles, public configuration and client-side environment variables are not secure places for them."] },
      { heading: "Scope every request", paragraphs: ["A programmable request must identify the user and validate the target project before it can perform a read or mutation. Token rotation, revocation and auditable usage are required before public availability."] },
    ],
    note: "The API surface is planned. Do not treat project browser requests as a public API contract.",
  },
];

export const docsGroups = ["Start", "Build", "Operate", "Connect", "Platform", "Developers"] as const;

export function getDocsPage(slug: string) {
  return docsPages.find((page) => page.slug === slug);
}
