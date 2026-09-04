import type { MarketDataMapping, SupportedChain, TransactionData } from "@seer-pm/sdk";
import type { Market } from "@seer-pm/sdk/market-types";
import { type Address, isAddress } from "viem";
import { fetchLastActivityTimestampForWallets, supportedChainIds } from "./utils/accountLastActivity";
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
import { type PortfolioIdentity, resolvePortfolioIdentity } from "./utils/portfolioIdentity";
import { conditionalEventsToTransactions, fetchConditionalEventsForAccount } from "./utils/seerIndexerPortfolio";
import { fetchAccountDexTransactions } from "./utils/transactions/fetchAccountDexEvents";

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
    {
      name: "dex",
      promise: mappings ? fetchAccountDexTransactions(mappings, account, chainId) : Promise.resolve([]),
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

/**
 * One chain's rows for every wallet in the set, merged.
 *
 * The market universe and the token mappings are resolved once over the union rather than per
 * wallet: `getMappingsCached` keys off the exact sorted market id set, so two wallets with
 * different sets would each miss the cache and pay a full `getMappings` RPC pass.
 */
async function getTransactions(
  wallets: Address[],
  chainId: SupportedChain,
): Promise<{ transactions: TransactionData[]; failedWallets: Address[]; okWallets: number }> {
  const started = Date.now();
  // Per wallet, so one executor's failed market load degrades the merged view instead of failing
  // the chain. A failed `getMappingsCached` below is chain-wide and does reject.
  const marketResults = await Promise.allSettled(wallets.map((wallet) => loadAccountMarkets(wallet, chainId)));
  const failedWallets: Address[] = [];
  const ok: { wallet: Address; markets: Market[] }[] = [];
  marketResults.forEach((result, index) => {
    if (result.status === "fulfilled") {
      ok.push({ wallet: wallets[index], markets: result.value });
    } else {
      failedWallets.push(wallets[index]);
      console.warn("get-transactions: wallet market load failed", {
        chainId,
        wallet: wallets[index],
        error: result.reason,
      });
    }
  });

  const markets = [
    ...new Map(ok.flatMap((entry) => entry.markets).map((market) => [market.id.toLowerCase(), market])).values(),
  ];
  const mappings =
    markets.length === 0 ? null : await getMappingsCached(getPublicClientByChainId(chainId), markets, chainId);

  const perWallet = await Promise.all(
    ok.map(async ({ wallet }) => (await getEvents(mappings, wallet, chainId)).map((row) => ({ row, wallet }))),
  );
  const data = perWallet.flat();

  console.log("get-transactions: chain", {
    chainId,
    ms: Date.now() - started,
    wallets: ok.length,
    failedWallets: failedWallets.length,
    markets: markets.length,
    rows: data.length,
  });

  const tokenIdToTokenSymbolMapping = mappings?.tokenIdToTokenSymbolMapping;
  const transactions = data.map(({ row: x, wallet }) => {
    function parseSymbol(tokenAddress?: string) {
      return tokenAddress && tokenIdToTokenSymbolMapping
        ? tokenIdToTokenSymbolMapping[tokenAddress.toLowerCase()]
        : undefined;
    }
    return {
      ...x,
      chainId,
      sourceWallet: wallet,
      collateralSymbol: parseSymbol(x.collateral),
      token0Symbol: x.token0Symbol ?? parseSymbol(x.token0),
      token1Symbol: x.token1Symbol ?? parseSymbol(x.token1),
      tokenInSymbol: x.tokenInSymbol ?? parseSymbol(x.tokenIn),
      tokenOutSymbol: x.tokenOutSymbol ?? parseSymbol(x.tokenOut),
    };
  });
  return { transactions, failedWallets, okWallets: ok.length };
}

/**
 * Identity of a row across the wallets that can both see it.
 *
 * The DEX filter is `origin = w OR recipient = w`, so an executor trade signed by its owner comes
 * back for the owner (as `origin`) and for the executor (as `recipient`) — the same swap, twice.
 * `eventId` is the source row id and settles it exactly; the composite is the fallback for rows
 * that carry none, and is deliberately over-specified rather than under.
 */
function transactionKey(tx: TransactionData): string {
  if (tx.eventId) return `${tx.chainId}:${tx.eventId}`;
  return [
    tx.chainId,
    tx.type,
    tx.transactionHash,
    tx.marketId,
    tx.tokenIn,
    tx.tokenOut,
    tx.amountIn,
    tx.amountOut,
    tx.amount,
    tx.payout,
  ].join("|");
}

/** First occurrence wins. Callers iterate `[account, ...executors]`, so a row both wallets can see
 * is attributed to the account and shows no executor badge. */
function dedupeTransactions(transactions: TransactionData[]): TransactionData[] {
  const seen = new Map<string, TransactionData>();
  for (const tx of transactions) {
    const key = transactionKey(tx);
    if (!seen.has(key)) seen.set(key, tx);
  }
  return [...seen.values()];
}

/**
 * Newest first. The trailing tie-breaks matter now that the list merges several wallets: two of
 * them trading in the same block is an ordinary tie, and this array is what gets frozen into the
 * blob and paginated, so an unstable order would shuffle rows between pages across requests.
 */
function sortTransactions(transactions: TransactionData[]): TransactionData[] {
  return [...transactions].sort(
    (a, b) =>
      (b.timestamp ?? 0) - (a.timestamp ?? 0) ||
      b.blockNumber - a.blockNumber ||
      (a.transactionHash ?? "").localeCompare(b.transactionHash ?? "") ||
      (a.eventId ?? "").localeCompare(b.eventId ?? ""),
  );
}

async function computeAllChainTransactions(
  identity: PortfolioIdentity,
): Promise<{ transactions: TransactionData[]; failures: number }> {
  const chainIds = supportedChainIds();
  const results = await Promise.allSettled(chainIds.map((id) => getTransactions(identity.walletsForChain(id), id)));
  const transactions: TransactionData[] = [];
  let failures = 0;
  let okWallets = 0;
  for (const result of results) {
    if (result.status === "fulfilled") {
      transactions.push(...result.value.transactions);
      // A degraded wallet still counts as a failure so the partial result is never cached.
      failures += result.value.failedWallets.length;
      okWallets += result.value.okWallets;
    } else {
      failures += 1;
      console.warn("get-transactions: chain compute failed", result.reason);
    }
  }
  // Chain-level rejection is no longer the only way to load nothing: `getTransactions` catches its
  // market loads per wallet, so a total indexer outage *fulfills* every chain with an empty list and
  // a full `failedWallets`. Counting the wallets that actually loaded is what separates "this
  // account has no transactions" from "we could not read any of them"; without it the second one
  // renders as an empty history rather than an error. An account with genuinely no rows still
  // counts here — `loadAccountMarkets` resolves to `[]` and the wallet is one that loaded.
  if (results.every((result) => result.status === "rejected") || okWallets === 0) {
    throw new Error("Failed to load transactions on all chains");
  }
  return { transactions: sortTransactions(dedupeTransactions(transactions)), failures };
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

    // The wallet set is a deterministic function of the account, so the cache key stays the account
    // — but freshness must be judged over the whole set, or a wallet that only trades through its
    // executor never invalidates its own cache.
    const identity = await resolvePortfolioIdentity(account);
    // `:v2` marks the executor-merged payload format. Blobs written before executors were merged in
    // hold account-only rows and carry no version of their own, and freshness is a timestamp
    // comparison — so without this they read as fresh and serve the pre-fix view for a further TTL.
    const cacheKey = `${account.toLowerCase()}:v2`;
    const cached = await readJsonBlob<TransactionsCachePayload>(PORTFOLIO_TRANSACTIONS_STORE, cacheKey);
    let lastActivityTs: number | undefined;
    try {
      lastActivityTs = await fetchLastActivityTimestampForWallets(identity.wallets);
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
      const computed = await computeAllChainTransactions(identity);
      transactions = computed.transactions;
      // `identity.complete` because a degraded identity has no executor wallets left to fail: every
      // chain succeeds over the reduced set, `failures` is 0, and the executor-free payload would be
      // frozen for the full TTL — the partial result the identity contract says not to freeze.
      if (computed.failures === 0 && identity.complete && lastActivityTs !== undefined) {
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
