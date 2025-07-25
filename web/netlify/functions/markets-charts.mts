import { createClient } from "@supabase/supabase-js";
import { getMarketChartKeyValueHash } from "./market-chart.mts";

const supabase = createClient(process.env.SUPABASE_PROJECT_URL!, process.env.SUPABASE_API_KEY!);

export default async (req: Request) => {
  try {
    const { data, error } = await supabase
      .from("key_value")
      .select("*")
      .like("key", getMarketChartKeyValueHash("%", "%"));

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
