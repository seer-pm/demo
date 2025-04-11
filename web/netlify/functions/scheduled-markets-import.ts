import { getSdk as getSeerSdk } from "@/hooks/queries/gql-generated-seer";
import { SupportedChain } from "@/lib/chains.ts";
import { graphQLClient } from "@/lib/subgraph.ts";
import { Config } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";
import { getBlockNumber } from "@wagmi/core";
import { chainIds, config as wagmiConfig } from "./utils/config.ts";
import {
  CurateItem,
  ItemAndMetadata,
  getNewItemEvents,
  getVerification,
  getVerificationStatusList,
} from "./utils/curate.ts";
import { getLastProcessedBlock, updateLastProcessedBlock } from "./utils/logs.ts";
import { Database } from "./utils/supabase.ts";

const supabase = createClient<Database>(process.env.VITE_SUPABASE_PROJECT_URL!, process.env.VITE_SUPABASE_API_KEY!);

/**
 * Fetches and stores metadata for curate items in the database.
 *
 * 1. Checks which items already exist in the database
 * 2. Identifies items that need metadata fetching (new items or items with null metadata)
 * 3. Processes a limited batch of items (controlled by batchSize) to avoid overloading
 * 4. Fetches metadata from IPFS for the batch
 * 5. Stores both processed items (with metadata) and remaining items (without metadata)
 *    in the database for later processing
 *
 * @param chainId - The blockchain network ID
 * @param batchSize - Maximum number of items to fetch metadata for in one execution
 */
async function fetchAndStoreMetadata(chainId: SupportedChain, batchSize = 10): Promise<void> {
  const fromBlock = await getLastProcessedBlock(chainId, getLastProcessedBlockKey(chainId));

  const items: ItemAndMetadata[] = (await getNewItemEvents(chainId, fromBlock)).map((d) => ({
    itemID: d.args._itemID || "0x",
    metadataPath: d.args._data || "",
  }));

  // Get existing items from the database
  const { data: existingItems } = await supabase
    .from("curate")
    .select("item_id, metadata")
    .eq("chain_id", chainId)
    .in(
      "item_id",
      items.map((item) => item.itemID),
    );

  // Create a map for quick lookup
  const existingItemsMap = new Map(existingItems?.map((item) => [item.item_id, item]) || []);

  // Filter items that need metadata fetching (not in DB or have null metadata)
  const itemsToFetch = items.filter(
    (item) => !existingItemsMap.has(item.itemID) || existingItemsMap.get(item.itemID)?.metadata === null,
  );

  // Process only the first batchSize items
  const itemsToProcess = itemsToFetch.slice(0, batchSize);

  // For the remaining items, just ensure they're in the database without metadata
  const itemsToStore = itemsToFetch.slice(batchSize).map((item) => ({
    item_id: item.itemID,
    chain_id: chainId,
    metadata_path: item.metadataPath,
    metadata: null,
  }));

  // Fetch metadata for the batch
  const processedItems = await Promise.all(
    itemsToProcess.map(async (item) => {
      const metadataUrl = `https://cdn.kleros.link${item.metadataPath}`;
      let metadata = null;
      try {
        const response = await fetch(metadataUrl);
        if (response.ok) {
          metadata = await response.json();
        } else {
          console.error(`Failed to fetch metadata from ${metadataUrl}: ${response.status}`);
        }
      } catch (error) {
        console.error(`Error fetching metadata from ${metadataUrl}:`, error);
      }

      return {
        item_id: item.itemID,
        chain_id: chainId,
        metadata_path: item.metadataPath,
        metadata,
      };
    }),
  );

  // Combine all items to store
  const allItemsToStore = [...processedItems, ...itemsToStore];

  // Store in database
  if (allItemsToStore.length > 0) {
    const { error } = await supabase.from("curate").upsert(allItemsToStore);

    if (error) {
      console.error("Error upserting curate items:", error);
    } else {
      console.log(
        `Successfully stored ${allItemsToStore.length} curate items (${processedItems.length} with metadata)`,
      );
    }
  }
}

function getLastProcessedBlockKey(chainId: SupportedChain): string {
  return `curate-new-item-events-${chainId}-last-block`;
}

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

async function processChain(chainId: SupportedChain) {
  const client = graphQLClient(chainId);
  const { markets } = await getSeerSdk(client).GetMarkets({ first: 1000 });

  if (markets.length === 0) {
    return;
  }

  await fetchAndStoreMetadata(chainId);

  const { data: curateItems } = await supabase
    .from("curate")
    .select("item_id, metadata_path, metadata")
    .eq("chain_id", chainId)
    .not("metadata", "is", null);

  const verificationItems = await getVerification(chainId, (curateItems as CurateItem[]) || []);
  const verificationStatusList = getVerificationStatusList(verificationItems);

  await supabase.from("markets").upsert(
    markets.map((market) => ({
      id: market.id,
      chain_id: chainId,
      subgraph_data: sortQuestions(market),
      verification: verificationStatusList[market.id as `0x${string}`] ?? {
        status: "not_verified",
      },
    })),
  );

  const currentBlock = await getBlockNumber(wagmiConfig, {
    chainId,
  });
  await updateLastProcessedBlock(chainId, currentBlock, getLastProcessedBlockKey(chainId));
}

export default async () => {
  // update markets & verification status
  for (const chainId of chainIds) {
    try {
      await processChain(chainId);
    } catch (e) {
      console.log(e);
    }
  }

  // update images
  await updateImages();
};

export const config: Config = {
  schedule: "*/5 * * * *",
};
