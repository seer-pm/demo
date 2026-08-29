-- Per-market PnL materialization.
--
-- Source of truth for wallet P/L, one row per (chain, wallet, market, period). The existing
-- `pnl_leaderboard` stays as the read model and is derived from these rows by summing: `app_id`
-- becomes a market allowlist applied at write time rather than a separate compute pass.
--
-- Apply manually in the Supabase SQL editor (see web/supabase/sql/README.md). There is no
-- migration runner.
--
-- Why P/L is additive across markets: every input already carries a market id — outcome positions
-- (`PortfolioPosition.marketId`), swaps / LP mints / burns (`TransactionData.marketId`), and
-- split/merge/redeem (`ConditionalEvent.market`). The router term is stored as a *cumulative* per
-- market, so `net_in_window ≡ cum_end − cum_start` and one formula covers both the protocol-wide
-- and the market-scoped case:
--
--   value(market, t) = outcome_mtm(market, t) + router_primary_cum(market, t)
--   pnl(market)      = Δvalue − trading_collateral_net_out − lp_collateral_net_out

CREATE TABLE IF NOT EXISTS public.pnl_market_leaderboard (
  chain_id integer NOT NULL,
  address text NOT NULL,
  market_id text NOT NULL,
  period text NOT NULL CHECK (period IN ('1d', '1w', '1m', '3m', '6m', '1y', 'all')),

  -- Native primary collateral. `pnl_usd` is the ranking metric (spot collateral USD at refresh).
  pnl numeric NOT NULL DEFAULT 0,
  pnl_usd numeric NOT NULL DEFAULT 0,
  collateral_price_usd numeric NOT NULL DEFAULT 0,

  -- value_* = mtm + router_primary_cum, stored summed for read compatibility with pnl_leaderboard
  -- and split for audit. Keeping both halves is what lets a shadow comparison measure them
  -- independently instead of deriving one by subtracting the other.
  value_start numeric NOT NULL DEFAULT 0,
  value_end numeric NOT NULL DEFAULT 0,
  value_start_mtm numeric NOT NULL DEFAULT 0,
  value_end_mtm numeric NOT NULL DEFAULT 0,
  router_primary_cum_start numeric NOT NULL DEFAULT 0,
  router_primary_cum_end numeric NOT NULL DEFAULT 0,
  -- Gross split side inside the window. ROI capital needs deployment, not deployment netted
  -- against return: a wallet that splits and later redeems nets to ~0 and would have no denominator.
  router_primary_split_gross numeric NOT NULL DEFAULT 0,

  trading_collateral_net_out numeric NOT NULL DEFAULT 0,
  lp_collateral_net_out numeric NOT NULL DEFAULT 0,

  -- Gross swap notional in primary collateral: the market-collateral leg, priced 1/N on
  -- conditional markets (see volumeCollateralPrice.ts).
  volume numeric NOT NULL DEFAULT 0,
  volume_usd numeric NOT NULL DEFAULT 0,
  -- Peak primary collateral at risk in the window, seeded with the position already open when it
  -- started. This is the WHOLE ROI denominator: do not add value_start to it. Not part of P/L.
  capital_deployed numeric NOT NULL DEFAULT 0,

  -- Outcome tokens received peer-to-peer, with no offsetting cashflow. Per-market granularity makes
  -- this visible: such a row shows pure MTM profit and is a trivial wash pattern. Recorded so those
  -- rows can be flagged; no policy is applied by this schema.
  p2p_outcome_net_in numeric NOT NULL DEFAULT 0,

  -- Had a market-collateral swap leg in the window. `market_count` is
  -- `count(*) FILTER (WHERE traded)`, NOT a stored sum — summing it across chains and executors
  -- (as the current rollup does) double-counts shared markets.
  traded boolean NOT NULL DEFAULT false,

  -- Window bounds, from the wallet's global activity — NOT per-market inception. Per-market
  -- inception yields identical numbers (before first contact the EOD balance is 0 and there are no
  -- flows) but makes window_start differ per row, which breaks SQL-level reconciliation.
  window_start bigint NOT NULL,
  window_end bigint NOT NULL,

  -- Cashflow is replayed only past this point; see pnl_market_daily_delta.
  cashflow_through_ts bigint NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (chain_id, address, market_id, period)
);

-- No `roi` column: ROI is not additive. It is recomputed at read time as summed pnl_usd over
-- summed capital_deployed_usd (roiFromCapitalUsd in pnlLeaderboardMetrics.ts).

