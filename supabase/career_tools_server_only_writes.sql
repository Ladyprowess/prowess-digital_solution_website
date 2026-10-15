-- Apply alongside the career-tool access fixes. These tools already save
-- through authenticated server routes, which enforce Premium and ownership.
-- Direct table writes bypass those checks, including the free CV limit.
begin;
revoke insert, update, delete on public.member_cvs from anon, authenticated;
revoke insert, update, delete on public.member_portfolios from anon, authenticated;

drop policy if exists "own_rows" on public.member_cvs;
create policy "own_rows" on public.member_cvs for select to authenticated
  using (auth.uid() = user_id);
drop policy if exists "own_rows" on public.member_portfolios;
create policy "own_rows" on public.member_portfolios for select to authenticated
  using (auth.uid() = user_id);
-- Keep public portfolio reading and service-role API writes intact.
commit;
