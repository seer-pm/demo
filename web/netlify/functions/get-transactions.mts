import { type MarketDataMapping, type SupportedChain, type TransactionData, getMappings } from "@seer-pm/sdk";
import type { Market } from "@seer-pm/sdk/market-types";
import { type Address, isAddress } from "viem";
import { getBlock } from "viem/actions";
import { fetchLastActivityTimestamp, supportedChainIds } from "./utils/accountLastActivity";
import { getPublicClientByChainId } from "./utils/config";
import { searchAllMarkets } from "./utils/markets";
import { parseChainIdQueryParam } from "./utils/parseChainIdParam";
import {
  type ActivityCachedPayload,
  isActivityCacheFresh,
  readJsonBlob,
  writeJsonBlob,
} from "./utils/portfolioBlobCache";
import { getLiquidityEvents } from "./utils/transactions/getLiquidityEvents";
import { getLiquidityWithdrawEvents } from "./utils/transactions/getLiquidityWithdrawEvents";
import { getSplitMergeRedeemEvents } from "./utils/transactions/getSplitMergeRedeemEvents";
import { getSwapEvents } from "./utils/transactions/getSwapEvents";

const MARKETS_MAPPINGS_TTL_MS = 15 * 60 * 1000;
const PORTFOLIO_TRANSACTIONS_STORE = "portfolio-transactions";

type TransactionsCachePayload = ActivityCachedPayload<{ transactions: TransactionData[] }>;

type EventTypeFilter = "swap" | "lp" | "ctf";

const EVENT_TYPE_GROUPS: Record<EventTypeFilter, ReadonlySet<TransactionData["type"]>> = {
  swap: new Set(["swap", "bought", "sold"]),
  lp: new Set(["lp", "lp-burn"]),
  ctf: new Set(["split", "merge", "redeem"]),
};

type MarketsMappingsCacheEntry = {
  markets: Market[];
  mappings: MarketDataMapping | null;
  expiresAt: number;
};

const marketsMappingsByChain = new Map<number, MarketsMappingsCacheEntry>();
const marketsMappingsInflight = new Map<number, Promise<MarketsMappingsCacheEntry>>();

function jsonError(error: string, status: number) {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function jsonOk(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

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
  const maxAttempts = 10;
  let attempts = 0;
  const client = getPublicClientByChainId(chainId);

  while (attempts < maxAttempts) {
    try {
      const block = await getBlock(client, { blockNumber: BigInt(blockNumber) });
      if (block.timestamp) {
        return Number(block.timestamp);
      }
      blockNumber++;
      attempts++;
    } catch {
      blockNumber++;
      attempts++;
    }
  }
}

async function getEvents(mappings: MarketDataMapping, account: Address, chainId: SupportedChain) {
  const events = await Promise.all([
    getSwapEvents(mappings, account, chainId),
    getLiquidityEvents(mappings, account, chainId),
    getLiquidityWithdrawEvents(mappings, account, chainId),
    getSplitMergeRedeemEvents(account, chainId),
  ]);
  return events.flat();
}

async function getTransactions(account: Address, chainId: SupportedChain): Promise<TransactionData[]> {
  const { markets, mappings } = await getMarketsAndMappings(chainId);

  if (markets.length === 0 || !mappings) {
    return [];
  }

  const { tokenIdToTokenSymbolMapping } = mappings;
  const data = await getEvents(mappings, account, chainId);
  const timestamps = await Promise.all(data.map((x) => x.timestamp ?? getBlockTimestamp(chainId, x.blockNumber)));

  return data.map((x, index) => {
    function parseSymbol(tokenAddress?: string) {
      return tokenAddress ? tokenIdToTokenSymbolMapping[tokenAddress.toLocaleLowerCase()] : undefined;
    }
    return {
      ...x,
      chainId,
      timestamp: timestamps[index],
      collateralSymbol: parseSymbol(x.collateral),
      token0Symbol: x.token0Symbol ?? parseSymbol(x.token0),
      token1Symbol: x.token1Symbol ?? parseSymbol(x.token1),
      tokenInSymbol: x.tokenInSymbol ?? parseSymbol(x.tokenIn),
      tokenOutSymbol: x.tokenOutSymbol ?? parseSymbol(x.tokenOut),
    };
  });
}

function sortTransactions(transactions: TransactionData[]): TransactionData[] {
  return [...transactions].sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0) || b.blockNumber - a.blockNumber);
}

