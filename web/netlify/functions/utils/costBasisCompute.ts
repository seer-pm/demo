import type { Market, SupportedChain, Token, TransactionData } from "@seer-pm/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";
import { type Address, formatUnits, zeroAddress } from "viem";
import { type TokenBasis, foldCostBasisLedger } from "./costBasis";
import { type CostBasisEventBuild, type PriceRequest, buildCostBasisEvents } from "./costBasisEvents";
import { getHistoryTokensPricesForPortfolio } from "./dexPoolHourPrices";
import { type OutcomePriceToken, settledPayoutRatios } from "./outcomePrices";
import type { ConditionalEventRow, OutcomeTransferRow } from "./seerIndexerPortfolio";
import type { Database } from "./supabase";

/**
 * Cost basis for one wallet on one chain, from the data the P/L compute already holds.
 *
 * The only I/O here is the pool-price lookups a split or an external transfer-in needs at its own
 * moment. Candles are hourly, so requests are grouped by hour and each hour costs one lookup over
 * the tokens asked for plus their parent chain (a conditional is priced through its parent, and the
 * lookup resolves parents first). A wallet with more split-hours than `MAX_PRICE_LOOKUPS` keeps
 * the newest ones priced and leaves the rest to the 1/N fallback, which the row then says.
 */

/**
 * Each lookup is one Supabase RPC of roughly a quarter second. A trader has a handful of split
 * hours; a market maker seeding every market it quotes has hundreds, and the newest ones (the
 * positions still open) are the ones worth the budget. Overridable so a one-off backfill can
 * afford more than the scheduled job.
 */
export const MAX_PRICE_LOOKUPS = Number(process.env.COST_BASIS_MAX_PRICE_LOOKUPS) || 400;
const PRICE_LOOKUP_CONCURRENCY = 6;
const HOUR = 3600;
/**
 * A split made while seeding a new market precedes its first candle. The pool is normally priced
 * within the day at the odds the seeder intended, so a request with no candle before it is retried
 * at the first candle up to this long after it before falling back to even weights.
 */
const FORWARD_LOOKUP_SECONDS = 24 * HOUR;
const OUTCOME_DECIMALS = 18;
/** Below this, a difference between the folded quantity and the indexed balance is float noise. */
const RECONCILE_ABSOLUTE = 1e-6;
/** Above this share of the larger side, the fold missed something and the row says so. */
const RECONCILE_RELATIVE = 0.005;

export type CostBasisTokenRow = TokenBasis & { marketId: string; tokenIndex: number };

export type CostBasisResult = {
  tokens: CostBasisTokenRow[];
  /** Averages recorded for hand-overs to other wallets of the identity, keyed `txHash:logIndex`. */
  handoffs: Map<string, number>;
  /** The transfer scan hit its page cap: every row is approximate. */
  truncated: boolean;
  stats: CostBasisEventBuild["stats"] & {
    priceLookups: number;
    priceLookupsSkipped: number;
    reconciliationMisses: number;
  };
};

export type CostBasisComputeArgs = {
  supabase: SupabaseClient<Database>;
  account: Address;
  chainId: SupportedChain;
  markets: Market[];
  swaps: TransactionData[];
  mints: TransactionData[];
  burns: TransactionData[];
  conditionalEvents: ConditionalEventRow[];
  transfers: { rows: OutcomeTransferRow[]; truncated: boolean };
  /** Head balances per lowercased token, in wei, as the positions were built from. */
  holdings: ReadonlyMap<string, bigint>;
  primaryCollateral: Token;
  identityWallets: ReadonlySet<string>;
  handoffs?: ReadonlyMap<string, number>;
};

function isRoot(market: Market): boolean {
  const parent = market.parentMarket?.id;
  return !parent || parent.toLowerCase() === zeroAddress;
}

/**
 * Price inputs for the requested tokens and every parent outcome above them, parents first, which
 * is the order the price mapper needs.
 */
export function priceInputsForTokens(
  tokenIds: Iterable<string>,
  markets: Market[],
): { inputs: OutcomePriceToken[]; markets: Market[] } {
  const marketsById = new Map(markets.map((market) => [market.id.toLowerCase(), market]));
  const marketOfToken = new Map<string, Market>();
  for (const market of markets) {
    for (const token of market.wrappedTokens) marketOfToken.set(token.toLowerCase(), market);
  }
  const depthOf = (market: Market): number => {
    let depth = 0;
    let current: Market | undefined = market;
    while (current && !isRoot(current) && depth < 8) {
      current = marketsById.get(current.parentMarket.id.toLowerCase());
      depth += 1;
    }
    return depth;
  };

  const wanted = new Map<string, Market>();
  for (const tokenId of tokenIds) {
    let token = tokenId.toLowerCase();
    for (let hop = 0; hop < 8; hop++) {
      const market = marketOfToken.get(token);
      if (!market || wanted.has(token)) break;
      wanted.set(token, market);
      if (isRoot(market)) break;
      token = market.collateralToken.toLowerCase();
    }
  }
  const ordered = [...wanted].sort(([, a], [, b]) => depthOf(a) - depthOf(b));
  return {
    inputs: ordered.map(([tokenId, market]) => ({
      tokenId,
      collateralToken: market.collateralToken.toLowerCase(),
      parentMarketId: isRoot(market) ? undefined : market.parentMarket.id.toLowerCase(),
    })),
    markets: [...new Set(ordered.map(([, market]) => market))],
  };
}

