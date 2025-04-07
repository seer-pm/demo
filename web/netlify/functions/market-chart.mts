import { SupportedChain } from "@/lib/chains";
import { createClient } from "@supabase/supabase-js";
import { Address } from "viem";
import { searchMarkets } from "./markets-search.mts";
import { getChartData } from "./utils/getChartData";

const supabase = createClient(process.env.VITE_SUPABASE_PROJECT_URL!, process.env.VITE_SUPABASE_API_KEY!);

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
  const dayCount = Number.parseInt(params.get("dayCount") || "0", 10);
  const intervalSeconds = Number.parseInt(params.get("intervalSeconds") || "0", 10);
  const endDateParam = Number(params.get("endDate")) * 1000;

  const endDate = endDateParam ? new Date(endDateParam) : undefined;

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

    // check if we have data on cache
    const hashKey = `markets_search_${marketId}_${chainId}`;

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
      const chartData = await getChartData(market, dayCount, intervalSeconds, endDate);
      const cacheData = { chartData, timestamp: Date.now() };

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

      return new Response(JSON.stringify(chartData), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    // return cached data
    return new Response(JSON.stringify(cachedData?.value.chartData), {
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
