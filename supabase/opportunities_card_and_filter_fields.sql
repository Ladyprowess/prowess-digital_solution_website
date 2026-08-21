-- Structured, admin-entered fields for the opportunity card and filters -
-- deliberately separate from the existing rich-text eligibility/benefits
-- columns, so the card/filters only ever show something the admin
-- explicitly confirmed, never something parsed/guessed out of free text.

-- Who can apply (e.g. Nigeria, Africa, Global) - distinct from
-- location_type/country/city, which describe where the program itself
-- runs, not who is eligible to apply to it.
alter table opportunities add column if not exists eligible_locations text[];

-- Short structured chips for the card (e.g. "Fully funded", "Mentorship",
-- "Certificate") - not derived from the benefits rich text.
alter table opportunities add column if not exists benefit_tags text[];

-- One-line card summary, distinct from the full rich-text eligibility field.
alter table opportunities add column if not exists eligibility_summary text;

alter table opportunities add column if not exists organisation_logo_url text;
