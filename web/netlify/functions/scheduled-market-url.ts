import { SupportedChain } from "@/lib/chains.ts";
import { Config } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";
import slug from "slug";
import { Address } from "viem";
import { chainIds } from "./utils/config.ts";

const supabase = createClient(process.env.SUPABASE_PROJECT_URL!, process.env.SUPABASE_API_KEY!);

type MarketData = { id: Address; marketName: string };

async function processChain(chainId: SupportedChain, marketsWithoutUrl: MarketData[]) {
  for (const market of marketsWithoutUrl) {
    const url = slug(market.marketName).slice(0, 80);

    // Loop 6 times: first 5 with consecutive numbers, last one with timestamp
    for (let i = 1; i <= 6; i++) {
      let currentUrl = url;

      if (i <= 5) {
        // First 5 attempts: use consecutive numbers
        if (i > 1) {
          currentUrl += `-${i}`;
        }
      } else {
        // 6th attempt: use timestamp
        const timestamp = Date.now();
        currentUrl = `${url}-${timestamp}`;
      }

      try {
        const { error } = await supabase
          .from("markets")
          .update({
            url: currentUrl,
          })
          .eq("id", market.id)
          .eq("chain_id", chainId)
          .is("url", null);

        if (!error) {
          const attemptType = i <= 5 ? `consecutive number ${i}` : "timestamp";
          console.log(`Updated URL for market ${market.id} to ${currentUrl} (${attemptType})`);
          break;
        }

        // console.log(`URL ${currentUrl} already exists, trying next...`);
      } catch (error) {
        console.error(`Error updating URL for market ${market.id}:`, error);
      }
    }
  }
}

export default async () => {
  const { data: marketsWithoutUrl, error } = await supabase
    .from("markets")
    .select("id,subgraph_data->marketName")
    .is("url", null)
    .not("subgraph_data", "is", null)
    .neq("subgraph_data->>marketName", "")
    .limit(100);

  if (error) {
    console.error("Error fetching markets without URL:", error);
    throw error;
  }

  if (!marketsWithoutUrl?.length) {
    console.log("No markets found without URL");
    return;
  }

  for (const chainId of chainIds) {
    await processChain(chainId, marketsWithoutUrl as MarketData[]);
  }
};

export const config: Config = {
  schedule: "*/15 * * * *",
};
