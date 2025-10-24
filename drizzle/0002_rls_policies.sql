-- 0002_rls_policies.sql

alter table public.datasets enable row level security;
alter table public.player_stats enable row level security;

-- Public read of stats/views (anon + authenticated)
create policy if not exists datasets_read_public
  on public.datasets for select
  to anon, authenticated
  using (true);

create policy if not exists player_stats_read_public
  on public.player_stats for select
  to anon, authenticated
  using (true);

-- Writes only via service_role (your server, not the browser)
create policy if not exists datasets_write_service
  on public.datasets for insert, update, delete
  to service_role
  using (true) with check (true);

create policy if not exists player_stats_write_service
  on public.player_stats for insert, update, delete
  to service_role
  using (true) with check (true);
