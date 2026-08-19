-- Restores dashboard access after enabling Row Level Security.
--
-- RLS defaults to deny-all once turned on for a table -- with zero policies
-- attached, every query from the browser (which uses the anon/session key,
-- never the service role) came back empty. That's why messages,
-- announcements, tasks, etc. went dark: the rows were never deleted, they
-- were just no longer visible to the app.
--
-- profiles is intentionally left alone here -- it doesn't have RLS enabled
-- and isn't part of this fix.

-- 1. Shared team tables: any signed-in user can read and write.
-- These are collaborative, team-wide tables -- the dashboard queries them
-- with no per-user filtering (select("*") for everyone), so "authenticated"
-- is the correct boundary: it matches existing app behavior while shutting
-- out anonymous/logged-out access that the anon key alone used to allow.

drop policy if exists "authenticated_full_access" on public.messages;
create policy "authenticated_full_access" on public.messages
  for all to authenticated using (true) with check (true);

drop policy if exists "authenticated_full_access" on public.announcements;
create policy "authenticated_full_access" on public.announcements
  for all to authenticated using (true) with check (true);

drop policy if exists "authenticated_full_access" on public.tasks;
create policy "authenticated_full_access" on public.tasks
  for all to authenticated using (true) with check (true);

drop policy if exists "authenticated_full_access" on public.task_assignments;
create policy "authenticated_full_access" on public.task_assignments
  for all to authenticated using (true) with check (true);

drop policy if exists "authenticated_full_access" on public.activity_logs;
create policy "authenticated_full_access" on public.activity_logs
  for all to authenticated using (true) with check (true);

drop policy if exists "authenticated_full_access" on public.kpi_assignments;
create policy "authenticated_full_access" on public.kpi_assignments
  for all to authenticated using (true) with check (true);

drop policy if exists "authenticated_full_access" on public.kpi_logs;
create policy "authenticated_full_access" on public.kpi_logs
  for all to authenticated using (true) with check (true);

drop policy if exists "authenticated_full_access" on public.weekly_winners;
create policy "authenticated_full_access" on public.weekly_winners
  for all to authenticated using (true) with check (true);

drop policy if exists "authenticated_full_access" on public.monthly_winners;
create policy "authenticated_full_access" on public.monthly_winners
  for all to authenticated using (true) with check (true);

drop policy if exists "authenticated_full_access" on public.available_projects;
create policy "authenticated_full_access" on public.available_projects
  for all to authenticated using (true) with check (true);

-- 2. Financial tables: admin-only, enforced at the database level.
-- The dashboard already treats these as admin-only in the UI (role-gated
-- forms and buttons), but with RLS off that was cosmetic only -- anyone
-- with the anon key could read every employee's payroll/commission data
-- directly via the API. This closes that gap instead of just restoring the
-- old (unrestricted) behavior.

drop policy if exists "admin_full_access" on public.payroll_entries;
create policy "admin_full_access" on public.payroll_entries
  for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

drop policy if exists "admin_full_access" on public.commission_sales;
create policy "admin_full_access" on public.commission_sales
  for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

drop policy if exists "admin_full_access" on public.offline_income;
create policy "admin_full_access" on public.offline_income
  for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

drop policy if exists "admin_full_access" on public.offline_outgoing;
create policy "admin_full_access" on public.offline_outgoing
  for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));
