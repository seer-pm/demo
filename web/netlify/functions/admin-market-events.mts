import { createClient } from "@supabase/supabase-js";
import { verifyAdminToken } from "./utils/auth";
import { CORS_HEADERS } from "./utils/common";

const supabase = createClient(process.env.SUPABASE_PROJECT_URL!, process.env.SUPABASE_API_KEY!);

const jsonHeaders = { "Content-Type": "application/json", ...CORS_HEADERS };

type MarketJoinRow = {
  url: string | null;
  subgraph_data: { marketName?: string } | null;
};

type MarketEventRow = {
  id: string;
  market_id: string;
  chain_id: number;
  title: string;
  description: string | null;
  event_at: string;
  created_at: string | null;
  updated_at: string | null;
  created_by: string | null;
  markets: MarketJoinRow | MarketJoinRow[] | null;
};

function serializeAdminMarketEvent(row: MarketEventRow) {
  const market = Array.isArray(row.markets) ? row.markets[0] : row.markets;

  return {
    id: row.id,
    market_id: row.market_id,
    chain_id: row.chain_id,
    title: row.title,
    description: row.description,
    event_at: row.event_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
    created_by: row.created_by,
    market_name: market?.subgraph_data?.marketName ?? row.market_id,
    market_url: market?.url ?? null,
  };
}

async function marketExists(marketId: string, chainId: number) {
  const { data } = await supabase
    .from("markets")
    .select("id")
    .eq("id", marketId.toLowerCase())
    .eq("chain_id", chainId)
    .maybeSingle();
  return !!data;
}

export default async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  const adminId = verifyAdminToken(req.headers.get("Authorization"));
  if (!adminId) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: jsonHeaders,
    });
  }

  try {
    if (req.method === "GET") {
      const url = new URL(req.url);
      const chainId = url.searchParams.get("chainId");
      const marketId = url.searchParams.get("marketId");

      let query = supabase
        .from("market_events")
        .select(
          "id, market_id, chain_id, title, description, event_at, created_at, updated_at, created_by, markets!market_events_market_id_chain_id_fkey(url, subgraph_data)",
        )
        .order("event_at", { ascending: true });

      if (chainId) {
        query = query.eq("chain_id", Number(chainId));
      }
      if (marketId) {
        query = query.eq("market_id", marketId.toLowerCase());
      }

      const { data, error } = await query;
      if (error) {
        throw error;
      }

      return new Response(JSON.stringify({ data: (data ?? []).map(serializeAdminMarketEvent) }), {
        status: 200,
        headers: jsonHeaders,
      });
    }

    if (req.method === "POST") {
      const { marketId, chainId, title, description, eventAt } = await req.json();

      if (!marketId || !chainId || !title || !eventAt) {
        return new Response(JSON.stringify({ error: "Missing required fields: marketId, chainId, title, eventAt" }), {
          status: 400,
          headers: jsonHeaders,
        });
      }

      const normalizedMarketId = marketId.toLowerCase();
      const normalizedChainId = Number(chainId);

      if (!(await marketExists(normalizedMarketId, normalizedChainId))) {
        return new Response(JSON.stringify({ error: "Market not found" }), { status: 404, headers: jsonHeaders });
      }

      const { data, error } = await supabase
        .from("market_events")
        .insert({
          market_id: normalizedMarketId,
          chain_id: normalizedChainId,
          title,
          description: description ?? null,
          event_at: eventAt,
          created_by: adminId,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return new Response(JSON.stringify({ data }), { status: 201, headers: jsonHeaders });
    }

    if (req.method === "PATCH") {
      const { id, marketId, chainId, title, description, eventAt } = await req.json();

      if (!id) {
        return new Response(JSON.stringify({ error: "Missing id" }), { status: 400, headers: jsonHeaders });
      }

      const updates: Record<string, string | number | null> = { updated_at: new Date().toISOString() };

      if (title !== undefined) updates.title = title;
      if (description !== undefined) updates.description = description;
      if (eventAt !== undefined) updates.event_at = eventAt;

      if (marketId !== undefined && chainId !== undefined) {
        const normalizedMarketId = marketId.toLowerCase();
        const normalizedChainId = Number(chainId);
        if (!(await marketExists(normalizedMarketId, normalizedChainId))) {
          return new Response(JSON.stringify({ error: "Market not found" }), { status: 404, headers: jsonHeaders });
        }
        updates.market_id = normalizedMarketId;
        updates.chain_id = normalizedChainId;
      }

      const { data, error } = await supabase.from("market_events").update(updates).eq("id", id).select().single();

      if (error) {
        throw error;
      }

      if (!data) {
        return new Response(JSON.stringify({ error: "Event not found" }), { status: 404, headers: jsonHeaders });
      }

      return new Response(JSON.stringify({ data }), { status: 200, headers: jsonHeaders });
    }

    if (req.method === "DELETE") {
      const { id } = await req.json();
      if (!id) {
        return new Response(JSON.stringify({ error: "Missing id" }), { status: 400, headers: jsonHeaders });
      }

      const { error } = await supabase.from("market_events").delete().eq("id", id);

      if (error) {
        throw error;
      }

      return new Response(JSON.stringify({ success: true }), { status: 200, headers: jsonHeaders });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: jsonHeaders });
  } catch (error) {
    console.error("admin-market-events error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Internal server error" }), {
      status: 500,
      headers: jsonHeaders,
    });
  }
};
