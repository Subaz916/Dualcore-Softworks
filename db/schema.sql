-- ============================================================
-- DUALCORE SOFTWORKS — Supabase schema (full setup)
-- Run this in Supabase Dashboard → SQL Editor → New query → Run
-- Already ran schema.sql before? Run db/migration-auth.sql instead.
-- ============================================================

-- ---------- 1. CONTACTS (contact form + newsletter) ----------
create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  type text not null default 'contact',      -- 'contact' | 'newsletter'
  name text,
  email text not null,
  message text,
  read boolean not null default false
);

alter table public.contacts enable row level security;

-- Allow anyone to submit (public forms)
create policy "Allow public insert contacts"
  on public.contacts for insert
  with check (true);

-- No public SELECT: read submissions only via the Supabase dashboard
-- (Table Editor uses the service role, which bypasses RLS) or an
-- admin table with its own policies.

-- ---------- 2. PROJECTS (15-step wizard, tied to logged-in user) ----------
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid references auth.users(id) on delete cascade,
  name text,
  email text,
  company text,
  phone text,
  country text,
  website text,
  project_type text,
  budget text,
  timeline text,
  contact_method text,
  status text not null default 'Received',  -- Received → Reviewing → Proposal → Development → Delivered
  status_updated_at timestamptz,
  data jsonb not null default '{}'::jsonb,  -- full wizard answers
  read boolean not null default false
);

alter table public.projects enable row level security;

-- Users can only insert/read their own projects (tracking is private)
create policy "Users insert own projects"
  on public.projects for insert
  with check (auth.uid() = user_id);

create policy "Users read own projects"
  on public.projects for select
  using (auth.uid() = user_id);

-- Optional: allow a status timeline history
-- create table if not exists public.project_events (
--   id uuid primary key default gen_random_uuid(),
--   project_id uuid not null references public.projects(id) on delete cascade,
--   created_at timestamptz not null default now(),
--   event text not null,
--   note text
-- );

-- ---------- 3. ADMINS (admin panel access) ----------
-- IMPORTANT: set the admin email to match js/admin.js (ADMIN_EMAIL).
create table if not exists public.admins (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;

-- Only the configured admin email gets a row; everyone else's
-- call is a no-op, so users cannot promote themselves.
create or replace function public.promote_admin()
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.admins (id, email)
  select auth.uid(), (auth.jwt() ->> 'email')
  where (auth.jwt() ->> 'email') = 'subhandaraz90@gmail.com'
  on conflict (id) do nothing
$$;

grant execute on function public.promote_admin() to authenticated;

-- ---------- 2b. Admin overview RPC (bypasses RLS admin-row issues) ----------
-- security definer runs as the function owner (postgres), so it can read
-- every row. Access is enforced inside the function by checking the JWT
-- email against the admin email, so non-admins get nothing.
create or replace function public.get_admin_view()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  if (auth.jwt() ->> 'email') <> 'subhandaraz90@gmail.com' then
    return null;
  end if;
  select jsonb_build_object(
    'contacts',
    coalesce((select jsonb_agg(t order by t.created_at desc) from public.contacts t), '[]'::jsonb),
    'projects',
    coalesce((select jsonb_agg(t order by t.created_at desc) from public.projects t), '[]'::jsonb)
  ) into result;
  return result;
end;
$$;

grant execute on function public.get_admin_view() to authenticated;

-- Admin users can read their own row (used by the admin panel check)
create policy "Admin read self"
  on public.admins for select
  using (auth.uid() = id);

-- Admin: read + update contacts
create policy "Admin read contacts"
  on public.contacts for select
  using (exists (select 1 from public.admins a where a.id = auth.uid()));

create policy "Admin update contacts"
  on public.contacts for update
  using (exists (select 1 from public.admins a where a.id = auth.uid()));

-- Admin: read all projects + update status
create policy "Admin read all projects"
  on public.projects for select
  using (exists (select 1 from public.admins a where a.id = auth.uid()));

create policy "Admin update projects"
  on public.projects for update
  using (exists (select 1 from public.admins a where a.id = auth.uid()))
  with check (exists (select 1 from public.admins a where a.id = auth.uid()));

-- Admin: delete projects
create policy "Admin delete projects"
  on public.projects for delete
  using (exists (select 1 from public.admins a where a.id = auth.uid()));
