import { normalizeOdds } from "@seer-pm/sdk/market-odds";
import { createClient } from "@supabase/supabase-js";
import { formatUnits, zeroAddress } from "viem";
import { chainIds, gnosis } from "./utils/config";
import { getAllMarketPools } from "./utils/fetchPools";
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
      limit: 150, // 150 markets every 5 minutes = 1800 markets / hour
    });
    const parentMarketsIds = Array.from(
      new Set(markets.filter((market) => market.parentMarket.id !== zeroAddress).map((m) => m.parentMarket.id)),
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
    // getAllMarketPools drops a chain whose fetch failed, and the markets of that chain then read as
    // having no pools. Volume is a lifetime figure, so a run that saw no pools keeps the stored value
    // instead of writing a zero.
    const marketsWithPools = new Set(pools.map((pool) => `${pool.chainId}-${pool.market.id}`));
    const { error: errorLiquidity } = await supabase.from("markets").upsert(
      markets.map((market) => ({
        id: market.id,
        chain_id: market.chainId,
        liquidity: liquidityToMarketMapping[market.id]?.totalLiquidity ?? 0,
        max_liquidity: Math.max(liquidityToMarketMapping[market.id]?.totalLiquidity ?? 0, market.maxLiquidity ?? 0),
        pool_balance: liquidityToMarketMapping[market.id]?.poolBalance || [],
        updated_at: new Date(),
        open_interest_usd:
          Number(formatUnits(market.outcomesSupply, 18)) *
          (liquidityToMarketMapping[market.id]?.collateralPriceInUSD ?? 0),
        ...(marketsWithPools.has(`${market.chainId}-${market.id}`) && {
          volume_usd: liquidityToMarketMapping[market.id]?.volumeUSD ?? 0,
          volume_notional_usd: liquidityToMarketMapping[market.id]?.volumeNotionalUSD ?? 0,
        }),
      })),
    );
    if (errorLiquidity) {
      console.error(errorLiquidity.message);
    }
    // update odds for each market
    console.log("fetching odds...");
    const results = markets.map((market) => {
      const hasLiquidity = (liquidityToMarketMapping[market.id].totalLiquidity || 0) > 0;
      if (!hasLiquidity || market.type === "Futarchy") {
        return Array(market.wrappedTokens.length).fill(Number.NaN);
      }
      return normalizeOdds(liquidityToMarketMapping[market.id].outcomePrices);
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
