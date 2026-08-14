import { type MarketDataMapping, type SupportedChain, type TransactionData, getMappings } from "@seer-pm/sdk";
import type { Market } from "@seer-pm/sdk/market-types";
import type { Address } from "viem";
import { getBlock } from "viem/actions";
import { getPublicClientByChainId } from "./utils/config";
import { searchAllMarkets } from "./utils/markets";
import { getLiquidityEvents } from "./utils/transactions/getLiquidityEvents";
import { getLiquidityWithdrawEvents } from "./utils/transactions/getLiquidityWithdrawEvents";
import { getSplitMergeRedeemEvents } from "./utils/transactions/getSplitMergeRedeemEvents";
import { getSwapEvents } from "./utils/transactions/getSwapEvents";
import type { EventFetchOptions } from "./utils/transactions/subgraphTimestampIdPagination";

const MARKETS_MAPPINGS_TTL_MS = 15 * 60 * 1000;

/**
 * Rows returned when the caller doesn't pass `limit`. Latency scales with row count, not with the
 * date window, so this is what bounds the work for a heavy account. Pass `limit=0` for the full
 * uncapped history (what the date picker's "All" preset relies on).
 */
const DEFAULT_LIMIT = 250;

type MarketsMappingsCacheEntry = {
  markets: Market[];
  mappings: MarketDataMapping | null;
  expiresAt: number;
};

const marketsMappingsByChain = new Map<number, MarketsMappingsCacheEntry>();
const marketsMappingsInflight = new Map<number, Promise<MarketsMappingsCacheEntry>>();

async function getMarketsAndMappings(chainId: SupportedChain): Promise<{
  markets: Market[];
  mappings: MarketDataMapping | null;
}> {
  const cached = marketsMappingsByChain.get(chainId);
  if (cached && cached.expiresAt > Date.now()) {
    return { markets: cached.markets, mappings: cached.mappings };
  }

  let inflight = marketsMappingsInflight.get(chainId);
  if (!inflight) {
    inflight = (async () => {
      const { markets } = await searchAllMarkets({ chainIds: [chainId] });
      const mappings =
        markets.length === 0 ? null : await getMappings(getPublicClientByChainId(chainId), markets, chainId);
      const entry: MarketsMappingsCacheEntry = {
        markets,
        mappings,
        expiresAt: Date.now() + MARKETS_MAPPINGS_TTL_MS,
      };
      if (markets.length > 0) {
        marketsMappingsByChain.set(chainId, entry);
      }
      return entry;
    })().finally(() => {
      marketsMappingsInflight.delete(chainId);
    });
    marketsMappingsInflight.set(chainId, inflight);
  }

  const entry = await inflight;
  return { markets: entry.markets, mappings: entry.mappings };
}

async function getBlockTimestamp(chainId: SupportedChain, initialBlockNumber: number) {
  let blockNumber = initialBlockNumber;
  const maxAttempts = 10; // Limit the number of attempts
  let attempts = 0;
  const client = getPublicClientByChainId(chainId);

  while (attempts < maxAttempts) {
    try {
      const block = await getBlock(client, { blockNumber: BigInt(blockNumber) });
      if (block.timestamp) {
        return Number(block.timestamp);
      }
      // Increment block number and attempts
      blockNumber++;
      attempts++;
    } catch (error) {
      blockNumber++;
      attempts++;
    }
  }
}

async function getEvents(
  mappings: MarketDataMapping,
  account: Address,
  chainId: SupportedChain,
  startTime?: number,
  endTime?: number,
  eventType?: string,
  options?: EventFetchOptions,
) {
  let events: TransactionData[][] = [];

  // If no eventType specified or invalid, return all events
  if (!eventType || !["swap", "lp", "ctf"].includes(eventType)) {
    events = await Promise.all([
      getSwapEvents(mappings, account, chainId, startTime, endTime, options),
      getLiquidityEvents(mappings, account, chainId, startTime, endTime, options),
      getLiquidityWithdrawEvents(mappings, account, chainId, startTime, endTime, options),
      getSplitMergeRedeemEvents(account, chainId, startTime, endTime, options),
    ]);
  } else {
    // Filter events based on eventType
    switch (eventType) {
      case "swap":
        events = [await getSwapEvents(mappings, account, chainId, startTime, endTime, options)];
        break;
      case "lp":
        events = await Promise.all([
          getLiquidityEvents(mappings, account, chainId, startTime, endTime, options),
          getLiquidityWithdrawEvents(mappings, account, chainId, startTime, endTime, options),
        ]);
        break;
      case "ctf":
        events = [await getSplitMergeRedeemEvents(account, chainId, startTime, endTime, options)];
        break;
    }
  }

  return events.flat();
}

