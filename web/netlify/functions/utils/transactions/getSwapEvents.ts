import { gnosis } from "@/lib/chains";
import {
  ALL_SUPPORTED_CHAIN_IDS,
  OrderBookApi,
  OrderBookApiError,
  type SupportedChainId,
  type Trade,
} from "@cowprotocol/cow-sdk";
import { getStore } from "@netlify/blobs";
import type { MarketDataMapping, SupportedChain, TransactionData } from "@seer-pm/sdk";
import { getCollateralSymbol, getCollateralTokenForSwap } from "@seer-pm/sdk/collateral";
import { getTokensPairKey } from "@seer-pm/sdk/market-pools";
import { swaprGraphQLClient, uniswapGraphQLClient } from "@seer-pm/sdk/subgraph";
import { type GetSwapsQuery, OrderDirection, Swap_OrderBy, getSdk as getSwaprSdk } from "@seer-pm/sdk/subgraph/swapr";
import { getSdk as getUniswapSdk } from "@seer-pm/sdk/subgraph/uniswap";
import { type Address, parseUnits } from "viem";
import { getBlock } from "viem/actions";
import { getPublicClientByChainId } from "../config";
import { getCollateralFromDexTx } from "../markets";
import { paginateByTimestampId } from "./subgraphTimestampIdPagination";

const COWSWAP_OWNER_TRADES_STORE = "cowswap-owner-trades";
/** Permanent historical CoW trades snapshot per chain + owner (Netlify Blobs). Filter by markets on read. */

const COW_ORDER_BOOK_CHAIN_IDS = new Set<number>(ALL_SUPPORTED_CHAIN_IDS);

/** Own Retry-After loop; disable SDK multi-attempt spam inside the CloudFront block window. */
const COW_TRADES_MAX_ATTEMPTS = 8;
const COW_RETRY_AFTER_DEFAULT_MS = 30_000;
const COW_RETRY_AFTER_MIN_MS = 1_000;
const COW_RETRY_AFTER_MAX_MS = 60_000;
const COW_RETRY_AFTER_BUFFER_MS = 1_000;
/** Pace successful CoW calls so cold leaderboard runs don't slam the public quota. */
const COW_MIN_INTERVAL_MS = 400;
/**
 * After exhausting retries on 429, skip further CoW API calls for this long so a leaderboard
 * invoke doesn't burn the time budget on Retry-After sleeps × N wallets.
 */
const COW_CIRCUIT_OPEN_MS = 60_000;
/** Cap total wall-clock spent in the CoW retry loop (including Retry-After waits). */
const COW_TRADES_WALL_CLOCK_MS = 90_000;
const BLOCK_TIMESTAMP_CONCURRENCY = 12;

let cowTradesCooldownUntilMs = 0;
let cowTradesNextSlotMs = 0;
let cowTradesCircuitOpenUntilMs = 0;
let cowTradesChain: Promise<unknown> = Promise.resolve();
const orderBookApiByChain = new Map<SupportedChainId, OrderBookApi>();

/** Blob payload: prefer raw `trades` (filter on read). Legacy `cowSwaps` kept for backward compat. */
type CowswapTradesCachePayload = {
  cachedAt: number;
  trades?: Trade[];
  /** @deprecated Filtered rows from older writers; used only when `trades` is absent. */
  cowSwaps?: TransactionData[];
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function mapPool<T, R>(items: T[], concurrency: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) || 0 }, async () => {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]);
    }
  });
  await Promise.all(workers);
  return results;
}

function getOrderBookApi(chainId: SupportedChainId): OrderBookApi {
  let api = orderBookApiByChain.get(chainId);
  if (!api) {
    api = new OrderBookApi({
      chainId,
      // One attempt per call; we honor Retry-After ourselves instead of SDK fast retries.
      backoffOpts: { numOfAttempts: 1 },
    });
    orderBookApiByChain.set(chainId, api);
  }
  return api;
}

function isCowRateLimitError(error: unknown): boolean {
  if (error instanceof OrderBookApiError) {
    return error.response.status === 429;
  }
  // biome-ignore lint/suspicious/noExplicitAny: fallback for non-instanceof SDK errors across bundles
  return (error as any)?.response?.status === 429;
}

