-- Resources never got SEO override fields either - bringing it to the same
-- standard as jobs/opportunities/courses now have.

alter table resources add column if not exists meta_title text;
alter table resources add column if not exists meta_description text;