async function getTransactions(
  account: Address,
  chainId: SupportedChain,
  startTime?: number,
  endTime?: number,
  eventType?: string,
  limit?: number,
): Promise<{ transactions: TransactionData[]; truncated: boolean }> {
  const { markets, mappings } = await getMarketsAndMappings(chainId);

  if (markets.length === 0 || !mappings) {
    return { transactions: [], truncated: false };
  }

  const { tokenIdToTokenSymbolMapping } = mappings;

  // Each leg is capped independently, then the merged set is trimmed. Correct by construction:
  // any row in the global newest-`limit` must also be in its own leg's newest-`limit`, so no
  // event type is starved by a noisier one.
  const fetchOptions: EventFetchOptions = { limit };
  const data = await getEvents(mappings, account, chainId, startTime, endTime, eventType, fetchOptions);

  // get timestamp
  const timestamps = await Promise.all(data.map((x) => x.timestamp ?? getBlockTimestamp(chainId, x.blockNumber)));

  const mapped = data
    .map((x, index) => {
      function parseSymbol(tokenAddress?: string) {
        return tokenAddress ? tokenIdToTokenSymbolMapping[tokenAddress.toLocaleLowerCase()] : undefined;
      }
      return {
        ...x,
        timestamp: timestamps[index],
        collateralSymbol: parseSymbol(x.collateral),
        token0Symbol: x.token0Symbol ?? parseSymbol(x.token0),
        token1Symbol: x.token1Symbol ?? parseSymbol(x.token1),
        tokenInSymbol: x.tokenInSymbol ?? parseSymbol(x.tokenIn),
        tokenOutSymbol: x.tokenOutSymbol ?? parseSymbol(x.tokenOut),
      };
    })
    .sort((a, b) => b.blockNumber - a.blockNumber);

  if (limit !== undefined && limit > 0 && mapped.length > limit) {
    return { transactions: mapped.slice(0, limit), truncated: true };
  }

  return { transactions: mapped, truncated: Boolean(fetchOptions.truncated) };
}

export default async (req: Request) => {
  try {
    const url = new URL(req.url);
    const account = url.searchParams.get("account");
    const chainId = url.searchParams.get("chainId");
    const startTime = url.searchParams.get("startTime");
    const endTime = url.searchParams.get("endTime");
    const eventType = url.searchParams.get("eventType");
    const limitParam = url.searchParams.get("limit");

    // Validate required parameters
    if (!account) {
      return new Response(JSON.stringify({ error: "Account parameter is required" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    if (!chainId) {
      return new Response(JSON.stringify({ error: "ChainId parameter is required" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    // Validate eventType if provided
    if (eventType && !["swap", "lp", "ctf"].includes(eventType)) {
      return new Response(JSON.stringify({ error: "eventType must be one of: swap, lp, ctf" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    // Convert startTime and endTime to numbers if present
    const startTimeNum = startTime ? Number.parseInt(startTime, 10) : undefined;
    const endTimeNum = endTime ? Number.parseInt(endTime, 10) : undefined;

    // Validate that startTime and endTime are valid numbers if present
    if (startTime && Number.isNaN(startTimeNum!)) {
      return new Response(JSON.stringify({ error: "startTime must be a valid number" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    if (endTime && Number.isNaN(endTimeNum!)) {
      return new Response(JSON.stringify({ error: "endTime must be a valid number" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    // Convert chainId to number and validate it's a supported chain
    const chainIdNum = Number(chainId);
    if (!Number.isInteger(chainIdNum)) {
      return new Response(JSON.stringify({ error: "chainId must be a valid number" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    // `limit=0` (or negative) means uncapped — the full-history escape hatch.
    const limitNum = limitParam === null ? DEFAULT_LIMIT : Number.parseInt(limitParam, 10);
    if (limitParam !== null && Number.isNaN(limitNum)) {
      return new Response(JSON.stringify({ error: "limit must be a valid number" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    const { transactions, truncated } = await getTransactions(
      account as Address,
      chainIdNum as SupportedChain,
      startTimeNum,
      endTimeNum,
      eventType || undefined,
      limitNum,
    );

    return new Response(JSON.stringify(transactions), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        // Response stays a bare array (documented in integration-docs/8-api.md); truncation
        // rides on a header so the shape doesn't break for existing consumers.
        "X-History-Truncated": truncated ? "true" : "false",
        "Access-Control-Expose-Headers": "X-History-Truncated",
        "Cache-Control": "public, max-age=60",
      },
    });
  } catch (e) {
    console.log(e);
    return new Response(JSON.stringify({ error: e.message || "Internal server error" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
};
