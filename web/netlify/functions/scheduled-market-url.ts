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
    // loop up to 5 times in case of duplicated market names
    for (let i = 1; i <= 5; i++) {
      let url = slug(market.marketName).slice(0, 80);

      if (i > 1) {
        url += `-${i}`;
      }

      try {
        const { error } = await supabase
          .from("markets")
          .update({
            url,
            chain_id: chainId,
          })
          .eq("id", market.id)
          .is("url", null);

        if (error) {
          if (i === 5) {
            console.error(`Error updating URL for market ${market.id}:`, error);
          } else {
            console.log("URL already exists, trying again...");
          }
          continue;
        }

        console.log(`Updated URL for market ${market.id} to ${url}`);

        // url succesfully updated, break the loop
        break;
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
    .not("subgraph_data", "is", null);

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
