-- Adds SEO override fields and a salary period to jobs, for the admin
-- jobs form (SEO section, salary period select). Additive only.

alter table jobs add column if not exists meta_title text;
alter table jobs add column if not exists meta_description text;

alter table jobs add column if not exists salary_period text
  check (salary_period in ('hour', 'day', 'month', 'year'));
