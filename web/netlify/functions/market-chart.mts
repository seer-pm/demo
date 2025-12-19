import { SupportedChain } from "@/lib/chains";
import { createClient } from "@supabase/supabase-js";
import { Address } from "viem";
import { fetchCachedChartData } from "./market-chart-background.mts";

export function getMarketChartKeyValueHash(marketId: Address | "%", chainId: SupportedChain | "%") {
  return `market_chart_hour_data_${marketId}_${chainId}`;
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
    // Fetch chart data (always returns cached data, generates on first request if not cached)
    const chartData = await fetchCachedChartData(marketId, chainId, false);

    console.log(`Fetching chart data for market ${marketId} on chain ${chainId}`);

    // Trigger background function to update chart data if it's older than 5 minutes
    // This ensures fresh data for future requests while maintaining fast response times
    await fetch(`https://app.seer.pm/.netlify/functions/market-chart-background?${params.toString()}`);

    return new Response(JSON.stringify(chartData), {
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
