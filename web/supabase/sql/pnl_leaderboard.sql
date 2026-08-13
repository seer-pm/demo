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
