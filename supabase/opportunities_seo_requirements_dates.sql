-- Adds SEO override fields, a Requirements/Application Process rich-text
-- pair (matching the description/eligibility/benefits pattern opportunities
-- already has), and three extra program dates beyond deadline_at.

alter table opportunities add column if not exists meta_title text;
alter table opportunities add column if not exists meta_description text;

alter table opportunities add column if not exists requirements text;
alter table opportunities add column if not exists application_process text;

alter table opportunities add column if not exists application_opens_at timestamptz;
alter table opportunities add column if not exists program_start_at timestamptz;
alter table opportunities add column if not exists program_end_at timestamptz;
