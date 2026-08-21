-- Expands opportunity_types with the categories the spec wants that the
-- original seed didn't cover. Leaves the existing 6 types (including
-- freelance) untouched.

insert into opportunity_types (slug, name) values
  ('accelerators', 'Accelerators'),
  ('volunteer', 'Volunteer'),
  ('programs', 'Programs'),
  ('other', 'Other')
on conflict (slug) do nothing;
