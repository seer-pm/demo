import type { TradeType } from "@seer-pm/sdk";

/** Order types offered by the trade widget's order-type dropdown. */
export type SwapOrderType = "market" | "limit" | "fill-to-estimate";

export interface MarketDraft {
  /** Outcome the amounts belong to; a draft is dropped when the selected outcome moved on. */
  outcomeToken: string;
  swapType: "buy" | "sell";
  tradeType: TradeType;
  amount: string;
  amountOut: string;
}

export interface LimitDraft {
  /** Outcome the target price belongs to; a draft is dropped when the selected outcome moved on. */
  outcomeToken: string;
  /** Only the target price: the fill-to-price amounts are derived from it and from pool liquidity. */
  limitPrice: string;
}

export interface FillToEstimateDraft {
  targetEstimate: string;
  maxCollateralToUse: string;
}

/** What the user typed in one market's trade widget, kept across unmounts. */
export interface TradeDraft {
  orderType?: SwapOrderType;
  market?: MarketDraft;
  limit?: LimitDraft;
  fillToEstimate?: FillToEstimateDraft;
}

export type TradeDrafts = Record<string, TradeDraft>;

/** Drafts are per market; keep only the last few so session storage cannot grow without bound. */
export const MAX_TRADE_DRAFTS = 5;

export function getTradeDraftKey(chainId: number, marketId: string): string {
  return `${chainId}-${marketId.toLowerCase()}`;
}

/**
 * Merge `patch` into the draft for `key`, section by section, and keep only the
 * `maxEntries` most recently written markets. The written key is always reinserted
 * last, so it counts as the most recent one.
 */
export function applyTradeDraft(
  drafts: TradeDrafts,
  key: string,
  patch: TradeDraft,
  maxEntries = MAX_TRADE_DRAFTS,
): TradeDrafts {
  const merged: TradeDrafts = {};

  for (const [draftKey, draft] of Object.entries(drafts)) {
    if (draftKey !== key) {
      merged[draftKey] = draft;
    }
  }
  merged[key] = { ...drafts[key], ...patch };

  const keys = Object.keys(merged);
  if (keys.length <= maxEntries) {
    return merged;
  }

  const pruned: TradeDrafts = {};
  for (const draftKey of keys.slice(keys.length - maxEntries)) {
    pruned[draftKey] = merged[draftKey];
  }
  return pruned;
}

/** A draft only applies to the outcome it was typed against. */
export function isDraftForOutcome(draft: { outcomeToken: string } | undefined, outcomeTokenAddress: string): boolean {
  return draft?.outcomeToken.toLowerCase() === outcomeTokenAddress.toLowerCase();
}

/**
 * A stored order type is only valid while the market still offers it: non-Generic
 * markets are market-order only, and fill-to-estimate is limited to scalar markets.
 */
export function readOrderType(
  orderType: SwapOrderType | undefined,
  { isGeneric, allowFillToEstimate }: { isGeneric: boolean; allowFillToEstimate: boolean },
): SwapOrderType {
  if (!orderType || !isGeneric) {
    return "market";
  }
  if (orderType === "fill-to-estimate" && !allowFillToEstimate) {
    return "market";
  }
  return orderType;
}
