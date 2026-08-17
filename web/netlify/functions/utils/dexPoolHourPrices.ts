import type { SupportedChain } from "@seer-pm/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";
import { type OutcomePriceToken, type PairMids, mapOutcomePrices, outcomePairs, setPairMid } from "./outcomePrices";
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
 */
export async function getHistoryTokensPricesForPortfolio(
  supabase: SupabaseClient<Database>,
  tokens: OutcomePriceToken[],
  chainId: SupportedChain,
  startTime: number,
): Promise<Record<string, number>> {
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

  return mapOutcomePrices(tokens, midsFromHourRows(rows));
}
