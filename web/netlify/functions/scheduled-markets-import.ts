import { isVerificationEnabled } from "@/lib/config.ts";
import type { Config } from "@netlify/functions";
import type { SupportedChain, VerificationResult } from "@seer-pm/sdk";
import { WEATHER_CATEGORY } from "@seer-pm/sdk/create-market";
import { getMarketStatus } from "@seer-pm/sdk/market";
import { Market_Select_Column, Order_By } from "@seer-pm/sdk/subgraph/seer";
import { createClient } from "@supabase/supabase-js";
import { type Address, privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import { chainIds } from "./utils/config.ts";
import {
  fetchAndStoreMetadata,
  getSubgraphVerificationStatusList,
  updateVerificationForRecentlyChangedItems,
} from "./utils/curate.ts";
import { seerEnvioSdk } from "./utils/envioClient.ts";
import { type EnvioMarket, envioMarketToLegacySubgraphMarket, mapGraphMarketFromDbResult } from "./utils/markets.ts";
import {
  CURSOR_OVERLAP_SECONDS,
  advanceCheckpoint,
  marketsUpdatedAtCursor,
  maxUpdatedAt,
  readMarketsImportCheckpoint,
  verificationSince,
  writeMarketsImportCheckpoint,
} from "./utils/marketsImportCheckpoint.ts";
import type { Database } from "./utils/supabase.ts";

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

function getLiquidityAccount() {
  const privateKey = process.env.LIQUIDITY_ACCOUNT_PRIVATE_KEY!;
  return privateKeyToAccount((privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`) as Address);
}

const MARKETS_PAGE_SIZE = 1000;
const UPSERT_CHUNK_SIZE = 250;

/** Latest persisted market creation time for this chain — only used to detect brand-new markets. */
async function getMaxBlockTimestamp(chainId: SupportedChain): Promise<number> {
  const { data, error } = await supabase
    .from("markets_search")
    .select("block_timestamp")
    .eq("chain_id", chainId)
    .not("block_timestamp", "is", null)
    .order("block_timestamp", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch max block_timestamp for chain ${chainId}: ${error.message}`);
  }

  return data?.block_timestamp ?? 0;
}

async function fetchAllSubgraphMarkets(chainId: SupportedChain, sinceUpdatedAt: number): Promise<EnvioMarket[]> {
  const sdk = seerEnvioSdk(chainId);
  const allMarkets: EnvioMarket[] = [];
  let offset = 0;

  while (true) {
    const { Market: markets } = await sdk.GetMarkets({
      limit: MARKETS_PAGE_SIZE,
      offset,
      // Ascending on the cursor field keeps offset pagination stable against a live index:
      // new updates land at the end instead of shifting the pages already read.
      orderBy: { [Market_Select_Column.UpdatedAt]: Order_By.Asc },
      where: {
        chainId: { _eq: String(chainId) },
        updatedAt: { _gt: String(sinceUpdatedAt) },
      },
    });

    if (markets.length === 0) {
      break;
    }

    allMarkets.push(...markets);
    if (markets.length < MARKETS_PAGE_SIZE) {
      break;
    }
    offset += MARKETS_PAGE_SIZE;
  }

  return allMarkets;
}

async function refreshMarketOutcomeTokensIfNeeded(shouldRefresh: boolean): Promise<void> {
  if (!shouldRefresh) return;
  const { error } = await supabase.rpc("refresh_market_outcome_tokens");
  if (error) {
    console.error("scheduled-markets-import: refresh_market_outcome_tokens failed:", error.message);
    return;
  }
  console.log("scheduled-markets-import: refreshed market_outcome_tokens after newly created markets");
}

type ProcessChainResult = {
  chainId: SupportedChain;
  /** Any market with blockTimestamp above the DB watermark — triggers Netlify rebuild + MV refresh. */
  hasNewMarkets: boolean;
  success: boolean;
  error?: unknown;
};

async function processChain(chainId: SupportedChain): Promise<ProcessChainResult> {
  const runStartedAt = Math.floor(Date.now() / 1000);
  const checkpoint = await readMarketsImportCheckpoint(supabase, chainId);
  const sinceUpdatedAt = marketsUpdatedAtCursor(checkpoint);
  // Read before the upsert so newly imported markets don't count as pre-existing.
  const maxBlockTimestamp = await getMaxBlockTimestamp(chainId);
  const markets = await fetchAllSubgraphMarkets(chainId, sinceUpdatedAt);

  // Curate activity runs on its own timeline, so the verification sync and its cursor advance even
  // on a run that found no market changes. Called only once every market of the run is persisted,
  // so a mid-import failure re-runs the same window instead of skipping it.
  const syncVerificationAndCheckpoint = async (fetchedMaxUpdatedAt: number | null) => {
    if (isVerificationEnabled(chainId)) {
      await updateVerificationForRecentlyChangedItems(supabase, chainId, verificationSince(checkpoint, runStartedAt));
    }
    await writeMarketsImportCheckpoint(
      supabase,
      chainId,
      advanceCheckpoint(checkpoint, {
        fetchedMaxUpdatedAt,
        verificationSyncedAt: runStartedAt - CURSOR_OVERLAP_SECONDS,
      }),
    );
  };

  if (markets.length === 0) {
    console.log(`No markets found for chain ${chainId}`);
    await syncVerificationAndCheckpoint(null);
    return { chainId, hasNewMarkets: false, success: true };
  }

  console.log(`Chain ${chainId}: fetched ${markets.length} markets (cursor updatedAt>${sinceUpdatedAt})`);

  const hasNewMarkets = markets.some((market) => Number(market.blockTimestamp) > maxBlockTimestamp);

  // The map comes from the curate subgraph rather than the `curate` table, which is filled only a
  // handful of metadata rows per run: a market whose item has not been backfilled there yet is
  // indistinguishable from one that was never submitted, and would be written as `not_verified` over
  // a verification it actually holds. `fetchAndStoreMetadata` still runs, because `updateImages`
  // reads the metadata it stores.
  let verificationStatusList: Record<Address, VerificationResult | undefined> = {};
  // Chains without curation have no registry to consult, so they keep writing the default.
  let shouldWriteVerification = true;
  if (isVerificationEnabled(chainId)) {
    await fetchAndStoreMetadata(supabase, chainId);
    verificationStatusList = await getSubgraphVerificationStatusList(chainId);
    shouldWriteVerification = Object.keys(verificationStatusList).length > 0;
    if (!shouldWriteVerification) {
      // An empty registry on a chain that curates markets means the subgraph answered but told us
      // nothing. Writing the map anyway would reset every market on the chain to `not_verified`.
      console.error(`Chain ${chainId}: empty curate verification map, leaving stored verification untouched`);
    }
  }

  const { data: weatherMarkets } = await supabase.from("weather_markets").select("tx_hash");
  const weatherTxHashSet = new Set((weatherMarkets ?? []).map((weatherMarket) => weatherMarket.tx_hash));
  const liquidityAccount = getLiquidityAccount();
  const rows = markets.map((market) => {
    const legacySubgraphMarket = envioMarketToLegacySubgraphMarket(market);
    return {
      id: market.address,
      chain_id: chainId,
      status: getMarketStatus(
        mapGraphMarketFromDbResult(legacySubgraphMarket, {
          id: market.address,
          chain_id: chainId,
          open_interest_usd: 0,
        }),
      ),
      subgraph_data: legacySubgraphMarket,
      // Omitted entirely when we have no map, so the upsert preserves what is already stored.
      ...(shouldWriteVerification && {
        verification: verificationStatusList[market.address as `0x${string}`] ?? {
          status: "not_verified",
        },
      }),
      // check if it's a weather market
      ...(weatherTxHashSet.has(market.transactionHash) && {
        creator: liquidityAccount.address.toLowerCase(),
        categories: [WEATHER_CATEGORY],
      }),
    };
  });

  // A bootstrap run (no checkpoint yet) imports every market on the chain, which is far more than
  // one PostgREST request can carry.
  for (let i = 0; i < rows.length; i += UPSERT_CHUNK_SIZE) {
    const { error: upsertError } = await supabase.from("markets").upsert(rows.slice(i, i + UPSERT_CHUNK_SIZE));
    if (upsertError) {
      console.error(`Chain ${chainId}: markets upsert failed at offset ${i}:`, upsertError);
      return { chainId, hasNewMarkets: false, success: false, error: upsertError };
    }
  }

  await syncVerificationAndCheckpoint(maxUpdatedAt(markets));

  return {
    chainId,
    hasNewMarkets,
    success: true,
  };
}

export default async () => {
  // update markets & verification status
  const chainResults = await Promise.allSettled(
    chainIds
      .filter((chainId) => chainId !== sepolia.id)
      .map(async (chainId) => {
        try {
          return await processChain(chainId);
        } catch (e) {
          console.error(`Chain id ${chainId} error`, e);
          return {
            chainId,
            hasNewMarkets: false,
            success: false,
            error: e,
          } satisfies ProcessChainResult;
        }
      }),
  );

  const fulfilled = chainResults
    .filter((r): r is PromiseFulfilledResult<ProcessChainResult> => r.status === "fulfilled")
    .map((r) => r.value);

  // Check if any chain had new markets
  const shouldRebuild = fulfilled.some((r) => r.hasNewMarkets);

  // Log results summary
  const successfulChains = fulfilled.filter((r) => r.success).length;
  const failedChains = chainResults.length - successfulChains;
  console.log(`Chain processing completed: ${successfulChains} successful, ${failedChains} failed`);

  // update images
  await updateImages();

  // Refresh MV + trigger rebuild when newly created markets were found
  await refreshMarketOutcomeTokensIfNeeded(shouldRebuild);
  await triggerRebuildIfNeeded(shouldRebuild);

  try {
    await Promise.all([
      // Ping a 404 page to bypass CDN cache and keep the function warm
      // The 404 page is never cached, so it always executes the function
      fetch("https://app.seer.pm/ping"),
      // ping charts
      fetch(
        "https://app.seer.pm/.netlify/functions/market-chart?marketId=0xa4b71ac2d0e17e1242e2d825e621acd18f0054ea&chainId=100",
      ),
      // ping get-market
      fetch("https://app.seer.pm/.netlify/functions/get-market", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chainId: 100,
          url: "will-jesus-christ-return-in-2025",
        }),
      }),
      // ping markets-search
      fetch("https://app.seer.pm/.netlify/functions/markets-search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ chainsList: [100], limit: 1 }),
      }),
    ]);
    console.log("Pinged endpoints to help prevent cold starts");
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
