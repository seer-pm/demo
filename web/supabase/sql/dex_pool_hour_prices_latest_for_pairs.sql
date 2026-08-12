-- Latest dex_pool_hour_prices row per (token0, token1) pair on a chain.
--
-- Used by netlify/functions/utils/dexPoolPricesFromDb.ts (getCurrentTokensPricesForPortfolio).
-- Replaces dex_pool_hour_prices_latest_for_tokens (flat token list → expensive scan / timeouts).
--
-- p_token0_ids and p_token1_ids are parallel arrays (same length), lowercase hex.
-- Callers should chunk large pair lists (~80) to stay under statement timeouts.

create or replace function public.dex_pool_hour_prices_latest_for_pairs(
  p_chain_id integer,
  p_token0_ids text[],
  p_token1_ids text[]
)
returns table (
  chain_id integer,
  period_start_unix bigint,
  pool_id text,
  token0_id text,
  token0_price text,
  token1_id text,
  token1_price text
)
language sql
stable
parallel safe
security invoker
set search_path = public
as $$
  select distinct on (q.token0_id, q.token1_id)
    p.chain_id,
    p.period_start_unix,
    p.pool_id,
    p.token0_id,
    p.token0_price::text,
    p.token1_id,
    p.token1_price::text
  from unnest(p_token0_ids, p_token1_ids) as q(token0_id, token1_id)
  inner join public.dex_pool_hour_prices p
    on p.chain_id = p_chain_id
   and p.token0_id = q.token0_id
   and p.token1_id = q.token1_id
  order by q.token0_id, q.token1_id, p.period_start_unix desc;
$$;