function parseRetryAfterMs(error: unknown): number {
  let header: string | null | undefined;
  if (error instanceof OrderBookApiError) {
    header = error.response.headers.get("retry-after");
  } else {
    // biome-ignore lint/suspicious/noExplicitAny: fallback for non-instanceof SDK errors across bundles
    header = (error as any)?.response?.headers?.get?.("retry-after");
  }
  const seconds = header != null ? Number(header) : Number.NaN;
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return COW_RETRY_AFTER_DEFAULT_MS;
  }
  return Math.min(COW_RETRY_AFTER_MAX_MS, Math.max(COW_RETRY_AFTER_MIN_MS, Math.ceil(seconds * 1000)));
}

function extendCowTradesCooldown(retryAfterMs: number): void {
  const until = Date.now() + retryAfterMs + COW_RETRY_AFTER_BUFFER_MS;
  cowTradesCooldownUntilMs = Math.max(cowTradesCooldownUntilMs, until);
  // Don't schedule the next paced slot before the cooldown ends.
  cowTradesNextSlotMs = Math.max(cowTradesNextSlotMs, until);
}

/** Serialize CoW Order Book calls and pace them under a minimum interval. */
async function acquireCowTradesSlot(): Promise<void> {
  const run = cowTradesChain.then(async () => {
    const now = Date.now();
    const waitMs = Math.max(0, Math.max(cowTradesCooldownUntilMs, cowTradesNextSlotMs) - now);
    cowTradesNextSlotMs = Math.max(now, cowTradesNextSlotMs, cowTradesCooldownUntilMs) + COW_MIN_INTERVAL_MS;
    if (waitMs > 0) await sleep(waitMs);
  });
  cowTradesChain = run.catch(() => {});
  await run;
}

function isCowTradesCircuitOpen(): boolean {
  return Date.now() < cowTradesCircuitOpenUntilMs;
}

function openCowTradesCircuit(reason: string): void {
  cowTradesCircuitOpenUntilMs = Math.max(
    cowTradesCircuitOpenUntilMs,
    Date.now() + COW_CIRCUIT_OPEN_MS,
    cowTradesCooldownUntilMs,
  );
  console.warn("cow-trades: opening circuit", {
    reason,
    openUntilMs: cowTradesCircuitOpenUntilMs,
    skipForMs: cowTradesCircuitOpenUntilMs - Date.now(),
  });
}

async function getTradesWithRetry(owner: Address, chainId: SupportedChainId): Promise<Trade[]> {
  const api = getOrderBookApi(chainId);
  let lastError: unknown;
  const startedAt = Date.now();

  for (let attempt = 1; attempt <= COW_TRADES_MAX_ATTEMPTS; attempt++) {
    if (Date.now() - startedAt >= COW_TRADES_WALL_CLOCK_MS) {
      openCowTradesCircuit("wall-clock budget exceeded");
      throw lastError instanceof Error ? lastError : new Error("cow-trades: wall-clock budget exceeded");
    }

    await acquireCowTradesSlot();
    try {
      return await api.getTrades({ owner });
    } catch (error) {
      lastError = error;
      if (!isCowRateLimitError(error)) {
        throw error;
      }
      const retryAfterMs = parseRetryAfterMs(error);
      extendCowTradesCooldown(retryAfterMs);
      console.warn("cow-trades: rate limited", { owner, chainId, retryAfterMs, attempt });
      if (attempt === COW_TRADES_MAX_ATTEMPTS) {
        openCowTradesCircuit("exhausted 429 retries");
        throw error;
      }
      if (Date.now() - startedAt + retryAfterMs >= COW_TRADES_WALL_CLOCK_MS) {
        openCowTradesCircuit("wall-clock budget exceeded before retry");
        throw error;
      }
      // Slot acquisition on the next attempt honors the extended cooldown.
    }
  }

  throw lastError;
}