async function computeAllChainTransactions(account: Address): Promise<TransactionData[]> {
  const results = await Promise.allSettled(supportedChainIds().map((id) => getTransactions(account, id)));
  const transactions: TransactionData[] = [];
  let failures = 0;
  for (const result of results) {
    if (result.status === "fulfilled") {
      transactions.push(...result.value);
    } else {
      failures += 1;
      console.warn("get-transactions: chain compute failed", result.reason);
    }
  }
  if (failures === results.length) {
    throw new Error("Failed to load transactions on all chains");
  }
  return sortTransactions(transactions);
}

function filterTransactions(
  transactions: TransactionData[],
  opts: {
    chainId: number | "all";
    startTime?: number;
    endTime?: number;
    eventType?: EventTypeFilter;
  },
): TransactionData[] {
  return transactions.filter((tx) => {
    if (opts.chainId !== "all" && tx.chainId !== opts.chainId) return false;
    if (opts.eventType && !EVENT_TYPE_GROUPS[opts.eventType].has(tx.type)) return false;
    if (opts.startTime != null || opts.endTime != null) {
      const ts = tx.timestamp;
      if (ts == null || !Number.isFinite(ts)) return false;
      if (opts.startTime != null && ts < opts.startTime) return false;
      if (opts.endTime != null && ts > opts.endTime) return false;
    }
    return true;
  });
}

export default async (req: Request) => {
  try {
    const url = new URL(req.url);
    const accountParam = url.searchParams.get("account");
    const eventType = url.searchParams.get("eventType");
    const startTime = url.searchParams.get("startTime");
    const endTime = url.searchParams.get("endTime");

    if (!accountParam || !isAddress(accountParam)) {
      return jsonError("Account parameter is required", 400);
    }
    const account = accountParam as Address;

    const chainParsed = parseChainIdQueryParam(url.searchParams.get("chainId") ?? "all", { allowAll: true });
    if ("error" in chainParsed) {
      return jsonError(chainParsed.error, 400);
    }

    if (eventType && !["swap", "lp", "ctf"].includes(eventType)) {
      return jsonError("eventType must be one of: swap, lp, ctf", 400);
    }

    const startTimeNum = startTime ? Number.parseInt(startTime, 10) : undefined;
    const endTimeNum = endTime ? Number.parseInt(endTime, 10) : undefined;

    if (startTime && Number.isNaN(startTimeNum!)) {
      return jsonError("startTime must be a valid number", 400);
    }
    if (endTime && Number.isNaN(endTimeNum!)) {
      return jsonError("endTime must be a valid number", 400);
    }

    const cacheKey = account.toLowerCase();
    const [cached, lastActivityTs] = await Promise.all([
      readJsonBlob<TransactionsCachePayload>(PORTFOLIO_TRANSACTIONS_STORE, cacheKey),
      fetchLastActivityTimestamp(account),
    ]);

    let transactions: TransactionData[];
    if (isActivityCacheFresh(cached, lastActivityTs) && Array.isArray(cached.transactions)) {
      transactions = cached.transactions;
    } else {
      transactions = await computeAllChainTransactions(account);
      await writeJsonBlob(PORTFOLIO_TRANSACTIONS_STORE, cacheKey, {
        cachedAt: Date.now(),
        lastActivityTs,
        transactions,
      } satisfies TransactionsCachePayload);
    }

    return jsonOk(
      filterTransactions(transactions, {
        chainId: chainParsed.chainId,
        startTime: startTimeNum,
        endTime: endTimeNum,
        eventType: (eventType as EventTypeFilter | null) || undefined,
      }),
    );
  } catch (e) {
    console.log(e);
    return jsonError((e as Error)?.message || "Internal server error", 500);
  }
};
