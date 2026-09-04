import type { SupportedChain } from "@seer-pm/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  type OutcomePriceToken,
  type PairMids,
  hasPairMid,
  mapOutcomePrices,
  outcomePairs,
  setPairMid,
} from "./outcomePrices";
import type { Database } from "./supabase";

/** Same window as the former subgraph `GetPoolHourDatas` query (~3 months). */
const HISTORY_LOOKBACK_SECONDS = 60 * 60 * 24 * 30 * 3;

/** Keep pair RPC payloads small enough to avoid statement timeouts. */
const PAIR_RPC_CHUNK = 80;

type PoolHourRow = {
  token0_id: string;
  token1_id: string;
  token0_price: string;
  token1_price: string;
};

function midsFromHourRows(rows: PoolHourRow[]): PairMids {
  const mids: PairMids = new Map();
  for (const row of rows) {
    // DEX subgraph naming: `token0Price` is token0 per token1.
    setPairMid(mids, row.token0_id, row.token1_id, {
      token0PerToken1: Number(row.token0_price),
      token1PerToken0: Number(row.token1_price),
    });
  }
  return mids;
}

/**
 * Price of each outcome token at `startTime`: the nearest hour candle at or before it, per pool.
 *
 * History only — current prices come from the pool itself (`getCurrentOutcomePrices`), since candles
 * are only written for hours in which a pool traded.
 *
 * `tokens` must carry the parent chain, root first, exactly as the current-price path does:
 * `mapOutcomePrices` resolves a conditional against its parent's own price, so a batch of bare
 * positions prices every conditional at 0. `settledRatioByToken` should be built with the same
 * `startTime` as the cutoff (`settledPayoutRatios(markets, startTime)`), so a market that settled
 * after this moment is still priced from its candles.
 */
export async function getHistoryTokensPricesForPortfolio(
  supabase: SupabaseClient<Database>,
  tokens: OutcomePriceToken[],
  chainId: SupportedChain,
  startTime: number,
  settledRatioByToken?: Record<string, number>,
): Promise<Record<string, number | undefined>> {
  if (tokens.length === 0) {
    return {};
  }

  const pairs = outcomePairs(tokens);
  const rows: PoolHourRow[] = [];

  for (let i = 0; i < pairs.length; i += PAIR_RPC_CHUNK) {
    const chunk = pairs.slice(i, i + PAIR_RPC_CHUNK);
    const { data, error } = await supabase.rpc("dex_pool_hour_prices_nearest_before_for_pairs", {
      p_chain_id: chainId,
      p_start_time: startTime,
      p_lookback_seconds: HISTORY_LOOKBACK_SECONDS,
      p_token0_ids: chunk.map((pair) => pair.token0),
      p_token1_ids: chunk.map((pair) => pair.token1),
    });

    if (error) {
      console.error("dex_pool_hour_prices_nearest_before_for_pairs", error);
      continue;
    }
    if (data?.length) {
      rows.push(...data);
    }
  }

  const mids = midsFromHourRows(rows);
  return withoutUnpricedTokens(mapOutcomePrices(tokens, mids, settledRatioByToken), tokens, mids, settledRatioByToken);
}

/**
 * Drops the tokens no candle could price, so the caller sees `undefined` rather than 0.
 *
 * `mapOutcomePrices` writes an entry for every input, 0 when the pool is unknown — the right answer
 * for "the pool says zero", the wrong one for "there is no candle here". Candles exist only for
 * hours a pool traded, so a quiet pool has none and a market younger than the reference has none by
 * definition. Both consumers (`positionPriceAtReference`, `positionRowValueAtReference`) already
 * fall back to the current price with `?? position.tokenPrice`, which a 0 silently defeats: the
 * position then reads as worthless at the reference and the whole move shows up in the delta.
 *
 * A conditional needs its parent leg priced too, so the check follows the same root-first order
 * `mapOutcomePrices` relies on: unknown propagates down the chain.
 */
function withoutUnpricedTokens(
  prices: Record<string, number>,
  tokens: OutcomePriceToken[],
  mids: PairMids,
  settledRatioByToken?: Record<string, number>,
): Record<string, number | undefined> {
  const known = new Set<string>();

  for (const { tokenId, collateralToken, parentMarketId } of tokens) {
    const key = tokenId.toLowerCase();
    const hasOwnLeg = settledRatioByToken?.[key] !== undefined || hasPairMid(mids, tokenId, collateralToken);
    const hasParentLeg = parentMarketId === undefined || known.has(collateralToken.toLowerCase());
    if (hasOwnLeg && hasParentLeg) {
      known.add(key);
    }
  }

  const out: Record<string, number | undefined> = {};
  for (const [tokenId, price] of Object.entries(prices)) {
    if (known.has(tokenId)) {
      out[tokenId] = price;
    }
  }
  return out;
}
