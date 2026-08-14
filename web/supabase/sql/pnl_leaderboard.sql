-- PnL leaderboard materialization (app × chain × address × period).
-- Apply manually in the Supabase SQL editor (see web/supabase/sql/README.md).

CREATE TABLE IF NOT EXISTS public.pnl_leaderboard (
  app_id text NOT NULL,
  chain_id integer NOT NULL,
  address text NOT NULL,
  period text NOT NULL CHECK (period IN ('1d', '1w', '1m', 'all')),
  pnl numeric NOT NULL DEFAULT 0,
  pnl_usd numeric NOT NULL DEFAULT 0,
  collateral_price_usd numeric NOT NULL DEFAULT 0,
  value_start numeric NOT NULL DEFAULT 0,
  value_end numeric NOT NULL DEFAULT 0,
  trading_collateral_net_out numeric NOT NULL DEFAULT 0,
  lp_collateral_net_out numeric NOT NULL DEFAULT 0,
  -- Gross primary-collateral notional of outcome swaps in the period (buy + sell legs).
  volume numeric NOT NULL DEFAULT 0,
  volume_usd numeric NOT NULL DEFAULT 0,
  -- roi = pnl_usd / (value_start_usd + buys_usd).
  -- buys = (volume + trading_collateral_net_out) / 2  (= primary as tokenIn;
  --   volume = in+out, net_out = in-out). Use buys — not max(net_out, 0) — so
  --   round-trip / net-seller wallets with large PnL still get a defined ROI.
  -- NULL when capital_usd < $0.01 (dust; avoids ÷0 / “infinite” ROI).
  roi numeric NULL,
  market_count integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (app_id, chain_id, address, period)
);

-- Additive columns for existing deployments (no-op if CREATE TABLE above already has them).
ALTER TABLE public.pnl_leaderboard ADD COLUMN IF NOT EXISTS volume numeric NOT NULL DEFAULT 0;
ALTER TABLE public.pnl_leaderboard ADD COLUMN IF NOT EXISTS volume_usd numeric NOT NULL DEFAULT 0;
ALTER TABLE public.pnl_leaderboard ADD COLUMN IF NOT EXISTS roi numeric NULL;
ALTER TABLE public.pnl_leaderboard ADD COLUMN IF NOT EXISTS lp_collateral_net_out numeric NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS pnl_leaderboard_chain_period_pnl_idx
  ON public.pnl_leaderboard (chain_id, period, pnl DESC);

CREATE INDEX IF NOT EXISTS pnl_leaderboard_app_chain_period_pnl_idx
  ON public.pnl_leaderboard (app_id, chain_id, period, pnl DESC);

CREATE INDEX IF NOT EXISTS pnl_leaderboard_app_period_pnl_usd_idx
  ON public.pnl_leaderboard (app_id, period, pnl_usd DESC);

CREATE INDEX IF NOT EXISTS pnl_leaderboard_app_chain_period_pnl_usd_idx
  ON public.pnl_leaderboard (app_id, chain_id, period, pnl_usd DESC);

CREATE INDEX IF NOT EXISTS pnl_leaderboard_app_chain_period_updated_at_idx
  ON public.pnl_leaderboard (app_id, chain_id, period, updated_at);

COMMENT ON TABLE public.pnl_leaderboard IS
  'Materialized wallet PnL for Seer app leaderboards. Native pnl/volume stored for audit; public rankings use pnl_usd / volume_usd (spot collateral USD at refresh). roi = pnl_usd / (value_start_usd + buys_usd) with buys = (volume + trading_collateral_net_out) / 2; NULL when capital < $0.01. market_count = distinct markets with primary-collateral swaps in the row period.';

-- Refresh job (`refresh-pnl-leaderboard-background`) uses SUPABASE_API_KEY.
-- That must be the service_role key: anon/authenticated are SELECT-only (public
-- leaderboard reads). Upserts with the anon key can return 200 with 0 rows
-- (especially with RLS), so updated_at never moves and the stale batch never rotates.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pnl_leaderboard TO service_role;
GRANT SELECT ON public.pnl_leaderboard TO anon, authenticated;