function mapTradesToCowSwaps(
  trades: Trade[],
  mappings: MarketDataMapping,
  chainId: SupportedChain,
  account: Address,
): Omit<TransactionData, "timestamp">[] {
  const { tokenPairToMarketMapping } = mappings;
  return trades.reduce(
    (acc, trade) => {
      const tokenIn = getCollateralTokenForSwap(trade.sellToken as Address, chainId);
      const tokenOut = getCollateralTokenForSwap(trade.buyToken as Address, chainId);
      const tokenInSymbol = getCollateralSymbol(trade.sellToken as Address, account, trade.owner as Address, chainId);
      const tokenOutSymbol = getCollateralSymbol(trade.buyToken as Address, account, trade.owner as Address, chainId);
      const market = tokenPairToMarketMapping[getTokensPairKey(tokenIn, tokenOut)];
      if (market) {
        acc.push({
          tokenIn,
          tokenOut,
          amountIn: trade.sellAmount,
          amountOut: trade.buyAmount,
          blockNumber: trade.blockNumber,
          marketName: market.marketName,
          marketId: market.id,
          type: "swap",
          collateral: getCollateralFromDexTx(market, tokenIn as Address, tokenOut as Address),
          transactionHash: trade.txHash ?? undefined,
          tokenInSymbol,
          tokenOutSymbol,
        });
      }
      return acc;
    },
    [] as Omit<TransactionData, "timestamp">[],
  );
}

async function attachBlockTimestamps(
  cowSwapsPartial: Omit<TransactionData, "timestamp">[],
  chainId: SupportedChain,
): Promise<TransactionData[]> {
  const uniqueBlocks = [...new Set(cowSwapsPartial.map((s) => s.blockNumber))];
  const client = getPublicClientByChainId(chainId);
  const pairs = await mapPool(uniqueBlocks, BLOCK_TIMESTAMP_CONCURRENCY, async (bn) => {
    const block = await getBlock(client, { blockNumber: BigInt(bn) });
    return [bn, Number(block.timestamp)] as const;
  });
  const timestampByBlock = new Map<number, number>(pairs);

  return cowSwapsPartial.map((s) => ({
    ...s,
    timestamp: timestampByBlock.get(s.blockNumber) ?? 0,
  }));
}

