import { isVerificationEnabled } from "@/lib/config.ts";
import { isUndefined } from "@/lib/utils.ts";
import { CURATE_STATUS, type SupportedChain, type VerificationResult } from "@seer-pm/sdk";
import { lightGeneralizedTcrAbi, lightGeneralizedTcrAddress } from "@seer-pm/sdk/contracts/curate";
import { curateGraphQLClient } from "@seer-pm/sdk/subgraph";
import {
  type GetImagesQuery,
  type GetRecentlyChangedLItemsQuery,
  getSdk as getCurateSdk,
} from "@seer-pm/sdk/subgraph/curate";
import type { SupabaseClient } from "@supabase/supabase-js";
import { type Address, parseAbiItem } from "viem";
import { getLogs, readContract } from "viem/actions";
import { getPublicClientByChainId } from "./config.ts";
import type { Json } from "./supabase.ts";

export interface CurateItem {
  chain_id: number;
  item_id: `0x${string}`;
  metadata_path: string;
  metadata: Json | null;
}

type ItemAndMetadata = { itemID: `0x${string}`; metadataPath: string };

type CurateLItemForVerification = GetRecentlyChangedLItemsQuery["LItem"][number];

function getMarketIdFromLItem(item: CurateLItemForVerification): string | undefined {
  return item.props?.find((prop) => prop.label === "Market")?.value?.toLowerCase();
}

export function mapLItemToVerificationResult(
  item: CurateLItemForVerification,
  challengePeriodDuration?: bigint,
): VerificationResult {
  const deadline =
    item.latestRequestSubmissionTime && challengePeriodDuration
      ? Number(item.latestRequestSubmissionTime) + Number(challengePeriodDuration)
      : undefined;
  const isVerifiedBeforeClearing =
    item.status === CURATE_STATUS.ClearingRequested &&
    item.requests.find((request) => request.requestType === CURATE_STATUS.RegistrationRequested)?.resolved;
  if (item.status === CURATE_STATUS.Registered || isVerifiedBeforeClearing) {
    return { status: "verified", itemID: item.itemID as `0x${string}`, deadline };
  }
  if (item.status === CURATE_STATUS.RegistrationRequested) {
    if (item.disputed) {
      return { status: "challenged", itemID: item.itemID as `0x${string}`, deadline };
    }
    return { status: "verifying", itemID: item.itemID as `0x${string}`, deadline };
  }
  return { status: "not_verified" };
}

async function getChallengePeriodDuration(chainId: SupportedChain): Promise<bigint | undefined> {
  try {
    return await readContract(getPublicClientByChainId(chainId), {
      address: lightGeneralizedTcrAddress[chainId],
      abi: lightGeneralizedTcrAbi,
      functionName: "challengePeriodDuration",
    });
  } catch {
    return undefined;
  }
}

export async function fetchRecentlyChangedLItems(
  chainId: SupportedChain,
  sinceSeconds: number,
): Promise<CurateLItemForVerification[]> {
  const client = curateGraphQLClient(chainId);
  const registryAddress = lightGeneralizedTcrAddress[chainId];
  if (!client || isUndefined(registryAddress)) {
    return [];
  }

  const since = sinceSeconds.toString();
  const { LItem } = await getCurateSdk(client).GetRecentlyChangedLItems({
    where: {
      registryAddress: { _eq: registryAddress.toLowerCase() },
      _or: [{ latestRequestSubmissionTime: { _gt: since } }, { latestRequestResolutionTime: { _gt: since } }],
    },
  });

  return LItem;
}

export async function updateVerificationForRecentlyChangedItems(
  supabase: SupabaseClient,
  chainId: SupportedChain,
  sinceSeconds: number,
): Promise<number> {
  if (!isVerificationEnabled(chainId)) {
    return 0;
  }

  const items = await fetchRecentlyChangedLItems(chainId, sinceSeconds);
  if (items.length === 0) {
    console.log(`[Chain ${chainId}] No recently changed curate items`);
    return 0;
  }

  const challengePeriodDuration = await getChallengePeriodDuration(chainId);
  const verificationByMarketId = new Map<string, VerificationResult>();

  for (const item of items) {
    const marketId = getMarketIdFromLItem(item);
    if (!marketId) {
      continue;
    }
    verificationByMarketId.set(marketId, mapLItemToVerificationResult(item, challengePeriodDuration));
  }

  if (verificationByMarketId.size === 0) {
    return 0;
  }

  const updates = [...verificationByMarketId.entries()].map(([id, verification]) => ({
    id,
    chain_id: chainId,
    verification,
  }));

  const { error } = await supabase.from("markets").upsert(updates);

  if (error) {
    console.error(`[Chain ${chainId}] Error upserting verification:`, error);
    return 0;
  }

  console.log(
    `[Chain ${chainId}] Updated verification for ${updates.length} of ${items.length} recently changed curate items`,
  );
  return updates.length;
}

