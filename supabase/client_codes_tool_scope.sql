-- Scope client_codes to specific premium tools, so a code can unlock only
-- what the client's membership tier actually includes (e.g. Diagnostic gets
-- the Calculator and Tracker, Foundation adds Invoice Manager, Growth adds
-- Inventory Manager and Reach & Growth Planner).
--
-- allowed_tools left null/empty means full access to all premium tools -
-- this is the backward-compat default so every existing manually-created
-- code keeps working exactly as it does today, no backfill needed.
--
-- plan_slug is purely for admin traceability (which membership tier issued
-- this code, when it was auto-generated from a payment).

alter table client_codes
  add column if not exists allowed_tools text[],
  add column if not exists plan_slug text;
