import { lightGeneralizedTcrAbi, lightGeneralizedTcrAddress } from "@/hooks/contracts/generated.ts";
import { VerificationResult } from "@/hooks/useMarket.ts";
import { SupportedChain } from "@/lib/chains.ts";
import { Config } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";
import { getBlockNumber, readContracts } from "@wagmi/core";
import { Address, parseAbiItem } from "viem";
import { getPublicClientForNetwork } from "./utils/common.ts";
import { chainIds, config as wagmiConfig } from "./utils/config.ts";
import { getLastProcessedBlock, updateLastProcessedBlock } from "./utils/logs.ts";
import { readContractsInBatch } from "./utils/readContractsInBatch.ts";
import { getSubgraphUrl } from "./utils/subgraph.ts";
import { Database, Json } from "./utils/supabase.ts";

const supabase = createClient<Database>(process.env.VITE_SUPABASE_PROJECT_URL!, process.env.VITE_SUPABASE_API_KEY!);

interface VerificationItem {
  itemID: `0x${string}`;
  metadata: Json;
  status: number;
  disputed: boolean;
  marketId?: string;
}

interface CurateItem {
  item_id: `0x${string}`;
  metadata_path: string;
  metadata: Json | null;
}

type ItemAndMetadata = { itemID: `0x${string}`; metadataPath: string };

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

/**
 * Retrieves verification information for a list of curate items from the LightGeneralizedTCR contract.
 *
 * This function:
 * 1. Fetches the current status of each item from the blockchain using the 'items' function
 * 2. Gets the latest request information for each item using 'getRequestInfo'
 * 3. Combines the data to determine if items are registered, disputed, or in other states
 * 4. Maps the blockchain data to a structured format with verification status and metadata
 *
 * @param chainId - The blockchain network ID to query
 * @param curateItems - Array of items from the curate database table
 * @returns Array of verification items with status information
 */
async function getVerification(chainId: SupportedChain, curateItems: CurateItem[]): Promise<VerificationItem[]> {
  const readItemsCall = {
    address: lightGeneralizedTcrAddress[chainId],
    abi: lightGeneralizedTcrAbi,
    functionName: "items",
    chainId,
  } as const;

  const items: (readonly [number, bigint, bigint])[] = await readContractsInBatch(
    curateItems.map(({ item_id: itemID }) => ({
      ...readItemsCall,
      args: [itemID],
    })),
    chainId,
    50,
    true,
  );

  const getRequestInfoCall = {
    address: lightGeneralizedTcrAddress[chainId],
    abi: lightGeneralizedTcrAbi,
    functionName: "getRequestInfo",
    chainId,
  } as const;

  const lastRequestInfo: (readonly [
    boolean,
    bigint,
    bigint,
    boolean,
    readonly [`0x${string}`, `0x${string}`, `0x${string}`],
    bigint,
    number,
    `0x${string}`,
    `0x${string}`,
    bigint,
  ])[] = await readContractsInBatch(
    curateItems.map(({ item_id: itemID }) => {
      const requestCount = BigInt(items[0]?.[2] || 1);
      return {
        ...getRequestInfoCall,
        args: [itemID, requestCount - 1n],
      };
    }),
    chainId,
    50,
    true,
  );

  return curateItems.map((item, n) => {
    const marketId =
      typeof item.metadata === "object" && item.metadata !== null
        ? // biome-ignore lint/suspicious/noExplicitAny:
          (item.metadata as any)?.values?.Market?.toLowerCase()
        : undefined;

    return {
      itemID: item.item_id,
      metadata: item.metadata,
      status: items[n]?.[0],
      disputed: lastRequestInfo[n]?.[0] && !lastRequestInfo[n]?.[3],
      marketId,
    };
  });
}

function getVerificationStatusList(verificationItems: VerificationItem[]): Record<Address, VerificationResult> {
  return verificationItems.reduce(
    (acc, item) => {
      if (item.marketId) {
        let status: VerificationResult["status"] = "not_verified";

        // 0 Absent, 1 Registered, 2 RegistrationRequested, 3 ClearingRequested
        if (item.status === 1) {
          status = "verified";
        } else if (item.status === 2) {
          status = item.disputed ? "challenged" : "verifying";
        }

        acc[item.marketId as Address] = {
          status,
          itemID: item.itemID,
        };
      }
      return acc;
    },
    {} as Record<Address, VerificationResult>,
  );
}

const LIGHT_GENERALIZED_TCR_NEW_ITEM_EVENT = parseAbiItem(
  "event NewItem(bytes32 indexed _itemID, string _data, bool _addedDirectly)",
);

async function getNewItemEvents(chainId: SupportedChain, fromBlock: bigint) {
  try {
    // Listen for LightGeneralizedTCR NewItem events
    const newItemLogs = await getPublicClientForNetwork(chainId).getLogs({
      address: lightGeneralizedTcrAddress[chainId],
      event: LIGHT_GENERALIZED_TCR_NEW_ITEM_EVENT,
      fromBlock,
      toBlock: "latest",
    });

    console.log(`[Network ${chainId}] Found ${newItemLogs.length} new item events`);
    return newItemLogs;
  } catch (error) {
    console.error(`[Network ${chainId}] Error fetching answer events:`, error);
    throw error;
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

async function processChain(chainId: SupportedChain) {
  const response = await fetch(getSubgraphUrl("seer", chainId), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: `{
        markets(first: 1000) {
          id
          type
          marketName
          outcomes
          wrappedTokens
          collateralToken
          collateralToken1
          collateralToken2
          parentMarket {
            id
            payoutReported
            conditionId
            payoutNumerators
          }
          parentOutcome
          parentCollectionId
          conditionId
          questionId
          templateId
          hasAnswers
          questionsInArbitration
          questions {
            question {
              id
              arbitrator
              opening_ts
              timeout
              finalize_ts
              is_pending_arbitration
              best_answer
              bond
              min_bond
            }
          }
          openingTs
          finalizeTs
          encodedQuestions
          lowerBound
          upperBound
          payoutReported
          payoutNumerators
          factory
          creator
          outcomesSupply
          blockTimestamp
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

  await fetchAndStoreMetadata(chainId);

  const { data: curateItems } = await supabase
    .from("curate")
    .select("item_id, metadata_path, metadata")
    .eq("chain_id", chainId)
    .not("metadata", "is", null);

  const verificationItems = await getVerification(chainId, (curateItems as CurateItem[]) || []);
  const verificationStatusList = getVerificationStatusList(verificationItems);

  await supabase.from("markets").upsert(
    // biome-ignore lint/suspicious/noExplicitAny:
    markets.map((market: any) => ({
      id: market.id,
      chain_id: chainId,
      subgraph_data: market,
      verification: verificationStatusList[market.id] ?? {
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