async function getCowswapSwapsCached(
  mappings: MarketDataMapping,
  chainId: SupportedChain,
  account: Address,
): Promise<TransactionData[]> {
  // CoW Order Book has no API base URL for some Seer chains (e.g. Optimism); skip to avoid
  // `undefined/api/v1/trades` fetch failures that would reject the whole getSwapEvents Promise.all.
  if (!COW_ORDER_BOOK_CHAIN_IDS.has(chainId)) {
    return [];
  }

  const cacheKey = `${chainId}:${account.toLowerCase()}`;
  console.log({
    name: COWSWAP_OWNER_TRADES_STORE,
    siteID: process.env.NETLIFY_SITE_ID,
    token: process.env.NETLIFY_BLOBS_TOKEN,
  });
  try {
    const store = getStore({
      name: COWSWAP_OWNER_TRADES_STORE,
      siteID: process.env.NETLIFY_SITE_ID,
      token: process.env.NETLIFY_BLOBS_TOKEN,
    });
    const cached = (await store.get(cacheKey, { type: "json" })) as CowswapTradesCachePayload | null;

    if (cached && Array.isArray(cached.trades)) {
      const cowSwapsPartial = mapTradesToCowSwaps(cached.trades, mappings, chainId, account);
      return await attachBlockTimestamps(cowSwapsPartial, chainId);
    }

    // Legacy filtered snapshot: avoid mass CoW refetch on deploy. New writes use `trades`.
    if (cached && Array.isArray(cached.cowSwaps)) {
      return cached.cowSwaps;
    }

    if (isCowTradesCircuitOpen()) {
      console.warn("cow-trades: circuit open, skipping API (DEX swaps still returned)", {
        owner: account,
        chainId,
        skipForMs: cowTradesCircuitOpenUntilMs - Date.now(),
      });
      return [];
    }

    const trades = await getTradesWithRetry(account, chainId as SupportedChainId);
    await store.setJSON(cacheKey, { cachedAt: Date.now(), trades } satisfies CowswapTradesCachePayload);

    const cowSwapsPartial = mapTradesToCowSwaps(trades, mappings, chainId, account);
    return await attachBlockTimestamps(cowSwapsPartial, chainId);
  } catch (error) {
    // Don't fail getSwapEvents / DEX legs when CoW is unavailable.
    console.warn("cow-trades: fetch failed, continuing without CoW swaps", {
      owner: account,
      chainId,
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}

async function fetchSwapsFromSubgraph(account: string, chainId: SupportedChain, startTime?: number, endTime?: number) {
  const graphQLClient = chainId === gnosis.id ? swaprGraphQLClient(chainId, "algebra") : uniswapGraphQLClient(chainId);

  if (!graphQLClient) {
    throw new Error("Subgraph not available");
  }

  const graphQLSdk = chainId === gnosis.id ? getSwaprSdk : getUniswapSdk;
  const accountLc = account.toLowerCase() as Address;

  // Single stream: origin OR recipient, with (timestamp, id) cursor via shared helper.
  return paginateByTimestampId<GetSwapsQuery["swaps"][number]>({
    startTime,
    endTime,
    accountFilters: [{ origin: accountLc }, { recipient: accountLc }],
    fetchPage: async (where, first) => {
      const data = await graphQLSdk(graphQLClient).GetSwaps({
        first,
        // biome-ignore lint/suspicious/noExplicitAny:
        orderBy: Swap_OrderBy.Timestamp as any,
        // biome-ignore lint/suspicious/noExplicitAny:
        orderDirection: OrderDirection.Desc as any,
        // biome-ignore lint/suspicious/noExplicitAny:
        where: where as any,
      });
      return data.swaps as GetSwapsQuery["swaps"];
    },
  });
}

export async function getSwapEvents(
  mappings: MarketDataMapping,
  account: Address,
  chainId: SupportedChain,
  startTime?: number,
  endTime?: number,
) {
  const { outcomeTokenToCollateral, tokenPairToMarketMapping } = mappings;
  if (outcomeTokenToCollateral.size === 0) {
    return [];
  }

  const [dexSwaps, cowSwaps] = await Promise.all([
    fetchSwapsFromSubgraph(account, chainId, startTime, endTime),
    getCowswapSwapsCached(mappings, chainId, account),
  ]);

  const swapsFromSubgraph = dexSwaps.reduce((acc, swap) => {
    const amount0 = parseUnits(swap.amount0.replace("-", ""), Number(swap.token0.decimals));
    const amount1 = parseUnits(swap.amount1.replace("-", ""), Number(swap.token1.decimals));
    const tokenIn = Number(swap.amount1) < 0 ? swap.token0.id : swap.token1.id;
    const tokenOut = Number(swap.amount1) < 0 ? swap.token1.id : swap.token0.id;
    const market = tokenPairToMarketMapping[getTokensPairKey(tokenIn, tokenOut)];
    if (market) {
      acc.push({
        tokenIn,
        tokenOut,
        amountIn: tokenIn.toLocaleLowerCase() > tokenOut.toLocaleLowerCase() ? amount1.toString() : amount0.toString(),
        amountOut: tokenIn.toLocaleLowerCase() > tokenOut.toLocaleLowerCase() ? amount0.toString() : amount1.toString(),
        tokenInSymbol:
          tokenIn.toLocaleLowerCase() > tokenOut.toLocaleLowerCase() ? swap.token1.symbol : swap.token0.symbol,
        tokenOutSymbol:
          tokenIn.toLocaleLowerCase() > tokenOut.toLocaleLowerCase() ? swap.token0.symbol : swap.token1.symbol,
        blockNumber: Number(swap.transaction.blockNumber),
        timestamp: Number(swap.timestamp),
        marketName: market.marketName,
        marketId: market.id,
        type: "swap",
        collateral: getCollateralFromDexTx(market, tokenIn as Address, tokenOut as Address),
        transactionHash: swap.transaction.id,
      });
    }
    return acc;
  }, [] as TransactionData[]);

  return swapsFromSubgraph.concat(cowSwaps);
}
