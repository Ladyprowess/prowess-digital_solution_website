-- Funding (what the opportunity gives you) and application cost (what
-- applying costs you) are two different concepts and must never be
-- conflated in the UI - kept as two separate, independently-nullable
-- groups of columns so an opportunity can be "fully funded" AND still
-- have a paid application fee without one implying the other.

alter table opportunities add column if not exists funding_type text
  check (funding_type in ('fully_funded', 'partially_funded', 'stipend', 'scholarship', 'no_funding', 'other'));
alter table opportunities add column if not exists funding_description text;

alter table opportunities add column if not exists application_cost text
  check (application_cost in ('free', 'paid', 'not_specified'))
  default 'not_specified';
alter table opportunities add column if not exists application_fee numeric;
alter table opportunities add column if not exists application_fee_currency text;
