import type { Market, SupportedChain, Token, TransactionData } from "@seer-pm/sdk";
import { type Address, formatUnits, zeroAddress } from "viem";
import type { BasisEvent, CollateralSide } from "./costBasis";
import { settledPayoutRatios } from "./outcomePrices";
import { type ConditionalEventRow, type OutcomeTransferRow, dedupeConditionalEventLegs } from "./seerIndexerPortfolio";

/**
 * Translates what the P/L compute already fetched for a wallet into cost-basis events.
 *
 * Three sources, three jobs:
 * - DEX and CoW swaps say what was paid or received per outcome token.
 * - Router `ConditionalEvent`s say how much collateral a split locked, a merge released or a
 *   redeem paid out. A redeem does not say which outcome tokens were burned, so that comes from the
 *   outcome transfers in the same transaction.
 * - Outcome transfers that belong to none of those transactions are hand-overs between wallets.
 *
 * Prices are not resolved here. A split and an external transfer-in need a pool price at their
 * own moment, and those lookups are batched per hour by the caller, so each such event comes back
 * as a `PriceRequest` whose `apply` patches the event once the prices are known.
 */

const OUTCOME_DECIMALS = 18;

/** Same test as `marketParentChain.isRootMarket`, kept local so this module stays import-light for tests. */
function isRootMarket(market: Market): boolean {
  const parent = market.parentMarket?.id;
  return !parent || parent.toLowerCase() === zeroAddress;
}

/** Even weights over the real outcomes, with Invalid (the last token of a Generic market) at zero. */
export function fallbackSplitWeights(market: Market): number[] {
  const count = market.wrappedTokens.length;
  const hasInvalid = market.type === "Generic" && count > 1;
  const real = hasInvalid ? count - 1 : count;
  return market.wrappedTokens.map((_, index) => (hasInvalid && index === count - 1 ? 0 : 1 / real));
}

export type PriceRequest = {
  timestamp: number;
  tokenIds: string[];
  /**
   * Prices keyed by lowercased token id, in primary collateral; a missing key means no candle.
   * Returns whether any requested token was priced, so the caller can try a later moment.
   */
  apply: (prices: Record<string, number | undefined>) => boolean;
  /** Called once when no attempt priced the request. */
  onUnpriced?: () => void;
};

export type CostBasisEventSource = {
  account: Address;
  chainId: SupportedChain;
  /** Markets the wallet touched, parents included where they could be loaded. */
  markets: Market[];
  swaps: TransactionData[];
  mints: TransactionData[];
  burns: TransactionData[];
  conditionalEvents: ConditionalEventRow[];
  transfers: OutcomeTransferRow[];
  primaryCollateral: Token;
  /** Every wallet of the account's identity (owner and executors), lowercased. */
  identityWallets: ReadonlySet<string>;
  /** Averages an earlier fold of the identity recorded for hand-overs, keyed `txHash:logIndex`. */
  handoffs?: ReadonlyMap<string, number>;
};

export type CostBasisEventBuild = {
  events: BasisEvent[];
  priceRequests: PriceRequest[];
  /** Tokens whose figures rest on something the sources could not pin down. */
  approximateTokens: Set<string>;
  stats: {
    swapsUnmapped: number;
    redeemsUnresolved: number;
    transfersHandedOver: number;
    transfersIgnored: number;
  };
};

type TokenRef = { market: Market; index: number };

function toNumber(wei: bigint | string, decimals: number): number {
  return Number(formatUnits(typeof wei === "string" ? BigInt(wei) : wei, decimals));
}

