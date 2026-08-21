-- Adds two more structured description fields to jobs, matching the
-- existing description/responsibilities/requirements pattern, so the admin
-- rich-text editor can cover "Benefits" and "Nice to Have" as their own
-- sections instead of folding them into one giant description field.

alter table jobs add column if not exists benefits text;
alter table jobs add column if not exists nice_to_have text;
