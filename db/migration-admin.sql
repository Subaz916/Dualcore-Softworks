-- ============================================================
-- DUALCORE SOFTWORKS — admin panel migration
-- Run AFTER schema.sql / migration-auth.sql.
-- Supabase Dashboard → SQL Editor → New query → Run
--
-- IMPORTANT: set the admin email below to match the one in
-- js/admin.js (ADMIN_EMAIL constant).
-- ============================================================

-- ---------- 1. ADMIN USERS table (locked: no public policies) ----------
create table if not exists public.admins (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;

-- ---------- 2. Auto-promote function ----------
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

-- ---------- 3. Admin policies: CONTACTS ----------
drop policy if exists "Admin read contacts" on public.contacts;
create policy "Admin read contacts"
  on public.contacts for select
  using (exists (select 1 from public.admins a where a.id = auth.uid()));

drop policy if exists "Admin update contacts" on public.contacts;
create policy "Admin update contacts"
  on public.contacts for update
  using (exists (select 1 from public.admins a where a.id = auth.uid()));

-- ---------- 4. Admin policies: PROJECTS ----------
drop policy if exists "Admin read all projects" on public.projects;
create policy "Admin read all projects"
  on public.projects for select
  using (exists (select 1 from public.admins a where a.id = auth.uid()));

drop policy if exists "Admin update projects" on public.projects;
create policy "Admin update projects"
  on public.projects for update
  using (exists (select 1 from public.admins a where a.id = auth.uid()))
  with check (exists (select 1 from public.admins a where a.id = auth.uid()));
