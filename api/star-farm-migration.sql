alter table public.players
  add column if not exists star_farm jsonb,
  add column if not exists farm_level integer not null default 1,
  add column if not exists farm_energy bigint not null default 0,
  add column if not exists farm_dust bigint not null default 0,
  add column if not exists farm_planet_rarity integer not null default 1,
  add column if not exists farm_total_energy bigint not null default 0;

create index if not exists players_farm_rating_idx
  on public.players (farm_level desc, farm_total_energy desc, farm_planet_rarity desc);