async function runWithConcurrency<T>(items: readonly T[], limit: number, run: (item: T) => Promise<void>) {
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const item = items[next++];
      await run(item);
    }
  });
  await Promise.all(workers);
}

function groupByHour(requests: readonly PriceRequest[], offset: number): Map<number, PriceRequest[]> {
  const byHour = new Map<number, PriceRequest[]>();
  for (const request of requests) {
    const hour = Math.floor((request.timestamp + offset) / HOUR) * HOUR;
    const list = byHour.get(hour);
    if (list) list.push(request);
    else byHour.set(hour, [request]);
  }
  return byHour;
}

async function lookupPrices(args: CostBasisComputeArgs, group: PriceRequest[], at: number) {
  const { inputs, markets } = priceInputsForTokens(
    group.flatMap((request) => request.tokenIds),
    args.markets,
  );
  if (inputs.length === 0) return {};
  return getHistoryTokensPricesForPortfolio(args.supabase, inputs, args.chainId, at, settledPayoutRatios(markets, at));
}

async function resolvePriceRequests(
  args: CostBasisComputeArgs,
  requests: PriceRequest[],
): Promise<{ lookups: number; skipped: number }> {
  let lookups = 0;
  let skipped = 0;
  const now = Math.floor(Date.now() / 1000);
  const byHour = groupByHour(requests, 0);
  // Newest first, and each hour is settled (candle before, then the candle up to a day after)
  // before the next is started: when the budget runs out it is whole old splits, mostly closed by
  // now, that fall back to even weights, not the retry of every split at once.
  const hours = [...byHour.keys()].sort((a, b) => b - a);
  const unpriced: PriceRequest[] = [];
  await runWithConcurrency(hours, PRICE_LOOKUP_CONCURRENCY, async (hour) => {
    let pending = byHour.get(hour)!;
    for (const at of [hour, hour + FORWARD_LOOKUP_SECONDS]) {
      if (pending.length === 0) return;
      if (lookups >= MAX_PRICE_LOOKUPS || at > now) {
        skipped += 1;
        break;
      }
      lookups += 1;
      const prices = await lookupPrices(args, pending, at);
      pending = pending.filter((request) => !request.apply(prices));
    }
    unpriced.push(...pending);
  });
  for (const request of unpriced) request.onUnpriced?.();
  return { lookups, skipped };
}

export async function computeCostBasis(args: CostBasisComputeArgs): Promise<CostBasisResult> {
  const build = buildCostBasisEvents({
    account: args.account,
    chainId: args.chainId,
    markets: args.markets,
    swaps: args.swaps,
    mints: args.mints,
    burns: args.burns,
    conditionalEvents: args.conditionalEvents,
    transfers: args.transfers.rows,
    primaryCollateral: args.primaryCollateral,
    identityWallets: args.identityWallets,
    handoffs: args.handoffs,
  });
  const { lookups, skipped } = await resolvePriceRequests(args, build.priceRequests);

  const ledger = foldCostBasisLedger(build.events);
  const refs = new Map<string, { marketId: string; tokenIndex: number }>();
  for (const market of args.markets) {
    market.wrappedTokens.forEach((token, tokenIndex) =>
      refs.set(token.toLowerCase(), { marketId: market.id.toLowerCase(), tokenIndex }),
    );
  }

  let reconciliationMisses = 0;
  const tokens: CostBasisTokenRow[] = [];
  for (const [tokenId, basis] of ledger.snapshot()) {
    const ref = refs.get(tokenId);
    if (!ref) continue;
    let approximate = basis.approximate || args.transfers.truncated || build.approximateTokens.has(tokenId);
    // A token inside an AMM position is not in the wallet balance, so only tokens that never went
    // into a pool can be checked against what the indexer says the wallet holds.
    if (!basis.lpTouched) {
      const held = Number(formatUnits(args.holdings.get(tokenId) ?? 0n, OUTCOME_DECIMALS));
      const gap = Math.abs(held - basis.quantity);
      if (gap > RECONCILE_ABSOLUTE && gap > RECONCILE_RELATIVE * Math.max(held, basis.quantity)) {
        approximate = true;
        reconciliationMisses += 1;
      }
    }
    tokens.push({ ...basis, approximate, marketId: ref.marketId, tokenIndex: ref.tokenIndex });
  }

  return {
    tokens,
    handoffs: ledger.handoffs,
    truncated: args.transfers.truncated,
    stats: { ...build.stats, priceLookups: lookups, priceLookupsSkipped: skipped, reconciliationMisses },
  };
}