-- Rotation cursor for refresh-pnl-leaderboard-background (one row, id='default').
CREATE TABLE IF NOT EXISTS public.pnl_leaderboard_refresh_cursor (
  id text PRIMARY KEY DEFAULT 'default',
  app_id text NOT NULL,
  chain_id integer NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pnl_leaderboard_refresh_cursor TO service_role;

-- Single-chain leaderboard with optional address or username search.
create or replace function public.pnl_leaderboard_single_chain(
  p_app_id text,
  p_chain_id integer,
  p_period text,
  p_search text default null,
  p_limit integer default 50,
  p_offset integer default 0
)
returns table (
  address text,
  username text,
  pnl_usd numeric,
  volume_usd numeric,
  roi numeric,
  market_count integer,
  updated_at timestamptz,
  total_count bigint
)
language sql
stable
parallel safe
security invoker
set search_path = public
as $$
  select
    l.address,
    u.username,
    l.pnl_usd,
    l.volume_usd,
    l.roi,
    l.market_count,
    l.updated_at,
    (count(*) over ())::bigint as total_count
  from public.pnl_leaderboard l
  left join public.users u on u.id = l.address
  where l.app_id = p_app_id
    and l.chain_id = p_chain_id
    and l.period = p_period
    and (
      p_search is null
      or p_search = ''
      or l.address ilike
        '%' || replace(replace(replace(p_search, '\', '\\'), '%', '\%'), '_', '\_') || '%'
        escape '\'
      or u.username ilike
        '%' || replace(replace(replace(p_search, '\', '\\'), '%', '\%'), '_', '\_') || '%'
        escape '\'
    )
  order by l.pnl_usd desc, l.address
  limit greatest(coalesce(p_limit, 50), 0)
  offset greatest(p_offset, 0);
$$;

grant execute on function public.pnl_leaderboard_single_chain(text, integer, text, text, integer, integer)
  to anon, authenticated, service_role;

-- All-chains leaderboard: group by address (capital summed per chain row, then across chains).
-- capital_usd = value_start * price + greatest((volume + trading_collateral_net_out) / 2, 0) * price
create or replace function public.pnl_leaderboard_all_chains(
  p_app_id text,
  p_period text,
  p_search text default null,
  p_limit integer default 50,
  p_offset integer default 0
)
returns table (
  address text,
  pnl_usd numeric,
  volume_usd numeric,
  capital_usd numeric,
  market_count bigint,
  updated_at timestamptz,
  total_count bigint
)
language sql
stable
parallel safe
security invoker
set search_path = public
as $$
  with agg as (
    select
      l.address,
      sum(l.pnl_usd) as pnl_usd,
      sum(l.volume_usd) as volume_usd,
      sum(
        (coalesce(l.value_start, 0) * coalesce(l.collateral_price_usd, 0))
        + greatest((coalesce(l.volume, 0) + coalesce(l.trading_collateral_net_out, 0)) / 2, 0)
          * coalesce(l.collateral_price_usd, 0)
      ) as capital_usd,
      sum(l.market_count)::bigint as market_count,
      max(l.updated_at) as updated_at
    from public.pnl_leaderboard l
    left join public.users u on u.id = l.address
    where l.app_id = p_app_id
      and l.period = p_period
      and (
        p_search is null
        or p_search = ''
        or l.address ilike
          '%' || replace(replace(replace(p_search, '\', '\\'), '%', '\%'), '_', '\_') || '%'
          escape '\'
        or u.username ilike
          '%' || replace(replace(replace(p_search, '\', '\\'), '%', '\%'), '_', '\_') || '%'
          escape '\'
      )
    group by l.address
  )
  select
    a.address,
    a.pnl_usd,
    a.volume_usd,
    a.capital_usd,
    a.market_count,
    a.updated_at,
    (count(*) over ())::bigint as total_count
  from agg a
  order by a.pnl_usd desc, a.address
  limit greatest(coalesce(p_limit, 50), 0)
  offset greatest(p_offset, 0);
$$;

grant execute on function public.pnl_leaderboard_all_chains(text, text, text, integer, integer)
  to anon, authenticated, service_role;

create or replace function public.pnl_leaderboard_all_chains_rank(
  p_app_id text,
  p_period text,
  p_address text
)
returns table (
  rank bigint,
  total bigint
)
language sql
stable
parallel safe
security invoker
set search_path = public
as $$
  with agg as (
    select l.address, sum(l.pnl_usd) as pnl_usd
    from public.pnl_leaderboard l
    where l.app_id = p_app_id
      and l.period = p_period
    group by l.address
  ),
  target as (
    select a.address, a.pnl_usd
    from agg a
    where a.address = lower(p_address)
  )
  select
    case
      when exists (select 1 from target) then
        (
          select count(*)::bigint + 1
          from agg a
          cross join target t
          where a.pnl_usd > t.pnl_usd
             or (a.pnl_usd = t.pnl_usd and a.address < t.address)
        )
      else null
    end as rank,
    (select count(*)::bigint from agg) as total;
$$;

grant execute on function public.pnl_leaderboard_all_chains_rank(text, text, text)
  to anon, authenticated, service_role;

notify pgrst, 'reload schema';
