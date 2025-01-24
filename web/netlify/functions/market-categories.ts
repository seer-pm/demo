import type { HandlerContext, HandlerEvent } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";
import { verifyToken } from "./utils/auth";
import { isTwoStringsEqual } from "./utils/common";
import { fetchMarket } from "./utils/fetchMarkets";

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

    // Handle POST request
    if (event.httpMethod === "POST") {
      const { marketId, categories, chainId } = JSON.parse(event.body || "{}");
      if (!marketId) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: "Missing marketId" }),
        };
      }
      if (!categories?.length) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: "Missing categories" }),
        };
      }
      if (!chainId) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: "Missing chainId" }),
        };
      }
      const { data: existing } = await supabase.from("markets").select().eq("id", marketId);
      if (!existing?.[0]?.creator) {
        const market = await fetchMarket(marketId, chainId.toString());
        if (!isTwoStringsEqual(market.creator, userId)) {
          return {
            statusCode: 500,
            body: JSON.stringify({ error: "User is not creator" }),
          };
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
          return {
            statusCode: 500,
            body: JSON.stringify({ error: "User is not creator" }),
          };
        }
        const { error } = await supabase.from("markets").update({ categories }).eq("id", marketId);
        if (error) {
          throw error;
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
      body: JSON.stringify({ error: error.message ?? "Internal server error" }),
    };
  }
};
