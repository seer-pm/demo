import type { HandlerContext, HandlerEvent } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";
import { verifyToken } from "./utils/auth";

require("dotenv").config();

export const handler = async (event: HandlerEvent, _context: HandlerContext) => {
  try {
    const userId = verifyToken(event.headers.authorization);
    if (!userId) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: "Unauthorized" }),
      };
    }

    const supabase = createClient(process.env.VITE_SUPABASE_PROJECT_URL!, process.env.VITE_SUPABASE_API_KEY!);

    // Handle GET request
    if (event.httpMethod === "GET") {
      const { data: favorites } = await supabase
        .from("collections_markets")
        .select("market_id")
        .eq("user_id", userId)
        .is("collection_id", null);

      return {
        statusCode: 200,
        body: JSON.stringify(favorites ? favorites.map((f) => f.market_id) : []),
      };
    }

    // Handle POST request
    if (event.httpMethod === "POST") {
      const { marketIds, collectionId = null } = JSON.parse(event.body || "{}");
      if (!Array.isArray(marketIds)) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: "marketIds must be an array" }),
        };
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
            return {
              statusCode: 500,
              body: JSON.stringify({ error: "Failed to add favorite market" }),
            };
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
          return {
            statusCode: 500,
            body: JSON.stringify({
              error: "Failed to add favorite markets",
            }),
          };
        }
      }

      return {
        statusCode: 200,
        body: JSON.stringify({ success: true }),
      };
    }

    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};
