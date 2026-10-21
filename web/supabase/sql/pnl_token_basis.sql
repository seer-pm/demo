-- Per-token cost basis materialization.
--
-- One row per (chain, wallet, outcome token): the weighted-average cost of what the wallet holds,
-- what it realized on completed round trips, and the flags that say when the figure cannot be
-- trusted. Written by the P/L refresh job from the same event stream as `pnl_market_leaderboard`
-- (`utils/costBasisCompute.ts`); read by the portfolio Positions table through a Netlify function.
--
-- Apply manually in the Supabase SQL editor (see web/supabase/sql/README.md). There is no
-- migration runner.
--
-- Costs are in the market's primary collateral, never USD. A conditional market's token carries
-- the cost it inherited from the parent outcome that paid for it, so it is in primary too.

CREATE TABLE IF NOT EXISTS public.pnl_token_basis (
  chain_id integer NOT NULL,
  address text NOT NULL,
  token_id text NOT NULL,
  market_id text NOT NULL,
  token_index integer NOT NULL,

  -- Outcome tokens the fold believes the wallet holds, and the remaining cost of them.
  quantity numeric NOT NULL DEFAULT 0,
  cost numeric NOT NULL DEFAULT 0,
  -- cost / quantity; NULL with no position.
  average_cost numeric,

  -- Primary collateral gained or lost on sales, merges and redeems, over the whole history.
  realized numeric NOT NULL DEFAULT 0,
  total_bought numeric NOT NULL DEFAULT 0,
  total_sold numeric NOT NULL DEFAULT 0,

  -- The token entered or left an AMM position: no entry price is shown for it.
  lp_touched boolean NOT NULL DEFAULT false,
  -- The fold removed more than it held, could not attribute a redeem, lost a transfer page, or
  -- disagrees with the indexed balance: the row is shown as approximate.
  approximate boolean NOT NULL DEFAULT false,
  -- Some split that minted this token had no pool price and was spread 1/N.
  even_split boolean NOT NULL DEFAULT false,

  last_event_at bigint,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (chain_id, address, token_id)
);

CREATE INDEX IF NOT EXISTS pnl_token_basis_address_idx
  ON public.pnl_token_basis (chain_id, address);
CREATE INDEX IF NOT EXISTS pnl_token_basis_updated_at_idx
  ON public.pnl_token_basis (chain_id, updated_at);

COMMENT ON TABLE public.pnl_token_basis IS
  'Weighted-average cost basis per (chain, wallet, outcome token), in primary collateral; refreshed by the P/L job.';

-- Refresh writes need service_role; anon upserts silently write 0 rows.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pnl_token_basis TO service_role;
GRANT SELECT ON public.pnl_token_basis TO anon, authenticated;

notify pgrst, 'reload schema';
