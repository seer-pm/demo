import { SupportedChain } from "@/lib/chains.ts";
import { formatDate } from "@/lib/utils.ts";
import { Config } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";
import slug from "slug";
import { Address } from "viem";
import { chainIds } from "./utils/config.ts";
import { getSubgraphUrl } from "./utils/subgraph.ts";

const supabase = createClient(process.env.VITE_SUPABASE_PROJECT_URL!, process.env.VITE_SUPABASE_API_KEY!);

async function processChain(chainId: SupportedChain, marketsWithoutUrl: Address[]) {
  const response = await fetch(getSubgraphUrl("seer", chainId), {
    method: "POST",
    body: JSON.stringify({
      query: `{
        markets(where: {id_in: ${JSON.stringify(marketsWithoutUrl)}}) {
          id
          marketName
          outcomes
          questions {
            question {
              opening_ts
            }
          }
        }
      }`,
    }),
  });
  const {
    data: { markets },
  } = await response.json();

  if (markets.length === 0) {
    return;
  }

  for (const market of markets) {
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
            metadata: {
              title: `Seer | ${market.marketName}`,
              description: `Answer opening date: ${`${formatDate(
                market.questions[0].question.opening_ts,
              )} UTC`}. Outcomes: ${market.outcomes.slice(0, -1).join(", ")}.`,
            },
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
  const { data: marketsWithoutUrl, error } = await supabase.from("markets").select("id").is("url", null);

  if (error) {
    console.error("Error fetching markets without URL:", error);
    throw error;
  }

  if (!marketsWithoutUrl?.length) {
    console.log("No markets found without URL");
    return;
  }

  for (const chainId of chainIds) {
    await processChain(
      chainId,
      marketsWithoutUrl.map((m) => m.id),
    );
  }
};

export const config: Config = {
  schedule: "*/5 * * * *",
};
