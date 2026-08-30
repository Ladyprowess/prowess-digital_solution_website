-- Explicit, admin-curated learning content per career path, replacing the
-- old behavior where the Learning section/count was computed by matching
-- shared skill tags (any resource/course tagged with a skill the career
-- path also lists would show up, whether or not it was ever meant for that
-- specific path). `position` is a combined order the admin controls across
-- both tables together - see src/components/admin/LearningItemPicker.tsx,
-- which assigns position from one shared index sequence across courses and
-- resources so a cross-table sort-by-position reconstructs the admin's
-- exact intended order.

create table if not exists career_path_course_map (
  career_path_id uuid not null references career_paths(id) on delete cascade,
  course_id uuid not null references courses(id) on delete cascade,
  position integer not null default 0,
  primary key (career_path_id, course_id)
);

create table if not exists career_path_resource_map (
  career_path_id uuid not null references career_paths(id) on delete cascade,
  resource_id uuid not null references resources(id) on delete cascade,
  position integer not null default 0,
  primary key (career_path_id, resource_id)
);

alter table career_path_course_map enable row level security;
drop policy if exists "public_read_published" on career_path_course_map;
create policy "public_read_published" on career_path_course_map
  for select to anon, authenticated
  using (exists (select 1 from career_paths p where p.id = career_path_course_map.career_path_id and p.status = 'published'));

alter table career_path_resource_map enable row level security;
drop policy if exists "public_read_published" on career_path_resource_map;
create policy "public_read_published" on career_path_resource_map
  for select to anon, authenticated
  using (exists (select 1 from career_paths p where p.id = career_path_resource_map.career_path_id and p.status = 'published'));
