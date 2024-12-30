import type { HandlerContext, HandlerEvent } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";
import pLimit from "p-limit";
import { chainIds } from "./utils/config";
import { fetchMarkets } from "./utils/fetchMarkets";
import { getMarketOdds } from "./utils/getMarketOdds";
import { getMarketsIncentive } from "./utils/getMarketsIncentives";
import { getMarketsLiquidity } from "./utils/getMarketsLiquidity";
require("dotenv").config();

export const handler = async (_event: HandlerEvent, _context: HandlerContext) => {
  if (!process.env.VITE_SUPABASE_PROJECT_URL || !process.env.VITE_SUPABASE_API_KEY) {
    return;
  }
  try {
    //save to db
    const supabase = createClient(process.env.VITE_SUPABASE_PROJECT_URL, process.env.VITE_SUPABASE_API_KEY);
    const markets = (
      await Promise.all(
        chainIds.map((chainId) =>
          fetchMarkets(chainId.toString()).then((markets) => markets.map((market) => ({ ...market, chainId }))),
        ),
      )
    ).flat();

    // update odds for each market
    const limit = pLimit(20);
    const results = await Promise.all(markets.map((market) => limit(() => getMarketOdds(market))));
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

    // update liquidity for each market
    const liquidityToMarketMapping = await getMarketsLiquidity(markets);
    const { error: errorLiquidity } = await supabase.from("markets").upsert(
      markets.map((market) => ({
        id: market.id,
        liquidity: liquidityToMarketMapping[market.id],
        updated_at: new Date(),
      })),
    );
    if (errorLiquidity) {
      throw errorLiquidity;
    }

    //update incentive for each market (currently only gnosis markets have)
    //TODO: mainnet markets incentives
    const marketToIncentiveMapping = await getMarketsIncentive(markets);
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
  } catch (e) {
    console.log(e);
  }
  return {};
};
