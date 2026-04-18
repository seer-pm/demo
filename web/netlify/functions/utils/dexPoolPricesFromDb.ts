import type { PortfolioPosition } from "@seer-pm/sdk";
import type { SupportedChain } from "@seer-pm/sdk";
import { getToken0Token1 } from "@seer-pm/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Address } from "viem";
import { getTokenPricesMapping } from "./portfolio";
import type { Database } from "./supabase";

/** Same window as the former subgraph `GetPoolHourDatas` query (~3 months). */
const HISTORY_LOOKBACK_SECONDS = 60 * 60 * 24 * 30 * 3;

/** Parallel Supabase reads per batch (many unique pools). */
const HISTORY_QUERY_CONCURRENCY = 25;

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

async function fetchHistoryRowForPool(
  supabase: SupabaseClient<Database>,
  chainId: number,
  token0: string,
  token1: string,
  startTime: number,
): Promise<PoolPriceRow | null> {
  const windowStart = startTime - HISTORY_LOOKBACK_SECONDS;
  const { data, error } = await supabase
    .from("dex_pool_hour_prices")
    .select("token0_id, token1_id, token0_price, token1_price")
    .eq("chain_id", chainId)
    .eq("token0_id", token0)
    .eq("token1_id", token1)
    .lte("period_start_unix", startTime)
    .gte("period_start_unix", windowStart)
    .order("period_start_unix", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("dex_pool_hour_prices", error);
    return null;
  }
  if (!data) {
    return null;
  }
  return {
    token0: { id: data.token0_id },
    token1: { id: data.token1_id },
    token0Price: data.token0_price,
    token1Price: data.token1_price,
  };
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
  const poolsAccum: PoolPriceRow[] = [];

  for (let i = 0; i < unique.length; i += HISTORY_QUERY_CONCURRENCY) {
    const chunk = unique.slice(i, i + HISTORY_QUERY_CONCURRENCY);
    const rows = await Promise.all(
      chunk.map(async (pos) => {
        const { token0, token1 } = getToken0Token1(pos.tokenId as Address, pos.collateralToken as Address);
        return fetchHistoryRowForPool(supabase, chainId, token0.toLowerCase(), token1.toLowerCase(), startTime);
      }),
    );
    for (const r of rows) {
      if (r) {
        poolsAccum.push(r);
      }
    }
  }

  return getTokenPricesMapping(positions, poolsAccum, chainId);
}
