import { createClient } from "@supabase/supabase-js";
import { isAddress } from "viem";
import { getMarketChartKeyValueHash } from "./market-chart.mts";

const supabase = createClient(process.env.SUPABASE_PROJECT_URL!, process.env.SUPABASE_API_KEY!);

const MAX_LIMIT = 24;

export default async (req: Request) => {
  try {
    // Parse query params
    const url = new URL(req.url);
    const idsParam = url.searchParams.get("ids");
    const limitParam = url.searchParams.get("limit");
    const pageParam = url.searchParams.get("page");

    const limit = Math.min(Math.max(1, Number.parseInt(limitParam ?? String(MAX_LIMIT), 10) || MAX_LIMIT), MAX_LIMIT);
    const page = Math.max(1, Number.parseInt(pageParam ?? "1", 10) || 1);

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

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

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
