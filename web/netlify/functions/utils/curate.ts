import { lightGeneralizedTcrAbi, lightGeneralizedTcrAddress } from "@/hooks/contracts/generated-curate";
import { GetImagesQuery, Status, getSdk as getCurateSdk } from "@/hooks/queries/gql-generated-curate.ts";
import { SupportedChain } from "@/lib/chains.ts";
import { VerificationResult } from "@/lib/market";
import { isUndefined } from "@/lib/utils.ts";
import { SupabaseClient } from "@supabase/supabase-js";
import { getBlockNumber } from "@wagmi/core";
import { Address, parseAbiItem } from "viem";
import { getPublicClientForNetwork } from "./common.ts";
import { config as wagmiConfig } from "./config.ts";
import { getLastProcessedBlock, updateLastProcessedBlock } from "./logs.ts";
import { readContractsInBatch } from "./readContractsInBatch.ts";
import { curateGraphQLClient } from "./subgraph.ts";
import { Json } from "./supabase.ts";

interface VerificationItem {
  itemID: `0x${string}`;
  metadata: Json;
  status: number;
  disputed: boolean;
  marketId?: string;
}

export interface CurateItem {
  chain_id: number;
  item_id: `0x${string}`;
  metadata_path: string;
  metadata: Json | null;
}

type ItemAndMetadata = { itemID: `0x${string}`; metadataPath: string };

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
export async function getVerification(chainId: SupportedChain, curateItems: CurateItem[]): Promise<VerificationItem[]> {
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

export function getVerificationStatusList(verificationItems: VerificationItem[]): Record<Address, VerificationResult> {
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

export async function getSubgraphVerificationStatusList(
  chainId: SupportedChain,
): Promise<Record<Address, VerificationResult | undefined>> {
  const client = curateGraphQLClient(chainId);

  const registryAddress = lightGeneralizedTcrAddress[chainId];
  if (client && !isUndefined(registryAddress)) {
    const { litems } = await getCurateSdk(client).GetImages({
      where: {
        registryAddress,
      },
      first: 1000,
    });
    return litems.reduce(
      (obj, item) => {
        const marketId = item.metadata?.props?.find((prop) => prop.label === "Market")?.value?.toLowerCase();
        if (!marketId) {
          return obj;
        }
        const isVerifiedBeforeClearing =
          item.status === Status.ClearingRequested &&
          item.requests.find((request) => request.requestType === Status.RegistrationRequested)?.resolved;
        if (item.status === Status.Registered || isVerifiedBeforeClearing) {
          obj[marketId] = { status: "verified", itemID: item.itemID };
          return obj;
        }
        if (item.status === Status.RegistrationRequested) {
          if (item.disputed) {
            obj[marketId] = { status: "challenged", itemID: item.itemID };
          } else {
            obj[marketId] = { status: "verifying", itemID: item.itemID };
          }
          return obj;
        }
        obj[marketId] = { status: "not_verified" };
        return obj;
      },
      {} as { [key: string]: VerificationResult },
    );
  }

  return {};
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

async function getItemsAndMetadata(chainId: SupportedChain, fetchFromSubgraph: boolean) {
  if (fetchFromSubgraph) {
    const client = curateGraphQLClient(chainId);

    const registryAddress = lightGeneralizedTcrAddress[chainId];
    if (client && !isUndefined(registryAddress)) {
      const { litems } = await getCurateSdk(client).GetImages({
        where: {
          registryAddress,
        },
        first: 1000,
      });
      return litems.reduce((obj, item) => {
        obj.push({ itemID: item.itemID, metadataPath: item.data });
        return obj;
      }, [] as ItemAndMetadata[]);
    }

    return [];
  }

  const fromBlock = await getLastProcessedBlock(chainId, getLastProcessedBlockKey(chainId));

  const items: ItemAndMetadata[] = (await getNewItemEvents(chainId, fromBlock)).map((d) => ({
    itemID: d.args._itemID || "0x",
    metadataPath: d.args._data || "",
  }));

  const currentBlock = await getBlockNumber(wagmiConfig, {
    chainId,
  });

  await updateLastProcessedBlock(chainId, currentBlock, getLastProcessedBlockKey(chainId));

  return items;
}

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
export async function fetchAndStoreMetadata(
  supabase: SupabaseClient,
  chainId: SupportedChain,
  batchSize = 10,
): Promise<void> {
  const items: ItemAndMetadata[] = await getItemsAndMetadata(chainId, true);

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
  const allItemsToStore: CurateItem[] = [...processedItems, ...itemsToStore];

  // Store in database
  if (allItemsToStore.length > 0) {
    const { error } = await supabase.from("curate").upsert(allItemsToStore);

    if (error) {
      throw new Error(`Error upserting curate items: ${error.message}`);
    }

    console.log(`Successfully stored ${allItemsToStore.length} curate items (${processedItems.length} with metadata)`);
  }
}

function getLastProcessedBlockKey(chainId: SupportedChain): string {
  return `curate-new-item-events-${chainId}-last-block`;
}
