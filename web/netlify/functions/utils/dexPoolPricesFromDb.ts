import type { PortfolioPosition } from "@seer-pm/sdk";
import type { SupportedChain } from "@seer-pm/sdk";
import { getToken0Token1 } from "@seer-pm/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Address } from "viem";
import { getTokenPricesMapping } from "./portfolio";
import type { Database } from "./supabase";

/** Same window as the former subgraph `GetPoolHourDatas` query (~3 months). */
const HISTORY_LOOKBACK_SECONDS = 60 * 60 * 24 * 30 * 3;

function dedupePositionsForPoolHourQuery(positions: PortfolioPosition[]): PortfolioPosition[] {
  const seen = new Set<string>();
  const out: PortfolioPosition[] = [];
  for (const p of positions) {
    const key = `${p.tokenId.toLowerCase()}:${(p.collateralToken ?? "").toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(p);
  }
  return out;
}

type PoolPriceRow = {
  token0: { id: string };
  token1: { id: string };
  token0Price: string;
  token1Price: string;
};

/**
 * Latest DEX pool prices from `dex_pool_hour_prices` (one row per pool via `dex_pool_hour_prices_latest_for_tokens`).
 */
export async function getCurrentTokensPricesForPortfolio(
  supabase: SupabaseClient<Database>,
  positions: PortfolioPosition[],
  chainId: SupportedChain,
): Promise<Record<string, number | undefined>> {
  if (positions.length === 0) {
    return {};
  }

  const tokens = [...new Set(positions.map((p) => p.tokenId.toLowerCase()))];

  const { data, error } = await supabase.rpc("dex_pool_hour_prices_latest_for_tokens", {
    p_chain_id: chainId,
    p_token_ids: tokens,
  });

  if (error) {
    console.error("dex_pool_hour_prices_latest_for_tokens", error);
    return getTokenPricesMapping(positions, [], chainId);
  }

  const rows = data ?? [];
  if (rows.length === 0) {
    return getTokenPricesMapping(positions, [], chainId);
  }

  return getTokenPricesMapping(
    positions,
    rows.map((r) => ({
      token0: { id: r.token0_id },
      token1: { id: r.token1_id },
      token0Price: r.token0_price,
      token1Price: r.token1_price,
    })),
    chainId,
  );
}

/**
 * Nearest hour at or before `startTime` within the lookback window, per pool — mirrors the old subgraph history query.
 */
export async function getHistoryTokensPricesForPortfolio(
  supabase: SupabaseClient<Database>,
  positions: PortfolioPosition[],
  chainId: SupportedChain,
  startTime: number,
): Promise<Record<string, number | undefined>> {
  if (positions.length === 0) {
    return {};
  }

  const unique = dedupePositionsForPoolHourQuery(positions);

  const pToken0: string[] = [];
  const pToken1: string[] = [];
  for (const pos of unique) {
    const { token0, token1 } = getToken0Token1(pos.tokenId as Address, pos.collateralToken as Address);
    pToken0.push(token0.toLowerCase());
    pToken1.push(token1.toLowerCase());
  }

  const { data: rpcRows, error: rpcError } = await supabase.rpc("dex_pool_hour_prices_nearest_before_for_pairs", {
    p_chain_id: chainId,
    p_start_time: startTime,
    p_lookback_seconds: HISTORY_LOOKBACK_SECONDS,
    p_token0_ids: pToken0,
    p_token1_ids: pToken1,
  });

  if (rpcError) {
    console.error("dex_pool_hour_prices_nearest_before_for_pairs", rpcError);
  }

  const poolsAccum: PoolPriceRow[] =
    rpcError || !rpcRows
      ? []
      : rpcRows.map((r) => ({
          token0: { id: r.token0_id },
          token1: { id: r.token1_id },
          token0Price: r.token0_price,
          token1Price: r.token1_price,
        }));

  return getTokenPricesMapping(positions, poolsAccum, chainId);
}
