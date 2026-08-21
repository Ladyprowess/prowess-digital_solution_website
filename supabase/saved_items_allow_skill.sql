-- Lets users save a skill, same as they can already save a job, opportunity,
-- resource, course or career path. Postgres's default auto-generated name
-- for the inline check constraint on this column is
-- saved_items_item_type_check, matching this project's existing
-- constraint-naming convention.

alter table saved_items drop constraint if exists saved_items_item_type_check;
alter table saved_items add constraint saved_items_item_type_check
  check (item_type in ('job', 'opportunity', 'resource', 'course', 'career_path', 'skill'));
