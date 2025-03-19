import { getMarketOdds } from "@/hooks/useMarketOdds";
import { createClient } from "@supabase/supabase-js";
import pLimit from "p-limit";
import { searchMarkets } from "./markets-search.mts";
import { chainIds } from "./utils/config";
import { getAllMarketPools } from "./utils/fetchPools";
import { getMarketsIncentive } from "./utils/getMarketsIncentives";
import { getMarketsLiquidity } from "./utils/getMarketsLiquidity";

const supabase = createClient(process.env.VITE_SUPABASE_PROJECT_URL!, process.env.VITE_SUPABASE_API_KEY!);

export default async () => {
  try {
    console.log("fetching markets...");

    // ignore markets finalized more than two days ago
    const twoDaysAgo = Math.round((Date.now() - 2 * 24 * 60 * 60 * 1000) / 1000);

    const markets = (await searchMarkets(chainIds.map((c) => c))).filter((market) => {
      return market.finalizeTs > twoDaysAgo;
    });

    console.log("markets length", markets.length);

    const pools = await getAllMarketPools(markets);
    if (!pools.length) throw "No pool found";

    // update liquidity for each market
    console.log("fetching liquidity...");
    const liquidityToMarketMapping = await getMarketsLiquidity(markets, pools);
    const { error: errorLiquidity } = await supabase.from("markets").upsert(
      markets.map((market) => ({
        id: market.id,
        liquidity: liquidityToMarketMapping[market.id]?.totalLiquidity ?? 0,
        pool_balance: liquidityToMarketMapping[market.id]?.poolBalance || [],
        updated_at: new Date(),
      })),
    );
    if (errorLiquidity) {
      throw errorLiquidity;
    }

    // update odds for each market
    console.log("fetching odds...");
    const limit = pLimit(10);
    const results = await Promise.all(
      markets.map((market) =>
        limit(() => {
          const hasLiquidity = (liquidityToMarketMapping[market.id].totalLiquidity || 0) > 0;
          return getMarketOdds(market, hasLiquidity);
        }),
      ),
    );
    const { error } = await supabase.from("markets").upsert(
      markets.map((market, index) => ({
        id: market.id,
        odds: results[index].map((x) => (Number.isNaN(x) ? null : x)),
        updated_at: new Date(),
      })),
    );

    if (error) {
      throw error;
    }

    //update incentive for each market (currently only gnosis markets have)
    //TODO: mainnet markets incentives
    console.log("fetching incentives...");
    const marketToIncentiveMapping = await getMarketsIncentive(pools);
    const { error: errorIncentive } = await supabase.from("markets").upsert(
      markets.map((market) => ({
        id: market.id,
        incentive: marketToIncentiveMapping[market.id] ?? 0,
        updated_at: new Date(),
      })),
    );
    if (errorIncentive) {
      throw errorIncentive;
    }
    console.log("Batch odds background ok");
  } catch (e) {
    console.log(e);
  }
  return;
};
