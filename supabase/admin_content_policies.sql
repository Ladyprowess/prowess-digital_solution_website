-- Grants Prowess Digital Solutions staff (profiles.role = 'admin') full
-- read/write access to every curated-content table, so the new
-- /admin/work, /admin/opportunities, /admin/learn and /admin/resources
-- pages can write directly with the signed-in user's session (anon key +
-- RLS), the same way /dashboard already does for payroll_entries etc. --
-- instead of a custom server-side auth check. No employer/public write
-- access is granted anywhere here; only 'admin' profiles.
--
-- Run after supabase/jobs_opportunities_schema.sql,
-- supabase/resources_schema.sql and supabase/accounts_schema.sql.
--
-- Policies are additive in Postgres RLS: a non-admin authenticated user
-- still only sees published rows via the existing "public_read*" policies;
-- an admin additionally matches these and can see/write everything.

do $$
declare
  t text;
begin
  foreach t in array array[
    'companies',
    'jobs',
    'job_skill_map',
    'job_categories',
    'job_types',
    'job_sources',
    'opportunities',
    'opportunity_skill_map',
    'opportunity_types',
    'career_paths',
    'career_path_skill_map',
    'courses',
    'course_modules',
    'course_lessons',
    'course_skill_map',
    'resources',
    'resource_skill_map',
    'purchases'
  ]
  loop
    execute format('drop policy if exists "admin_full_access" on public.%I', t);
    execute format(
      'create policy "admin_full_access" on public.%I
         for all to authenticated
         using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = ''admin''))
         with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = ''admin''))',
      t
    );
  end loop;
end $$;
