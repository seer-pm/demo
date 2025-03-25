import { getStore } from "https://esm.sh/@netlify/blobs";
import type { Config } from "@netlify/edge-functions";

export default async (req: Request) => {
  try {
    const store = getStore("markets");
    const markets = await store.get("all-markets", { type: "json" });
    if (!markets?.length) {
      throw "No markets found";
    }
    return new Response(JSON.stringify(markets), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (e) {
    console.log(e);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
};

export const config: Config = { path: "/all-markets-search" };
