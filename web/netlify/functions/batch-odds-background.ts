import { getToken0Token1, tickToPrice } from "@seer-pm/sdk";
import { normalizeOdds } from "@seer-pm/sdk/market-odds";
import { createClient } from "@supabase/supabase-js";
import { zeroAddress } from "viem";
import { chainIds, gnosis } from "./utils/config";
import { getAllMarketPools, Pool } from "./utils/fetchPools";
import { getMarketsIncentive } from "./utils/getMarketsIncentives";
import { getMarketsLiquidity } from "./utils/getMarketsLiquidity";
import { searchMarkets } from "./utils/markets";

const supabase = createClient(process.env.SUPABASE_PROJECT_URL!, process.env.SUPABASE_API_KEY!);

export default async () => {
  try {
    console.log("fetching markets...");

    // ignore markets finalized more than two days ago
    const twoDaysAgo = Math.round((Date.now() - 2 * 24 * 60 * 60 * 1000) / 1000);

    const { markets } = await searchMarkets({
      chainIds: chainIds.map((c) => c),
      finalizeTs: twoDaysAgo,
      orderBy: "oddsRunTimestamp",
      orderDirection: "asc",
      limit: 500, // 150 markets every 5 minutes = 1800 markets / hour
    });

    const parentMarketsIds = Array.from(
      new Set(
        markets
          .filter((market) => market.parentMarket.id !== zeroAddress)
          .map((m) => m.parentMarket.id),
      ),
    );

    if (parentMarketsIds.length > 0) {
      // We need to include the parent markets in order to calculate the prices of child markets relative to the main collateral.
      const { markets: parentMarkets } = await searchMarkets({
        chainIds: chainIds.map((c) => c),
        marketIds: parentMarketsIds,
      });
      markets.push(...parentMarkets);
    }

    {
      // Remove duplicate markets that may have been introduced after adding parent markets
      const seen = new Set<string>();
      let w = 0;
      for (const m of markets) {
        const k = `${m.chainId}-${m.id}`;
        if (seen.has(k)) continue;
        seen.add(k);
        markets[w++] = m;
      }
      markets.length = w;
    }

    console.log("fetching pools...");
    const pools = await getAllMarketPools(markets);
    if (!pools.length) throw "No pool found";

    // update liquidity for each market
    console.log("fetching liquidity...");
    const liquidityToMarketMapping = await getMarketsLiquidity(markets, pools);
    const { error: errorLiquidity } = await supabase.from("markets").upsert(
      markets.map((market) => ({
        id: market.id,
        chain_id: market.chainId,
        liquidity: liquidityToMarketMapping[market.id]?.totalLiquidity ?? 0,
        pool_balance: liquidityToMarketMapping[market.id]?.poolBalance || [],
        updated_at: new Date(),
      })),
    );
    if (errorLiquidity) {
      console.error(errorLiquidity.message);
    }

    // update odds for each market
    console.log("fetching odds...");
    const getLiquidity = (pool: Pool) => Number(pool.liquidity);
    function getPoolKey(token0: string, token1: string) {
      const [a, b] = [token0.toLowerCase(), token1.toLowerCase()].sort();
      return `${a}-${b}`;
    }
    function buildPoolMap(pools: Pool[]): Map<string, Pool> {
      const poolMap = new Map<string, Pool>();

      for (const pool of pools) {
        const key = getPoolKey(pool.token0.id, pool.token1.id);

        const existing = poolMap.get(key);

        if (!existing || getLiquidity(pool) > getLiquidity(existing)) {
          poolMap.set(key, pool);
        }
      }

      return poolMap;
    }
    const poolMap = buildPoolMap(pools);
    const results = markets.map((market) => {
      const hasLiquidity = (liquidityToMarketMapping[market.id].totalLiquidity || 0) > 0;
      if (!hasLiquidity || market.type === "Futarchy") {
        return Array(market.wrappedTokens.length).fill(Number.NaN);
      }
      const prices = market.wrappedTokens.map((wrappedAddress) => {
        const { token0, token1 } = getToken0Token1(wrappedAddress, market.collateralToken);
        const pool = poolMap.get(getPoolKey(token0, token1));
        if (!pool) {
          return Number.NaN;
        }
        if (pool.tick === null || pool.tick === undefined) {
          return Number.NaN;
        }
        const [price0, price1] = tickToPrice(Number(pool.tick));
        return wrappedAddress.toLowerCase() === token0.toLowerCase()
          ? Number(price0)
          : Number(price1);
      });

      return normalizeOdds(prices);
    });
    const { error: errorOdds } = await supabase.from("markets").upsert(
      markets.map((market, index) => ({
        id: market.id,
        chain_id: market.chainId,
        odds: results[index].map((x) => (Number.isNaN(x) ? null : x)),
        odds_run_timestamp: Math.round(new Date().getTime() / 1000),
        updated_at: new Date(),
      })),
    );

    if (errorOdds) {
      console.error(errorOdds.message);
    }

    //update incentive for each market (currently only gnosis markets have)
    //TODO: mainnet markets incentives
    console.log("fetching incentives...");
    const gnosisPools = pools.filter((x) => x.chainId === gnosis.id);
    const marketToIncentiveMapping = await getMarketsIncentive(gnosisPools);
    const { error: errorIncentives } = await supabase.from("markets").upsert(
      markets.map((market) => ({
        id: market.id,
        chain_id: market.chainId,
        incentive: marketToIncentiveMapping[market.id] ?? 0,
        updated_at: new Date(),
      })),
    );
    if (errorIncentives) {
      console.error(errorIncentives.message);
    }
    console.log("Batch odds background completed");
  } catch (e) {
    console.log(e);
  }
  return;
};