CREATE INDEX IF NOT EXISTS pnl_market_leaderboard_market_period_pnl_idx
  ON public.pnl_market_leaderboard (chain_id, market_id, period, pnl_usd DESC);

CREATE INDEX IF NOT EXISTS pnl_market_leaderboard_address_period_idx
  ON public.pnl_market_leaderboard (chain_id, address, period);

CREATE INDEX IF NOT EXISTS pnl_market_leaderboard_period_updated_at_idx
  ON public.pnl_market_leaderboard (chain_id, period, updated_at);

COMMENT ON TABLE public.pnl_market_leaderboard IS
  'Wallet P/L per market and period. Global and per-app boards are sums over this table; pnl_leaderboard is the derived read model. value_* = outcome MTM + cumulative primary router collateral. market_count = count(*) FILTER (WHERE traded); roi is computed at read time, never stored.';

-- Per-day cashflow deltas, sparse: a row exists only for a (wallet, market, day) with activity.
--
-- This exists so the daily window roll is an addition rather than a replay. At UTC midnight the
-- `1w` boundary moves from EOD(D−7) to EOD(D−6); the difference is exactly day D−6's cashflow, so
-- `cum_start += delta(D−6)` — and only for pairs that had activity on that specific day. Without
-- it, every sliding window would have to be recomputed from inception for every pair, every day.
--
-- Same grain as analytics_daily_wallet_market, which already exists in production at this
-- cardinality. It cannot live in that table: swap and LP cashflow come from the Goldsky DEX
-- subgraphs and never reach Supabase, so only the P/L job can populate this.
CREATE TABLE IF NOT EXISTS public.pnl_market_daily_delta (
  chain_id integer NOT NULL,
  address text NOT NULL,
  market_id text NOT NULL,
  day integer NOT NULL,

  trading_collateral_net_out numeric NOT NULL DEFAULT 0,
  lp_collateral_net_out numeric NOT NULL DEFAULT 0,
  -- split → negative, merge/redeem → positive. Primary-collateral legs only.
  router_primary_net numeric NOT NULL DEFAULT 0,
  router_primary_split_gross numeric NOT NULL DEFAULT 0,
  volume numeric NOT NULL DEFAULT 0,
  -- Primary spent buying outcomes on this day (swap `tokenIn` = primary).
  swap_buys numeric NOT NULL DEFAULT 0,
  p2p_outcome_net_in numeric NOT NULL DEFAULT 0,
  traded boolean NOT NULL DEFAULT false,

  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (chain_id, address, market_id, day)
);

CREATE INDEX IF NOT EXISTS pnl_market_daily_delta_day_idx
  ON public.pnl_market_daily_delta (chain_id, day);

CREATE INDEX IF NOT EXISTS pnl_market_daily_delta_address_day_idx
  ON public.pnl_market_daily_delta (chain_id, address, day);

COMMENT ON TABLE public.pnl_market_daily_delta IS
  'Sparse per-UTC-day cashflow deltas per (wallet, market), in primary collateral. Exists so the daily window roll adds one day rather than replaying the window. MTM is deliberately absent: it is derived from balances x prices at the boundary and would have to be rewritten on every price tick.';

-- Rotation cursors for the per-market refresh.
--   id='default'          -- the wallet pass; cursor is (chain_id, address). One job per chain.
--   id='mtm-scan:<chain>' -- the MTM sweep; cursor is (chain_id, market_id).
-- The MTM sweep needs a cursor of its own because it cannot rotate on pnl_market_leaderboard's
-- updated_at: that column moves only when an MTM value actually changes (and not at all on the
-- default dry run), so a market whose price is stable would hold the head of the queue forever.
CREATE TABLE IF NOT EXISTS public.pnl_market_refresh_cursor (
  id text PRIMARY KEY DEFAULT 'default',
  chain_id integer NOT NULL,
  address text NOT NULL DEFAULT '',
  market_id text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- For projects that already applied an earlier version of this file.
ALTER TABLE public.pnl_market_refresh_cursor
  ADD COLUMN IF NOT EXISTS market_id text NOT NULL DEFAULT '';

-- The refresh job needs the service_role key. anon/authenticated are SELECT-only: an upsert with
-- the anon key returns 200 with 0 rows (especially under RLS), so updated_at never moves and the
-- stale batch never rotates. pnl_leaderboard has guards for exactly this failure.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pnl_market_leaderboard TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pnl_market_daily_delta TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pnl_market_refresh_cursor TO service_role;
GRANT SELECT ON public.pnl_market_leaderboard TO anon, authenticated;

notify pgrst, 'reload schema';
