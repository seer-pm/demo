import { createClient } from "@supabase/supabase-js";
import { isAddress } from "viem";
import { getMarketChartKeyValueHash } from "./market-chart.mts";

const supabase = createClient(process.env.SUPABASE_PROJECT_URL!, process.env.SUPABASE_API_KEY!);

export default async (req: Request) => {
  try {
    // Parse the ids parameter from query string
    const url = new URL(req.url);
    const idsParam = url.searchParams.get("ids");

    let marketIds: string[] = [];
    if (idsParam) {
      marketIds = idsParam
        .split(",")
        .map((id) => id.trim())
        .filter((id) => id.length > 0);
    }

    let query = supabase.from("key_value").select("*");

    if (marketIds.length > 0) {
      // If specific IDs are provided, filter by those market IDs
      // Validate market IDs format using viem's isAddress to mitigate SQL injection
      const validMarketIds = marketIds.filter((id) => isAddress(id, { strict: false }));

      if (validMarketIds.length === 0) {
        return new Response(JSON.stringify({ error: "No valid market IDs provided" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Build secure query using validated patterns
      const conditions = validMarketIds.map((marketId) => {
        const pattern = getMarketChartKeyValueHash(marketId as `0x${string}`, "%");
        return `key.like.${pattern}`;
      });
      query = query.or(conditions.join(","));
    } else {
      // If no IDs provided, get all market charts
      query = query.like("key", getMarketChartKeyValueHash("%", "%"));
    }

    const { data, error } = await query;

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const chartsByMarketId = data.reduce((acc, row) => {
      acc[row.value.marketId] = row.value.chartData;
      return acc;
    }, {});

    return new Response(JSON.stringify(chartsByMarketId), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
