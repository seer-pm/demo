import type { MarketDataMapping, SupportedChain, TransactionData } from "@seer-pm/sdk";
import { type Address, isAddress } from "viem";
import { fetchLastActivityTimestamp, supportedChainIds } from "./utils/accountLastActivity";
import { loadAccountMarkets } from "./utils/accountMarkets";
import { getPublicClientByChainId } from "./utils/config";
import { getMappingsCached } from "./utils/mappingsCache";
import { parseChainIdQueryParam } from "./utils/parseChainIdParam";
import {
  type ActivityCachedPayload,
  isActivityCacheFresh,
  readJsonBlob,
  writeJsonBlob,
} from "./utils/portfolioBlobCache";
import { conditionalEventsToTransactions, fetchConditionalEventsForAccount } from "./utils/seerIndexerPortfolio";
import { getLiquidityEvents } from "./utils/transactions/getLiquidityEvents";
import { getLiquidityWithdrawEvents } from "./utils/transactions/getLiquidityWithdrawEvents";
import { getSwapEvents } from "./utils/transactions/getSwapEvents";

const PORTFOLIO_TRANSACTIONS_STORE = "portfolio-transactions";

type TransactionsCachePayload = ActivityCachedPayload<{ transactions: TransactionData[] }>;

const EVENT_TYPE_GROUPS = {
  swap: new Set<TransactionData["type"]>(["swap", "bought", "sold"]),
  lp: new Set<TransactionData["type"]>(["lp", "lp-burn"]),
  ctf: new Set<TransactionData["type"]>(["split", "merge", "redeem"]),
};

type EventTypeFilter = keyof typeof EVENT_TYPE_GROUPS;

function isEventTypeFilter(value: string): value is EventTypeFilter {
  return value in EVENT_TYPE_GROUPS;
}

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

async function getEvents(mappings: MarketDataMapping | null, account: Address, chainId: SupportedChain) {
  const sources: { name: string; promise: Promise<TransactionData[]> }[] = [
    { name: "swap", promise: mappings ? getSwapEvents(mappings, account, chainId) : Promise.resolve([]) },
    { name: "liquidity", promise: mappings ? getLiquidityEvents(mappings, account, chainId) : Promise.resolve([]) },
    {
      name: "liquidity-withdraw",
      promise: mappings ? getLiquidityWithdrawEvents(mappings, account, chainId) : Promise.resolve([]),
    },
    {
      name: "conditional",
      promise: fetchConditionalEventsForAccount(account, chainId).then(conditionalEventsToTransactions),
    },
  ];
  const results = await Promise.allSettled(sources.map((s) => s.promise));
  const events: TransactionData[] = [];
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (result.status === "fulfilled") {
      events.push(...result.value);
    } else {
      console.warn("get-transactions: event source failed", {
        source: sources[i].name,
        chainId,
        error: result.reason instanceof Error ? result.reason.message : String(result.reason),
      });
    }
  }
  return events;
}

async function getTransactions(account: Address, chainId: SupportedChain): Promise<TransactionData[]> {
  const started = Date.now();
  const markets = await loadAccountMarkets(account, chainId);
  const mappings =
    markets.length === 0 ? null : await getMappingsCached(getPublicClientByChainId(chainId), markets, chainId);

  const data = await getEvents(mappings, account, chainId);

  console.log("get-transactions: chain", {
    chainId,
    ms: Date.now() - started,
    markets: markets.length,
    rows: data.length,
  });

  const tokenIdToTokenSymbolMapping = mappings?.tokenIdToTokenSymbolMapping;
  return data.map((x) => {
    function parseSymbol(tokenAddress?: string) {
      return tokenAddress && tokenIdToTokenSymbolMapping
        ? tokenIdToTokenSymbolMapping[tokenAddress.toLowerCase()]
        : undefined;
    }
    return {
      ...x,
      chainId,
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

async function computeAllChainTransactions(
  account: Address,
): Promise<{ transactions: TransactionData[]; failures: number }> {
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
  return { transactions: sortTransactions(transactions), failures };
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

    if (eventType && !isEventTypeFilter(eventType)) {
      return jsonError(`eventType must be one of: ${Object.keys(EVENT_TYPE_GROUPS).join(", ")}`, 400);
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
    const cached = await readJsonBlob<TransactionsCachePayload>(PORTFOLIO_TRANSACTIONS_STORE, cacheKey);
    let lastActivityTs: number | undefined;
    try {
      lastActivityTs = await fetchLastActivityTimestamp(account);
    } catch (e) {
      console.warn("get-transactions: last activity lookup failed", e);
    }

    const activityTsForFreshness = lastActivityTs ?? cached?.lastActivityTs;
    let transactions: TransactionData[];
    if (
      activityTsForFreshness !== undefined &&
      isActivityCacheFresh(cached, activityTsForFreshness) &&
      Array.isArray(cached.transactions)
    ) {
      transactions = cached.transactions;
    } else {
      const computed = await computeAllChainTransactions(account);
      transactions = computed.transactions;
      if (computed.failures === 0 && lastActivityTs !== undefined) {
        await writeJsonBlob(PORTFOLIO_TRANSACTIONS_STORE, cacheKey, {
          cachedAt: Date.now(),
          lastActivityTs,
          transactions,
        } satisfies TransactionsCachePayload);
      }
    }

    return jsonOk(
      filterTransactions(transactions, {
        chainId: chainParsed.chainId,
        startTime: startTimeNum,
        endTime: endTimeNum,
        eventType: eventType && isEventTypeFilter(eventType) ? eventType : undefined,
      }),
    );
  } catch (e) {
    console.log(e);
    return jsonError((e as Error)?.message || "Internal server error", 500);
  }
};
