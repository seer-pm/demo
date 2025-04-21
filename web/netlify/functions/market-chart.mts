import { Market } from "@/hooks/useMarket";
import { SupportedChain } from "@/lib/chains";
import { createClient } from "@supabase/supabase-js";
import { Address } from "viem";
import { searchMarkets } from "./markets-search.mts";
import { getChartData } from "./utils/getChartData";

const supabase = createClient(process.env.VITE_SUPABASE_PROJECT_URL!, process.env.VITE_SUPABASE_API_KEY!);

export function getMarketChartKeyValueHash(marketId: Address | "%", chainId: SupportedChain | "%") {
  return `market_chart_hour_data_${marketId}_${chainId}`;
}

async function fetchChartData(market: Market) {
  const hashKey = getMarketChartKeyValueHash(market.id, market.chainId);

  const { data: cachedData, error: cacheError } = await supabase
    .from("key_value")
    .select("value")
    .eq("key", hashKey)
    .single();

  if (
    cacheError?.code === "PGRST116" ||
    (cachedData?.value && Date.now() - cachedData.value.timestamp > 5 * 60 * 1000)
  ) {
    // data not found or older than 5 minutes
    const chartData = await getChartData(market);
    const cacheData = { chartData, timestamp: Date.now(), marketId: market.id };

    // store and return
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

  // return cached data
  return cachedData?.value.chartData;
}

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
    // Fetch market
    const market = (await searchMarkets([chainId], marketId))?.[0];

    if (!market) {
      return new Response(JSON.stringify({ error: "Market not found" }), {
        status: 404,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    return new Response(JSON.stringify(await fetchChartData(market)), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: "Failed to fetch chart data" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
};
