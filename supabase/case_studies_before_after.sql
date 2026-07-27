-- Adds structured before/after fields to case_studies for the visual
-- before/after comparison format (messy workflows -> structured systems)
-- used on the case study detail page. Both optional: older case studies
-- without them just skip the comparison block.

alter table case_studies add column if not exists before_state text;
alter table case_studies add column if not exists after_state text;
