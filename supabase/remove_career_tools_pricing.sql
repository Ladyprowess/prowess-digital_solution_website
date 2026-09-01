-- Career Tools one-time pricing removed - Premium Membership is now the
-- sole way to access CV Builder/CV Checker/Interview Prep/Portfolio
-- Builder. Confirmed via a live query before this migration: only one
-- $0 test-grant row existed in career_tool_purchases (no real paying
-- customers, not pending), so this is a clean drop, not a data migration.
--
-- This is a deliberate second deployment step, run only after the
-- application code that referenced this table/these columns has already
-- shipped and been verified - see the "Remove the separate Career Tools
-- one-time pricing" plan for the full context. Not bundled with that
-- code change; safe to run whenever you're ready, and safe to leave
-- un-run indefinitely if you'd rather not touch it at all (nothing in
-- the app reads or writes these any more either way).
--
-- Plain DROP TABLE (no CASCADE): a repo-wide code search can't see live
-- database objects (views, triggers, functions) that might still
-- reference this table. If one exists, this statement fails loudly
-- instead of silently taking something else down with it - the correct
-- outcome. If it ever fails, find and deliberately remove that specific
-- dependency; don't reach for CASCADE to force it through.
drop table if exists career_tool_purchases;

alter table site_settings
  drop column if exists career_basic_usd,
  drop column if exists career_basic_ngn,
  drop column if exists career_premium_usd,
  drop column if exists career_premium_ngn,
  drop column if exists career_pro_usd,
  drop column if exists career_pro_ngn;
