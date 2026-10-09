-- Loomspace platform core. Apply with Supabase SQL editor, `supabase db push`,
-- or a direct Postgres DATABASE_URL. Browser clients do NOT access these tables;
-- the Loomspace server verifies Privy sessions, then uses SUPABASE_SECRET_KEY.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  privy_did text primary key,
  email text,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_did text not null references public.profiles(privy_did) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  created_at timestamptz not null default now()
);

create table if not exists public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  privy_did text not null references public.profiles(privy_did) on delete cascade,
  role text not null check (role in ('owner','admin','member','viewer')),
  created_at timestamptz not null default now(),
  primary key (workspace_id, privy_did)
);

create table if not exists public.projects (
  id text primary key,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  owner_did text not null references public.profiles(privy_did),
  label text,
  description text,
  engine text not null default 'sandboxd' check (engine in ('sandboxd','legacy')),
  status text not null default 'created' check (status in ('created','queued','building','ready','failed','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists projects_workspace_idx on public.projects(workspace_id, updated_at desc);
create index if not exists projects_owner_idx on public.projects(owner_did, updated_at desc);

create table if not exists public.credit_accounts (
  workspace_id uuid primary key references public.workspaces(id) on delete cascade,
  balance_microcredits bigint not null default 0 check (balance_microcredits >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.credit_ledger_transactions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  amount_microcredits bigint not null check (amount_microcredits <> 0),
  kind text not null check (kind in ('grant','debit','reservation_hold','reservation_release','payment')),
  reference text unique,
  reservation_id uuid,
  created_at timestamptz not null default now()
);
create index if not exists credit_ledger_workspace_idx on public.credit_ledger_transactions(workspace_id, created_at desc);

create table if not exists public.credit_reservations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  amount_microcredits bigint not null check (amount_microcredits > 0),
  reference text not null unique,
  state text not null default 'held' check (state in ('held','captured','released','expired')),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.developer_api_tokens (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  owner_did text not null references public.profiles(privy_did),
  name text not null check (char_length(name) between 1 and 80),
  token_digest text not null unique,
  scopes jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  last_used_at timestamptz
);
create index if not exists developer_tokens_owner_idx on public.developer_api_tokens(owner_did, created_at desc);

create table if not exists public.build_jobs (
  id uuid primary key default gen_random_uuid(),
  project_id text not null references public.projects(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  requested_by text not null references public.profiles(privy_did),
  prompt text not null check (char_length(prompt) between 1 and 20000),
  status text not null default 'queued' check (status in ('queued','running','succeeded','failed','cancelled')),
  reserved_microcredits bigint not null default 0 check (reserved_microcredits >= 0),
  provider text,
  model text,
  error_code text,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz
);
create index if not exists build_jobs_workspace_idx on public.build_jobs(workspace_id, created_at desc);
create index if not exists build_jobs_project_idx on public.build_jobs(project_id, created_at desc);

create table if not exists public.build_events (
  id bigint generated always as identity primary key,
  job_id uuid not null references public.build_jobs(id) on delete cascade,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  created_by text not null references public.profiles(privy_did),
  subject text not null check (char_length(subject) between 1 and 200),
  status text not null default 'open' check (status in ('open','in_progress','resolved','closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.support_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  author_did text references public.profiles(privy_did),
  author_role text not null check (author_role in ('user','support','system')),
  body text not null check (char_length(body) between 1 and 12000),
  created_at timestamptz not null default now()
);

create table if not exists public.mcp_audit_events (
  id bigint generated always as identity primary key,
  workspace_id uuid references public.workspaces(id) on delete set null,
  token_id uuid references public.developer_api_tokens(id) on delete set null,
  tool_name text not null,
  outcome text not null check (outcome in ('allowed','denied','error')),
  created_at timestamptz not null default now()
);

-- The server, not browser clients, owns data access because Privy DID isn't a
-- Supabase Auth uid. Enable RLS now; no anon policies means client reads/writes deny.
alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.projects enable row level security;
alter table public.credit_accounts enable row level security;
alter table public.credit_ledger_transactions enable row level security;
alter table public.credit_reservations enable row level security;
alter table public.developer_api_tokens enable row level security;
alter table public.build_jobs enable row level security;
alter table public.build_events enable row level security;
alter table public.support_tickets enable row level security;
alter table public.support_messages enable row level security;
alter table public.mcp_audit_events enable row level security;
