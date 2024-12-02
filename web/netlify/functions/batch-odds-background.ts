import type { HandlerContext, HandlerEvent } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";
import pLimit from "p-limit";
import { chainIds } from "./utils/config";
import { fetchMarkets } from "./utils/fetchMarkets";
import { getMarketOdds } from "./utils/getMarketOdds";
require("dotenv").config();

export const handler = async (_event: HandlerEvent, _context: HandlerContext) => {
  const limit = pLimit(20);
  try {
    const markets = (
      await Promise.all(
        chainIds.map((chainId) =>
          fetchMarkets(chainId.toString()).then((markets) => markets.map((market) => ({ ...market, chainId }))),
        ),
      )
    ).flat();
    const results = await Promise.all(markets.map((market) => limit(() => getMarketOdds(market))));

    //save to db
    if (!process.env.VITE_SUPABASE_PROJECT_URL || !process.env.VITE_SUPABASE_API_KEY) {
      return;
    }
    const supabase = createClient(process.env.VITE_SUPABASE_PROJECT_URL, process.env.VITE_SUPABASE_API_KEY);

    const { error } = await supabase.from("markets").upsert(
      markets.map((market, index) => ({
        id: market.id,
        odds: results[index].map((x) => (Number.isNaN(x) ? null : x)),
      })),
    );

    if (error) {
      throw error;
    }
  } catch (e) {
    console.log(e);
  }
  return {};
};
