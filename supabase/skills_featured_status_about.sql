-- featured/status match the same pattern jobs/opportunities/courses/
-- resources already use. status defaults to 'published' so every skill
-- created implicitly via SkillPicker elsewhere keeps working unchanged.
-- `about` is a distinct, longer rich-text field from the existing short
-- `description` blurb (same short-blurb-vs-longer-rich-text split already
-- used elsewhere, e.g. jobs' description vs benefits/nice_to_have).

alter table skills add column if not exists featured boolean not null default false;
alter table skills add column if not exists status text not null default 'published'
  check (status in ('draft', 'published'));
alter table skills add column if not exists about text;
