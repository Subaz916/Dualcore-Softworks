-- ============================================================
-- DUALCORE SOFTWORKS — auth migration (run ONLY if you already
-- ran the previous schema.sql). Adds user tracking + new RLS.
-- Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================

-- 1. Columns for user ownership + status tracking
alter table public.projects
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table public.projects
  add column if not exists status text not null default 'Received';

alter table public.projects
  add column if not exists status_updated_at timestamptz;

-- 2. Replace old policies with per-user policies
drop policy if exists "Allow public insert projects" on public.projects;
drop policy if exists "Allow owner read projects" on public.projects;

create policy "Users insert own projects"
  on public.projects for insert
  with check (auth.uid() = user_id);

create policy "Users read own projects"
  on public.projects for select
  using (auth.uid() = user_id);

-- 3. Tighten contacts: no public read (view via Supabase dashboard
--    Table Editor, which uses the service role and bypasses RLS)
drop policy if exists "Allow owner read contacts" on public.contacts;