/** Page size for the curate registry crawl. A single unpaginated fetch silently truncates. */
const LITEMS_PAGE_SIZE = 1000;

/** Every LItem of a registry, paged — the registry grows without bound, so one page is not enough. */
async function fetchAllRegistryLItems(client: ReturnType<typeof curateGraphQLClient>, registryAddress: string) {
  const all: GetImagesQuery["LItem"] = [];
  let skip = 0;

  while (true) {
    const { LItem } = await getCurateSdk(client).GetImages({
      where: {
        registryAddress: { _eq: registryAddress.toLowerCase() },
      },
      skip,
      first: LITEMS_PAGE_SIZE,
    });

    all.push(...LItem);
    if (LItem.length < LITEMS_PAGE_SIZE) {
      return all;
    }
    skip += LITEMS_PAGE_SIZE;
  }
}

export async function getSubgraphVerificationStatusList(
  chainId: SupportedChain,
): Promise<Record<Address, VerificationResult | undefined>> {
  const client = curateGraphQLClient(chainId);

  const registryAddress = lightGeneralizedTcrAddress[chainId];
  if (client && !isUndefined(registryAddress)) {
    const challengePeriodDuration = await getChallengePeriodDuration(chainId);

    const items = await fetchAllRegistryLItems(client, registryAddress);
    return items.reduce(
      (obj, item) => {
        const marketId = getMarketIdFromLItem(item);
        if (!marketId) {
          return obj;
        }
        obj[marketId] = mapLItemToVerificationResult(item, challengePeriodDuration);
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
    const newItemLogs = await getLogs(getPublicClientByChainId(chainId), {
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

async function getItemsAndMetadata(chainId: SupportedChain) {
  // `curateGraphQLClient` points at the same hosted subgraph for every chain; we scope results to the
  // requested chain by filtering on `registryAddress`, which is unique per chain in `lightGeneralizedTcrAddress`.
  // if (fetchFromSubgraph) {
  const client = curateGraphQLClient(chainId);

  const registryAddress = lightGeneralizedTcrAddress[chainId];
  if (client && !isUndefined(registryAddress)) {
    const { LItem } = await getCurateSdk(client).GetImages({
      where: {
        registryAddress: { _eq: registryAddress.toLowerCase() },
      },
      first: 1000,
    });
    return LItem.reduce((obj, item) => {
      obj.push({ itemID: item.itemID as Address, metadataPath: item.data });
      return obj;
    }, [] as ItemAndMetadata[]);
  }

  return [];
  // }

  /* const fromBlock = await getLastProcessedBlock(chainId, getLastProcessedBlockKey(chainId));

  const items: ItemAndMetadata[] = (await getNewItemEvents(chainId, fromBlock)).map((d) => ({
    itemID: d.args._itemID || "0x",
    metadataPath: d.args._data || "",
  }));

  const currentBlock = await getBlockNumber(getPublicClientByChainId(chainId));

  await updateLastProcessedBlock(chainId, currentBlock, getLastProcessedBlockKey(chainId));

  return items; */
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
  if (!isVerificationEnabled(chainId)) {
    return;
  }

  const items: ItemAndMetadata[] = await getItemsAndMetadata(chainId);

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
  const itemsToStore: CurateItem[] = itemsToFetch.slice(batchSize).map(
    (item): CurateItem => ({
      item_id: item.itemID,
      chain_id: chainId,
      metadata_path: item.metadataPath,
      metadata: null,
    }),
  );

  // Fetch metadata for the batch
  const processedItems: CurateItem[] = await Promise.all(
    itemsToProcess.map(async (item): Promise<CurateItem> => {
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

/* function getLastProcessedBlockKey(chainId: SupportedChain): string {
  return `curate-new-item-events-${chainId}-last-block`;
} */
