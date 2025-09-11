import { SupportedChain } from "@/lib/chains";
import { Market } from "@/lib/market";
import { createClient } from "@supabase/supabase-js";
import { Address } from "viem";
import { getMarketChartKeyValueHash } from "./market-chart.mts";
import { getChartData } from "./utils/getChartData";
import { searchMarkets } from "./utils/markets";

const supabase = createClient(process.env.SUPABASE_PROJECT_URL!, process.env.SUPABASE_API_KEY!);

/**
 * Fetches cached chart data for a market with flexible timestamp control.
 * This function handles both immediate cache retrieval and background updates.
 *
 * @param marketId - The market ID to fetch chart data for
 * @param chainId - The chain ID where the market exists
 * @param checkTimestamp - If true, only updates cache when data is older than 5 minutes.
 *                        If false, always returns cached data and generates on cache miss.
 * @returns The chart data (either from cache or newly generated)
 */
export async function fetchCachedChartData(marketId: Address, chainId: SupportedChain, checkTimestamp = true) {
  // Fetch market information
  const market = (await searchMarkets({ chainIds: [chainId], id: marketId }))?.markets?.[0];

  if (!market) {
    throw new Error("Market not found");
  }

  const hashKey = getMarketChartKeyValueHash(market.id, market.chainId);

  // Check current cached data and its timestamp
  const { data: cachedData, error: cacheError } = await supabase
    .from("key_value")
    .select("value")
    .eq("key", hashKey)
    .single();

  // Determine if we should update the cache
  const shouldUpdate = checkTimestamp
    ? cacheError?.code === "PGRST116" || (cachedData?.value && Date.now() - cachedData.value.timestamp > 5 * 60 * 1000)
    : cacheError?.code === "PGRST116";

  if (shouldUpdate) {
    // Cache miss or (if checkTimestamp) stale data: generate fresh chart data
    const chartData = await getChartData(market);
    const cacheData = { chartData, timestamp: Date.now(), marketId: market.id };

    // Store the updated data in cache for future requests
    const { error: upsertError } = await supabase.from("key_value").upsert(
      {
        key: hashKey,
        value: cacheData,
      },
      { onConflict: "key" },
    );

    if (upsertError) {
      console.error("Cache upsert failed:", upsertError);
    }

    return chartData;
  }

  // Return cached data (either fresh or when checkTimestamp is false)
  return cachedData?.value.chartData;
}

/**
 * Background function handler for updating market chart data.
 * This function is called asynchronously from the main market-chart endpoint
 * to refresh stale chart data without impacting response times.
 *
 * The function validates the request, finds the market, and triggers
 * a background update if the cached data is older than 5 minutes.
 */
export default async (req: Request) => {
  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: {
        "Content-Type": "application/json",
        Allow: "GET",
      },
    });
  }

  const url = new URL(req.url);
  const params = url.searchParams;

  // Extract required parameters from the request
  const marketId = params.get("marketId") as Address;
  const chainId = Number(params.get("chainId")) as SupportedChain;

  if (!marketId || !chainId) {
    return new Response(JSON.stringify({ error: "Missing required parameters" }), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  try {
    // Trigger background update of chart data (only if stale or missing)
    await fetchCachedChartData(marketId, chainId, true);
  } catch (error) {
    console.error("Background chart update failed:", error);
    return new Response(JSON.stringify({ error: "Market not found" }), {
      status: 404,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
};
