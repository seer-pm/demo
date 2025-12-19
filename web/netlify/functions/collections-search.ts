import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.SUPABASE_PROJECT_URL!, process.env.SUPABASE_API_KEY!);

export default async (req: Request) => {
  try {
    // Handle GET request
    if (req.method === "GET") {
      const url = new URL(req.url);
      const query = url.searchParams.get("query");
      const { data: collections_markets = [] } = await supabase
        .from("collections_markets")
        .select("market_id, collections!inner (name)")
        .not("collection_id", "is", null)
        .ilike("collections.name", `%${query}%`);
      return new Response(JSON.stringify({ data: collections_markets }), { status: 200 });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
  }
};
