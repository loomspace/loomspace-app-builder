-- Owned sandboxd engine mappings. The browser never reads these tables directly;
-- route handlers verify Privy and query with SUPABASE_SECRET_KEY.
alter table public.projects add column if not exists sandbox_app_id text;
alter table public.projects add column if not exists sandbox_id text;
alter table public.build_jobs add column if not exists sandbox_task_id text;

create unique index if not exists projects_sandbox_app_id_idx on public.projects(sandbox_app_id) where sandbox_app_id is not null;
create unique index if not exists projects_sandbox_id_idx on public.projects(sandbox_id) where sandbox_id is not null;
create unique index if not exists build_jobs_sandbox_task_id_idx on public.build_jobs(sandbox_task_id) where sandbox_task_id is not null;
