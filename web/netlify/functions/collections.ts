import { createClient } from "@supabase/supabase-js";
import { verifyToken } from "./utils/auth";

const supabase = createClient(process.env.SUPABASE_PROJECT_URL!, process.env.SUPABASE_API_KEY!);

function parseCollectionId(url: string) {
  const idOrSlug = url.split("/")[url.split("/").indexOf("collections") + 1] || "";
  return idOrSlug.split("-").slice(-1)[0] || idOrSlug || null;
}

export default async (req: Request) => {
  try {
    const userId = verifyToken(req.headers.get("Authorization") || "");
    const collectionId = parseCollectionId(req.url);
    // Handle GET request
    if (req.method === "GET") {
      if (!collectionId && !userId) {
        return new Response(JSON.stringify([]), { status: 200 });
      }
      let query = supabase
        .from("collections_markets")
        .select("market_id")
        [collectionId === null ? "is" : "eq"]("collection_id", collectionId);
      if (userId) {
        query = query.eq("user_id", userId);
      }
      const { data: favorites } = await query;
      return new Response(JSON.stringify(favorites ? favorites.map((f) => f.market_id) : []), { status: 200 });
    }
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }
    // Handle POST request
    if (req.method === "POST") {
      const { marketIds, collectionId = null } = await req.json();
      if (!Array.isArray(marketIds)) {
        return new Response(JSON.stringify({ error: "marketIds must be an array" }), { status: 400 });
      }

      if (marketIds.length === 1) {
        // Check if the market is already favorited
        const { data: existing } = await supabase
          .from("collections_markets")
          .select("market_id")
          .eq("user_id", userId)
          .eq("market_id", marketIds[0].toLowerCase())
          [collectionId === null ? "is" : "eq"]("collection_id", collectionId);

        if (existing && existing.length > 0) {
          // Remove the market if it exists
          await supabase
            .from("collections_markets")
            .delete()
            .eq("user_id", userId)
            .eq("market_id", marketIds[0].toLowerCase())
            [collectionId === null ? "is" : "eq"]("collection_id", collectionId);
        } else {
          // Add the market if it doesn't exist
          const { error: insertError } = await supabase.from("collections_markets").insert({
            user_id: userId,
            market_id: marketIds[0].toLowerCase(),
            collection_id: collectionId,
          });

          if (insertError) {
            console.error("Insert error:", insertError);
            return new Response(JSON.stringify({ error: "Failed to add favorite market" }), { status: 500 });
          }
        }
      } else if (marketIds.length > 1) {
        // Add all favorite markets
        const newFavorites = marketIds.map((marketId) => ({
          user_id: userId,
          market_id: marketId.toLowerCase(),
          collection_id: collectionId,
        }));

        const { error: bulkInsertError } = await supabase.from("collections_markets").insert(newFavorites);

        if (bulkInsertError) {
          console.error("Bulk insert error:", bulkInsertError);
          return new Response(
            JSON.stringify({
              error: "Failed to add favorite markets",
            }),
            { status: 500 },
          );
        }
      }

      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
  }
};
