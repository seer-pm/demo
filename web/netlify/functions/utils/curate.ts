import { lightGeneralizedTcrAbi, lightGeneralizedTcrAddress } from "@/hooks/contracts/generated-curate";
import { GetImagesQuery, Status, getSdk as getCurateSdk } from "@/hooks/queries/gql-generated-curate.ts";
import { VerificationResult } from "@/hooks/useMarket.ts";
import { SupportedChain } from "@/lib/chains.ts";
import { isUndefined } from "@/lib/utils.ts";
import { Address, parseAbiItem } from "viem";
import { getPublicClientForNetwork } from "./common.ts";
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
  item_id: `0x${string}`;
  metadata_path: string;
  metadata: Json | null;
}

export type ItemAndMetadata = { itemID: `0x${string}`; metadataPath: string };

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

export async function getNewItemEvents(chainId: SupportedChain, fromBlock: bigint) {
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
