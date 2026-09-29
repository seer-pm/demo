-- Lifetime swap volume per market, in USD, written by `batch-odds-background` next to `liquidity`
-- and backfilled for closed markets by `web/scripts/backfill-market-volume.ts`.
--
--   volume_usd           cash: the collateral that changed hands in the market's DEX pools
--   volume_notional_usd  notional: the outcome shares that changed hands, each valued at one unit
--                        of its pool's counterparty (the most a share can pay out)
--
-- Both are recomputed from the pools' lifetime token volumes at current prices, so they are not
-- monotonic: a child market's figures move with its parent token's price.

alter table public.markets
  add column if not exists volume_usd numeric not null default 0,
  add column if not exists volume_notional_usd numeric not null default 0;

comment on column public.markets.volume_usd is
  'Lifetime DEX swap volume in USD, collateral leg (cash). Written by batch-odds-background; see web/supabase/sql/markets_volume.sql.';
comment on column public.markets.volume_notional_usd is
  'Lifetime DEX swap volume in USD, outcome leg valued at one counterparty unit per share (notional). Written by batch-odds-background.';

-- `markets_search` is a plain view over `markets`, and a view's column list is fixed when it is
-- created, so the new columns do not show up in it until it is recreated. Its definition is not
-- kept in this repo: dump the live one first and paste it below, adding the two columns.
--
--   select relkind from pg_class where relname = 'markets_search';                     -- expect 'v'
--   select pg_get_viewdef('public.markets_search'::regclass, true);
--   select grantee, privilege_type from information_schema.role_table_grants
--    where table_name = 'markets_search';
--
-- `create or replace view` only accepts new columns appended at the end of the select list. If the
-- live definition selects `m.*` followed by computed columns, the table columns land in the middle
-- and Postgres rejects the replace ("cannot change name of view column"), so recreate it instead,
-- in one transaction, restoring the grants the query above printed:
--
--   begin;
--   drop view public.markets_search;
--   create view public.markets_search as <live definition, now including volume_usd and volume_notional_usd>;
--   grant select on public.markets_search to anon, authenticated, service_role;  -- as printed
--   commit;

-- Optional, for `orderBy: "volumeUSD"` on large chains. `create index concurrently` cannot run inside
-- a transaction, so run it on its own.
-- create index concurrently if not exists markets_volume_usd_idx on public.markets (volume_usd desc);
