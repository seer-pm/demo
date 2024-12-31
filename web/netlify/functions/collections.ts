import type { HandlerContext, HandlerEvent } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";

require("dotenv").config();

export const handler = async (event: HandlerEvent, _context: HandlerContext) => {
  try {
    const { authorization } = event.headers;
    if (!authorization) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: "No authorization header" }),
      };
    }

    type DecodedToken = {
      sub: string;
      iat: number;
      iss: string;
    };
    let decoded: DecodedToken;
    try {
      const token = authorization.split(" ")[1];
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as DecodedToken;
    } catch (jwtError) {
      if (jwtError instanceof jwt.TokenExpiredError) {
        return {
          statusCode: 401,
          body: JSON.stringify({ error: "Token expired" }),
        };
      }
      return {
        statusCode: 403,
        body: JSON.stringify({ error: "Invalid token" }),
      };
    }

    const supabase = createClient(process.env.VITE_SUPABASE_PROJECT_URL!, process.env.VITE_SUPABASE_API_KEY!);

    // Handle GET request
    if (event.httpMethod === "GET") {
      const { data: favorites } = await supabase
        .from("collections_markets")
        .select("market_id")
        .eq("user_id", decoded.sub.toLocaleLowerCase())
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
          .eq("user_id", decoded.sub.toLocaleLowerCase())
          .eq("market_id", marketIds[0].toLocaleLowerCase())
          [collectionId === null ? "is" : "eq"]("collection_id", collectionId);

        if (existing && existing.length > 0) {
          // Remove the market if it exists
          await supabase
            .from("collections_markets")
            .delete()
            .eq("user_id", decoded.sub.toLocaleLowerCase())
            .eq("market_id", marketIds[0].toLocaleLowerCase())
            [collectionId === null ? "is" : "eq"]("collection_id", collectionId);
        } else {
          // Add the market if it doesn't exist
          const { error: insertError } = await supabase.from("collections_markets").insert({
            user_id: decoded.sub.toLocaleLowerCase(),
            market_id: marketIds[0].toLocaleLowerCase(),
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
      } else {
        // Replace all favorite markets
        await supabase
          .from("collections_markets")
          .delete()
          .eq("user_id", decoded.sub.toLocaleLowerCase())
          [collectionId === null ? "is" : "eq"]("collection_id", collectionId);

        if (marketIds.length > 0) {
          const newFavorites = marketIds.map((marketId) => ({
            user_id: decoded.sub.toLocaleLowerCase(),
            market_id: marketId.toLocaleLowerCase(),
            collection_id: collectionId,
          }));

          const { error: bulkInsertError } = await supabase.from("collections_markets").insert(newFavorites);

          if (bulkInsertError) {
            console.error("Bulk insert error:", bulkInsertError);
            return {
              statusCode: 500,
              body: JSON.stringify({
                error: "Failed to update favorite markets",
              }),
            };
          }
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
