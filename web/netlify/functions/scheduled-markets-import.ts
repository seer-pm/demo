import { Market_OrderBy, OrderDirection, getSdk as getSeerSdk } from "@/hooks/queries/gql-generated-seer";
import { SupportedChain } from "@/lib/chains.ts";
import { getMarketStatus } from "@/lib/market.ts";
import { graphQLClient } from "@/lib/subgraph.ts";
import { Config } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";
import { chainIds } from "./utils/config.ts";
import { CurateItem, fetchAndStoreMetadata, getVerification, getVerificationStatusList } from "./utils/curate.ts";
import { mapGraphMarketFromDbResult } from "./utils/markets.ts";
import { Database } from "./utils/supabase.ts";

const supabase = createClient<Database>(process.env.SUPABASE_PROJECT_URL!, process.env.SUPABASE_API_KEY!);

async function updateImages() {
  // 1. First search markets where images is null and verification->itemID is not empty
  const { data: marketsWithoutImages, error: marketsError } = await supabase
    .from("markets")
    .select("id, chain_id, verification")
    .is("images", null)
    .not("verification->itemID", "is", null)
    .not("chain_id", "is", null)
    .limit(10);

  if (marketsError) {
    console.error("Error fetching markets without images:", marketsError);
    return;
  }

  if (!marketsWithoutImages || marketsWithoutImages.length === 0) {
    console.log("No markets without images found");
    return;
  }

  console.log(`Found ${marketsWithoutImages.length} markets without images`);

  // 2. Extract itemIDs from verification and fetch corresponding curate items
  const itemIDs = marketsWithoutImages
    .map(
      (market) =>
        // biome-ignore lint/suspicious/noExplicitAny:
        (market.verification as any)?.itemID,
    )
    .filter(Boolean);

  const { data: curateItems, error: curateError } = await supabase
    .from("curate")
    .select("item_id, metadata")
    .in("item_id", itemIDs);

  if (curateError) {
    console.error("Error fetching curate items:", curateError);
    return;
  }

  // Create a map for quick lookup of curate items by itemID
  const curateItemsMap = new Map(curateItems?.map((item) => [item.item_id, item]) || []);

  // 3. Process each market and update its images field
  const results = await Promise.all(
    marketsWithoutImages.map(async (market) => {
      // biome-ignore lint/suspicious/noExplicitAny:
      const itemID = (market.verification as any)?.itemID;
      if (!itemID) {
        return { success: false, id: market.id, reason: "No itemID in verification" };
      }

      const curateItem = curateItemsMap.get(itemID);
      if (!curateItem) {
        return { success: false, id: market.id, reason: "Curate item not found" };
      }

      // Extract images path from curate item metadata
      let images = null;
      if (typeof curateItem.metadata === "object" && curateItem.metadata !== null) {
        // biome-ignore lint/suspicious/noExplicitAny:
        const metadata = curateItem.metadata as any;
        if (metadata.values?.Images) {
          // Images is a path to a JSON file
          const imagePath = metadata.values.Images;
          try {
            const imageUrl = `https://cdn.kleros.link${imagePath}`;
            const response = await fetch(imageUrl);
            if (response.ok) {
              images = await response.json();
            } else {
              console.error(`Failed to fetch image data from ${imageUrl}: ${response.status}`);
              return { success: false, id: market.id, reason: "Failed to fetch image data" };
            }
          } catch (error) {
            console.error(`Error fetching image data for market ${market.id}:`, error);
            return { success: false, id: market.id, reason: "Error fetching image data" };
          }
        }
      }

      // Update the market with the fetched image data
      const { error: updateError } = await supabase
        .from("markets")
        .update({ images })
        .eq("id", market.id)
        .eq("chain_id", market.chain_id!);

      if (updateError) {
        console.error(`Error updating images for market ${market.id}:`, updateError);
        return { success: false, id: market.id, reason: "Database update error" };
      }

      return { success: true, id: market.id };
    }),
  );

  const successCount = results.filter((result) => result.success).length;
  console.log(`Successfully updated images for ${successCount} out of ${results.length} markets`);
}

// biome-ignore lint/suspicious/noExplicitAny:
function sortQuestions(market: any) {
  // Sort questions by index
  const sortedQuestions = [...market.questions].sort(
    (questionA, questionB) => questionA.question.index - questionB.question.index,
  );
  return {
    ...market,
    questions: sortedQuestions,
  };
}

async function processChain(chainId: SupportedChain, maxAgeSeconds: number): Promise<boolean> {
  const client = graphQLClient(chainId);
  const { markets } = await getSeerSdk(client).GetMarkets({
    first: 1000,
    orderBy: Market_OrderBy.BlockNumber,
    orderDirection: OrderDirection.Desc,
  });

  if (markets.length === 0) {
    console.log(`No markets found for chain ${chainId}`);
    return false;
  }

  await fetchAndStoreMetadata(supabase, chainId);

  const { data: curateItems } = await supabase
    .from("curate")
    .select("chain_id, item_id, metadata_path, metadata")
    .eq("chain_id", chainId)
    .not("metadata", "is", null);

  const verificationItems = await getVerification(chainId, (curateItems as CurateItem[]) || []);
  const verificationStatusList = getVerificationStatusList(verificationItems);

  await supabase.from("markets").upsert(
    markets.map((market) => ({
      id: market.id,
      chain_id: chainId,
      status: getMarketStatus(mapGraphMarketFromDbResult(market, { id: market.id, chain_id: chainId })),
      subgraph_data: sortQuestions(market),
      verification: verificationStatusList[market.id as `0x${string}`] ?? {
        status: "not_verified",
      },
    })),
  );

  // Check if the most recent market was created within the maxAgeSeconds window
  const now = Math.floor(Date.now() / 1000);
  const timestamp = Number(markets[0].blockTimestamp);
  return now - timestamp < maxAgeSeconds;
}

export default async () => {
  const maxAgeSeconds = 60 * 5; // 5 minutes
  let shouldRebuild = false;

  // update markets & verification status
  for (const chainId of chainIds) {
    try {
      const hasNewMarkets = await processChain(chainId, maxAgeSeconds);

      if (hasNewMarkets) {
        shouldRebuild = true;
      }
    } catch (e) {
      console.log(e);
    }
  }

  // update images
  await updateImages();

  // Trigger rebuild if new markets were found
  await triggerRebuildIfNeeded(shouldRebuild);

  try {
    await fetch("https://app.seer.pm/");
    console.log("Pinged app.seer.pm to help prevent cold starts");
  } catch (error) {
    console.error("Error pinging app.seer.pm:", error);
  }
};

async function triggerRebuildIfNeeded(shouldRebuild: boolean) {
  if (shouldRebuild) {
    if (!process.env.NETLIFY_BUILD_HOOK_ID) {
      console.error("NETLIFY_BUILD_HOOK_ID environment variable not set");
      return;
    }

    try {
      await fetch(`https://api.netlify.com/build_hooks/${process.env.NETLIFY_BUILD_HOOK_ID}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });
      console.log("Triggered rebuild due to new markets");
    } catch (error) {
      console.error("Error triggering rebuild:", error);
    }
  }
}

export const config: Config = {
  schedule: "*/5 * * * *",
};
