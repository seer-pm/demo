-- DEX pool hour candles (one row per chain × pool × hour bucket).
-- Written by `dex-pool-prices-background` (triggered by `scheduled-dex-pool-prices`);
-- read by portfolio history (`utils/dexPoolHourPrices.ts`) and the airdrop calculation
-- (`utils/airdropCalculation/getPoolHourDatas.ts`).
--
-- Table, indexes and grants below were captured from the live project
-- (`information_schema.columns` / `pg_indexes`), not hand-written. The objects predate this
-- file; it exists so the schema is reviewable, not to create anything new.
--
-- Apply manually in the Supabase SQL editor (see web/supabase/sql/README.md).

CREATE TABLE IF NOT EXISTS public.dex_pool_hour_prices (
  chain_id integer NOT NULL,
  pool_id text NOT NULL,
  token0_id text NOT NULL,
  token1_id text NOT NULL,
  -- DEX subgraph naming: token0_price is token0 per token1. Stored as text, verbatim from the
  -- subgraph, to avoid rounding on ingest; callers parse with Number().
  token0_price text NOT NULL,
  token1_price text NOT NULL,
  -- Start of the subgraph hour bucket. Only fully completed hours are persisted.
  period_start_unix bigint NOT NULL,
  PRIMARY KEY (chain_id, pool_id, period_start_unix)
);

-- Pair-scoped lookups: `getPoolHourDatasByTokenPair` and
-- `dex_pool_hour_prices_nearest_before_for_pairs` below.
CREATE INDEX IF NOT EXISTS idx_dex_pool_hour_prices_chain_tokens_period
  ON public.dex_pool_hour_prices (chain_id, token0_id, token1_id, period_start_unix DESC);

-- Time-range scans and earliest/latest probes: `getAllPoolHourDatas`,
-- `fetchPoolHourDatasTimeRange`, and the ingest job's bootstrap watermark seed.
CREATE INDEX IF NOT EXISTS idx_dex_pool_hour_prices_chain_period
  ON public.dex_pool_hour_prices (chain_id, period_start_unix DESC);

COMMENT ON TABLE public.dex_pool_hour_prices IS
  'Hourly DEX pool price candles per chain. Sparse by design: the subgraph only emits a bucket for hours in which the pool traded, so consumers take the nearest candle at or before the timestamp they need. Current (non-historical) prices are read from the pools on-chain, not from here.';

-- Nearest candle at or before `p_start_time` for each (token0, token1) pair, bounded by
-- `p_lookback_seconds` so a long-dead pool does not resolve to a stale price. The two token
-- arrays are parallel: element i of each forms one pair. One row per pair.
--
-- Dumped verbatim from the live project with `pg_get_functiondef`. Keep the argument types as
-- they are: `CREATE OR REPLACE` only replaces on an exact signature match, so calling this
-- with `integer` instead of `bigint` adds a second overload and PostgREST can no longer
-- resolve the call. Re-dump rather than re-derive.
CREATE OR REPLACE FUNCTION public.dex_pool_hour_prices_nearest_before_for_pairs(p_chain_id integer, p_start_time bigint, p_lookback_seconds bigint, p_token0_ids text[], p_token1_ids text[])
 RETURNS TABLE(chain_id integer, period_start_unix bigint, pool_id text, token0_id text, token1_id text, token0_price text, token1_price text)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  WITH pair_list AS (
    SELECT u.token0_id, u.token1_id
    FROM unnest(p_token0_ids, p_token1_ids) AS u(token0_id, token1_id)
  )
  SELECT DISTINCT ON (pl.token0_id, pl.token1_id)
    d.chain_id,
    d.period_start_unix::bigint,
    d.pool_id,
    d.token0_id,
    d.token1_id,
    d.token0_price,
    d.token1_price
  FROM pair_list pl
  INNER JOIN dex_pool_hour_prices d ON
    d.chain_id = p_chain_id
    AND d.token0_id = pl.token0_id
    AND d.token1_id = pl.token1_id
    AND d.period_start_unix <= p_start_time
    AND d.period_start_unix >= p_start_time - p_lookback_seconds
  ORDER BY pl.token0_id, pl.token1_id, d.period_start_unix DESC;
$function$;

-- The ingest job (`dex-pool-prices-background`) upserts with SUPABASE_API_KEY. That must be
-- the service_role key: anon/authenticated are SELECT-only.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dex_pool_hour_prices TO service_role;
GRANT SELECT ON public.dex_pool_hour_prices TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.dex_pool_hour_prices_nearest_before_for_pairs(integer, bigint, bigint, text[], text[])
  TO anon, authenticated, service_role;
