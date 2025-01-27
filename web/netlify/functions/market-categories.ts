import { createClient } from "@supabase/supabase-js";
import { isTwoStringsEqual } from "../../src/lib/utils";
import { verifyToken } from "./utils/auth";
import { fetchMarket } from "./utils/fetchMarkets";

export default async (req: Request) => {
  try {
    const userId = verifyToken(req.headers.get("Authorization") || "");
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const supabase = createClient(process.env.VITE_SUPABASE_PROJECT_URL!, process.env.VITE_SUPABASE_API_KEY!);

    // Handle POST request
    if (req.method === "POST") {
      const { marketId, categories, chainId } = await req.json();
      if (!marketId) {
        return new Response(JSON.stringify({ error: "Missing marketId" }), { status: 400 });
      }
      if (!categories?.length) {
        return new Response(JSON.stringify({ error: "Missing categories" }), { status: 400 });
      }
      if (!chainId) {
        return new Response(JSON.stringify({ error: "Missing chainId" }), { status: 400 });
      }
      const { data: existing } = await supabase.from("markets").select().eq("id", marketId);
      if (!existing?.[0]?.creator) {
        const market = await fetchMarket(marketId, chainId.toString());
        if (!isTwoStringsEqual(market.creator, userId)) {
          return new Response(JSON.stringify({ error: "User is not creator" }), { status: 500 });
        }
        const { error } = await supabase
          .from("markets")
          .upsert({ id: marketId, creator: userId.toLowerCase(), categories });
        if (error) {
          throw error;
        }
      } else {
        // check if user is creator
        const creator = existing[0].creator;
        if (!isTwoStringsEqual(creator, userId)) {
          return new Response(JSON.stringify({ error: "User is not creator" }), { status: 500 });
        }
        const { error } = await supabase.from("markets").update({ categories }).eq("id", marketId);
        if (error) {
          throw error;
        }
      }

      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message ?? "Internal server error" }), { status: 500 });
  }
};
