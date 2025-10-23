-- 0001_datasets_player_stats_and_views.sql

-- Enable extension for UUID if needed (Supabase normally has it)
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- 1) datasets table
create table if not exists public.datasets (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  type text not null check (type in ('week','season','manual')),
  period_start date not null,
  period_end date not null, -- exclusive
  season text,
  created_at timestamptz not null default now(),
  unique (type, period_start, period_end)
);

-- 2) player_stats table
create table if not exists public.player_stats (
  id serial primary key,
  dataset_id uuid not null references public.datasets(id) on delete cascade,
  player text not null,
  agents text not null,
  games int not null,
  games_won int not null,
  games_lost int not null,
  rounds int not null,
  rounds_won int not null,
  rounds_lost int not null,
  acs double precision not null,
  kd double precision not null,
  kast_pct double precision,
  adr double precision not null,
  kills int not null,
  kpg double precision not null,
  kpr double precision not null,
  deaths int not null,
  dpg double precision not null,
  dpr double precision not null,
  assists int not null,
  apg double precision not null,
  apr double precision not null,
  fk int not null,
  fkpg double precision not null,
  fd int not null,
  fdpg double precision not null,
  hs_pct double precision not null,
  plants int not null,
  plants_per_game double precision not null,
  defuses int not null,
  defuses_per_game double precision not null,
  econ_rating double precision not null,
  created_at timestamptz not null default now(),
  unique (dataset_id, player)
);

create index if not exists idx_player_stats_player on public.player_stats(player);
create index if not exists idx_player_stats_dataset on public.player_stats(dataset_id);

-- 3) Views for querying

-- helper join of datasets with rows
create or replace view public.v_player_stats as
select
  d.id as dataset_id,
  d.label,
  d.type,
  d.period_start,
  d.period_end,
  d.season,
  s.*
from public.datasets d
join public.player_stats s on s.dataset_id = d.id;

-- All-time aggregate across all datasets (assumes non-overlapping periods)
create or replace view public.v_player_stats_alltime as
select
  s.player,
  sum(s.games) as games,
  sum(s.games_won) as games_won,
  sum(s.games_lost) as games_lost,
  sum(s.rounds) as rounds,
  sum(s.rounds_won) as rounds_won,
  sum(s.rounds_lost) as rounds_lost,
  (sum(s.acs * s.rounds)::double precision / nullif(sum(s.rounds),0)) as acs,
  (sum(s.kills)::double precision / nullif(sum(s.deaths),0)) as kd,
  (sum(s.adr * s.rounds)::double precision / nullif(sum(s.rounds),0)) as adr,
  (sum(s.kast_pct * s.rounds)::double precision / nullif(sum(s.rounds),0)) as kast_pct,
  sum(s.kills) as kills,
  sum(s.deaths) as deaths,
  sum(s.assists) as assists,
  sum(s.fk) as fk,
  sum(s.fd) as fd,
  sum(s.plants) as plants,
  sum(s.defuses) as defuses,
  (sum(s.econ_rating * s.rounds)::double precision / nullif(sum(s.rounds),0)) as econ_rating
from public.player_stats s
group by s.player;

-- Per-season aggregate (season label required)
create or replace view public.v_player_stats_by_season as
select
  d.season,
  s.player,
  sum(s.games) as games,
  sum(s.games_won) as games_won,
  sum(s.games_lost) as games_lost,
  sum(s.rounds) as rounds,
  sum(s.rounds_won) as rounds_won,
  sum(s.rounds_lost) as rounds_lost,
  (sum(s.acs * s.rounds)::double precision / nullif(sum(s.rounds),0)) as acs,
  (sum(s.kills)::double precision / nullif(sum(s.deaths),0)) as kd,
  (sum(s.adr * s.rounds)::double precision / nullif(sum(s.rounds),0)) as adr,
  (sum(s.kast_pct * s.rounds)::double precision / nullif(sum(s.rounds),0)) as kast_pct,
  sum(s.kills) as kills,
  sum(s.deaths) as deaths,
  sum(s.assists) as assists,
  sum(s.fk) as fk,
  sum(s.fd) as fd,
  sum(s.plants) as plants,
  sum(s.defuses) as defuses,
  (sum(s.econ_rating * s.rounds)::double precision / nullif(sum(s.rounds),0)) as econ_rating
from public.datasets d
join public.player_stats s on s.dataset_id = d.id
where d.type = 'season'
group by d.season, s.player;

-- Per-week (one row per player per dataset of type=week)
create or replace view public.v_player_stats_by_week as
select
  d.period_start,
  d.period_end,
  s.player,
  s.games, s.games_won, s.games_lost,
  s.rounds, s.rounds_won, s.rounds_lost,
  s.acs, s.kd, s.adr, s.kast_pct,
  s.kills, s.deaths, s.assists,
  s.fk, s.fd, s.plants, s.defuses,
  s.econ_rating
from public.datasets d
join public.player_stats s on s.dataset_id = d.id
where d.type = 'week';
