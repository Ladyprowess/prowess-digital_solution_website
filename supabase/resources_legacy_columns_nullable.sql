-- Fixes a real, confirmed-broken bug: eight columns on `resources` are
-- still `NOT NULL` with no default from before the B2C content model
-- existed (the legacy /resources/upload flow always filled every one of
-- them in - a real upload always has a file, so file_path/file_name/
-- file_type/file_size were always safe to require). The current
-- /admin/resources form was built against the newer, superseding columns
-- (resource_type, content/file_url/external_url, level) and never sends
-- type, stage, file_path, file_name, file_type, or file_size at all - and
-- sends description/category as null whenever the admin leaves those
-- (visually optional, no asterisk) fields blank. Every "Add Resource"
-- submission through the admin UI has therefore been failing outright.
--
-- Confirmed live by reproducing the admin form's exact insert payload
-- against the real table and iterating until it stopped erroring -
-- columns hit, in order: description, type, category, stage, file_path,
-- file_name, file_type, file_size. That is the complete list; the probe
-- payload succeeded once all eight were nullable.
--
-- The correct fix is relaxing these stale constraints, not teaching the
-- modern form to fabricate placeholder values (a fake file_size of 0, a
-- fake file_name) for columns describing a file upload that, for a B2C
-- resource, may not exist.
--
-- Existing rows (all from the old upload flow) already have real values
-- in every one of these columns, so this is purely a constraint relax -
-- no data changes.
--
-- Run any time after supabase/resources_schema.sql.

alter table resources alter column type drop not null;
alter table resources alter column category drop not null;
alter table resources alter column stage drop not null;
alter table resources alter column description drop not null;
alter table resources alter column file_path drop not null;
alter table resources alter column file_name drop not null;
alter table resources alter column file_type drop not null;
alter table resources alter column file_size drop not null;
