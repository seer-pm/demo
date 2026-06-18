import { createClient } from "@supabase/supabase-js";
import { CORS_HEADERS } from "./utils/common";

const supabase = createClient(process.env.SUPABASE_PROJECT_URL!, process.env.SUPABASE_API_KEY!);

export default async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });
  }

  try {
    const url = new URL(req.url);
    const chainId = url.searchParams.get("chainId");
    const marketId = url.searchParams.get("marketId");

    if (!chainId || !marketId) {
      return new Response(JSON.stringify({ error: "Missing chainId or marketId" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      });
    }

    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("market_events")
      .select("id, market_id, chain_id, title, description, event_at")
      .eq("chain_id", Number(chainId))
      .eq("market_id", marketId.toLowerCase())
      .gte("event_at", now)
      .order("event_at", { ascending: true });

    if (error) {
      throw error;
    }

    return new Response(JSON.stringify({ data: data ?? [] }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });
  } catch (error) {
    console.error("get-market-events error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });
  }
};