/** Log index parsed out of a `ConditionalEvent` id `{chainId}:{txHash}-{logIndex}-{marketEntityId}`. */
export function conditionalEventLogIndex(id: string): number {
  const parsed = Number(id.split("-")[1]);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Log index parsed out of a DEX swap id `{txHash}#{logIndex}`; CoW fills carry none and sort first. */
export function swapLogIndex(eventId: string | undefined): number {
  const parsed = Number(eventId?.split("#")[1]);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function buildCostBasisEvents(source: CostBasisEventSource): CostBasisEventBuild {
  const account = source.account.toLowerCase();
  const primaryLc = source.primaryCollateral.address.toLowerCase();
  const events: BasisEvent[] = [];
  const priceRequests: PriceRequest[] = [];
  const approximateTokens = new Set<string>();
  const stats = { swapsUnmapped: 0, redeemsUnresolved: 0, transfersHandedOver: 0, transfersIgnored: 0 };

  const marketsById = new Map<string, Market>();
  const tokenRefs = new Map<string, TokenRef>();
  for (const market of source.markets) {
    marketsById.set(market.id.toLowerCase(), market);
    market.wrappedTokens.forEach((token, index) => tokenRefs.set(token.toLowerCase(), { market, index }));
  }

  // The side a market settles in. A root market on a collateral other than the primary is priced at
  // zero by the P/L compute and is left out here for the same reason: its costs are in another unit.
  const sideOf = (market: Market): CollateralSide | null => {
    const collateral = market.collateralToken.toLowerCase();
    if (isRootMarket(market)) return collateral === primaryLc ? { kind: "primary" } : null;
    return { kind: "token", tokenId: collateral };
  };
  const sideDecimals = (side: CollateralSide) =>
    side.kind === "primary" ? source.primaryCollateral.decimals : OUTCOME_DECIMALS;
  const sideMatches = (side: CollateralSide, token: string) =>
    side.kind === "primary" ? token === primaryLc : side.tokenId === token;

  for (const swap of source.swaps) {
    const tokenIn = swap.tokenIn?.toLowerCase();
    const tokenOut = swap.tokenOut?.toLowerCase();
    if (!tokenIn || !tokenOut || !swap.amountIn || !swap.amountOut) {
      stats.swapsUnmapped += 1;
      continue;
    }
    const seq = swapLogIndex(swap.eventId);
    const bought = tokenRefs.get(tokenOut);
    const sold = tokenRefs.get(tokenIn);
    const buySide = bought ? sideOf(bought.market) : null;
    const sellSide = sold ? sideOf(sold.market) : null;
    if (bought && buySide && sideMatches(buySide, tokenIn)) {
      events.push({
        kind: "swap",
        timestamp: swap.timestamp,
        seq,
        tokenId: tokenOut,
        tokenAmount: toNumber(swap.amountOut, OUTCOME_DECIMALS),
        collateralAmount: toNumber(swap.amountIn, sideDecimals(buySide)),
        collateral: buySide,
      });
    } else if (sold && sellSide && sideMatches(sellSide, tokenOut)) {
      events.push({
        kind: "swap",
        timestamp: swap.timestamp,
        seq,
        tokenId: tokenIn,
        tokenAmount: -toNumber(swap.amountIn, OUTCOME_DECIMALS),
        collateralAmount: toNumber(swap.amountOut, sideDecimals(sellSide)),
        collateral: sellSide,
      });
    } else {
      stats.swapsUnmapped += 1;
      if (bought) approximateTokens.add(tokenOut);
      if (sold) approximateTokens.add(tokenIn);
    }
  }

  for (const row of [...source.mints, ...source.burns]) {
    for (const token of [row.token0, row.token1]) {
      const lc = token?.toLowerCase();
      if (lc && tokenRefs.has(lc)) events.push({ kind: "lp", timestamp: row.timestamp, seq: 0, tokenId: lc });
    }
  }

  const transfersByTx = new Map<string, OutcomeTransferRow[]>();
  for (const transfer of source.transfers) {
    const list = transfersByTx.get(transfer.transactionHash);
    if (list) list.push(transfer);
    else transfersByTx.set(transfer.transactionHash, [transfer]);
  }

  const { events: legs } = dedupeConditionalEventLegs(source.conditionalEvents, marketsById.keys());
  for (const leg of legs) {
    const market = marketsById.get(leg.marketId.toLowerCase());
    if (!market) continue;
    const side = sideOf(market);
    if (!side) continue;
    const tokenIds = market.wrappedTokens.map((token) => token.toLowerCase());
    const amount = toNumber(leg.amount, sideDecimals(side));
    const seq = conditionalEventLogIndex(leg.id);
    if (leg.eventType === "split") {
      const event: Extract<BasisEvent, { kind: "split" }> = {
        kind: "split",
        timestamp: leg.timestamp,
        seq,
        tokenIds,
        amount,
        collateral: side,
        fallbackWeights: fallbackSplitWeights(market),
      };
      events.push(event);
      priceRequests.push({
        timestamp: leg.timestamp,
        tokenIds,
        apply: (prices) => {
          const found = tokenIds.map((token) => prices[token]);
          if (!found.some((price) => typeof price === "number" && price > 0)) return false;
          event.prices = found;
          return true;
        },
      });
      continue;
    }
    if (leg.eventType === "merge") {
      events.push({ kind: "merge", timestamp: leg.timestamp, seq, tokenIds, amount, collateral: side });
      continue;
    }
    // Redeem: the payout is on the event; the tokens burned are the wallet's outcome transfers out
    // in the same transaction, apportioned by the market's settled payout ratios.
    const burned = new Map<string, number>();
    for (const transfer of transfersByTx.get(leg.transactionHash) ?? []) {
      if (transfer.from !== account || !tokenIds.includes(transfer.token)) continue;
      burned.set(transfer.token, (burned.get(transfer.token) ?? 0) + toNumber(transfer.valueWei, OUTCOME_DECIMALS));
    }
    const ratios = settledPayoutRatios([market]);
    if (burned.size === 0) {
      // Older indexer rows can lack the burn leg. With a single winning outcome the amount follows
      // from the payout; anything else is left unresolved and the position is flagged instead.
      const winners = tokenIds.filter((token) => (ratios[token] ?? 0) > 0);
      if (winners.length === 1 && amount > 0) {
        burned.set(winners[0], amount / ratios[winners[0]]);
      } else {
        stats.redeemsUnresolved += 1;
        for (const token of tokenIds) approximateTokens.add(token);
        continue;
      }
    }
    const weighted = [...burned].map(([token, qty]) => [token, qty * (ratios[token] ?? 0)] as const);
    const weightTotal = weighted.reduce((sum, [, w]) => sum + w, 0);
    for (const [token, qty] of burned) {
      const share = weightTotal > 0 ? (qty * (ratios[token] ?? 0)) / weightTotal : 1 / burned.size;
      events.push({
        kind: "redeem",
        timestamp: leg.timestamp,
        seq,
        tokenId: token,
        amount: qty,
        payout: amount * share,
        collateral: side,
      });
    }
  }

  const legTxs = new Set<string>();
  for (const row of [...source.swaps, ...source.mints, ...source.burns]) {
    if (row.transactionHash) legTxs.add(row.transactionHash);
  }
  for (const leg of source.conditionalEvents) legTxs.add(leg.transactionHash);

  for (const transfer of source.transfers) {
    const ref = tokenRefs.get(transfer.token);
    const counterparty = transfer.from === account ? transfer.to : transfer.from;
    if (
      !ref ||
      transfer.from === transfer.to ||
      counterparty === zeroAddress ||
      transfer.involvesRouter ||
      legTxs.has(transfer.transactionHash)
    ) {
      stats.transfersIgnored += 1;
      continue;
    }
    if (!sideOf(ref.market)) continue;
    const amount = toNumber(transfer.valueWei, OUTCOME_DECIMALS);
    const internal = source.identityWallets.has(counterparty);
    const key = `${transfer.transactionHash}:${transfer.logIndex}`;
    if (transfer.from === account) {
      events.push({
        kind: "transferOut",
        timestamp: transfer.timestamp,
        seq: transfer.logIndex,
        tokenId: transfer.token,
        amount,
        handoffKey: internal ? key : undefined,
      });
      continue;
    }
    const handedOver = internal ? source.handoffs?.get(key) : undefined;
    if (handedOver !== undefined) stats.transfersHandedOver += 1;
    // A missing internal hand-over uses a pool price, which cannot recover the sender's cost.
    if (internal && handedOver === undefined) approximateTokens.add(transfer.token);
    const event: Extract<BasisEvent, { kind: "transferIn" }> = {
      kind: "transferIn",
      timestamp: transfer.timestamp,
      seq: transfer.logIndex,
      tokenId: transfer.token,
      amount,
      unitCost: handedOver ?? 0,
    };
    events.push(event);
    if (handedOver === undefined) {
      priceRequests.push({
        timestamp: transfer.timestamp,
        tokenIds: [transfer.token],
        apply: (prices) => {
          const price = prices[transfer.token];
          if (price === undefined) return false;
          event.unitCost = price;
          return true;
        },
        // A transfer that never finds a price stays at zero cost, which the row reports as approximate.
        onUnpriced: () => approximateTokens.add(transfer.token),
      });
    }
  }

  return { events, priceRequests, approximateTokens, stats };
}
