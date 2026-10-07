/**
 * mint-to-cover: sell more outcome tokens than you hold by minting the shortfall first.
 *
 * Selling N of an outcome while holding B < N is impossible directly. Splitting S = N - B of the
 * market collateral mints S of *every* outcome, which covers the shortfall; the user then sells N
 * and keeps S of each remaining outcome. The net position is short the sold outcome and long S of
 * everything else, which is why the UI has to disclose the leftovers rather than present a plain
 * sell.
 *
 * None of that is binary. `Router.splitPosition` always mints the condition's full partition, and a
 * complete set redeems for exactly 1 collateral on every Generic market type, so the route works for
 * any outcome count. The leftovers are never swapped (they just stay in the wallet), so the only
 * pool it needs is the target outcome's, and the direct sell quote it is built on already proves
 * that one exists.
 *
 * On a child market the split spends the parent outcome token, and the router is told the base
 * collateral (it derives the position ids from it). When the user trades against the base
 * collateral instead, the shortfall is covered by one split per level, root first: the root market
 * from the base collateral, then each market down the chain from the outcome of the market above
 * that it hangs off. `Router.splitPosition` pulls `parentWrappedOutcome()` from the caller on every
 * conditional market, so no level can be skipped. The leftovers then span every market split.
 *
 * The sell leg is the direct AMM quote for the full N: the Lens quoter is a view and does not care
 * about the caller's balance, so no extra round trip is needed and this stays a pure transform.
 */

import type { Address } from "viem";
import { zeroAddress } from "viem";
import { MAX_SPLIT_OUTCOMES } from "./batch-gas";
import { getActivePrimaryCollateral } from "./collateral";
import type { CompleteSetLeftover, CompleteSetQuoteResult, CompleteSetSplitStep } from "./complete-set-quote";
import { getOutcomeToken, isMintToCoverRoutingEnabled } from "./complete-set-quote";
import type { Market } from "./market-types";
import { isTwoStringsEqual } from "./quote-utils";
import type { MarketLike } from "./router-addresses";
import type { Token } from "./tokens";
import { TradeType } from "./trade-type";
import { getMaximumAmountIn } from "./trade-utils";

/** Every complete-set amount is compared against outcome tokens, which are always 18 decimals. */
const COMPLETE_SET_DECIMALS = 18;

export type MintToCoverStatus =
  | { kind: "off" }
  /** Eligible, but the split cannot be funded: the user must bring in more collateral. */
  | { kind: "insufficientCollateral"; splitAmount: bigint; collateralBalance: bigint }
  /**
   * One of the sets to mint has more outcomes than a single transaction can split. Each split is
   * its own transaction when the batch does not fit, but the split itself cannot be divided.
   */
  | { kind: "splitTooLarge"; outcomeCount: number; maxOutcomeCount: number; isParent: boolean }
  | { kind: "ready"; quote: CompleteSetQuoteResult };

export interface MintToCoverParams {
  market: Market;
  /**
   * The ancestors of a child market, in any order, up to the root. Required to cover a shortfall
   * paid in the base collateral, which splits every one of them.
   */
  parentMarkets?: Market[];
  outcomeIndex: number;
  selectedCollateral: Token;
  swapType: "buy" | "sell";
  tradeType: TradeType;
  account: Address | undefined;
  /** B: outcome tokens the user already holds. */
  outcomeBalance: bigint;
  collateralBalance: bigint;
  /** The winning quote from the normal pipeline. Only a "direct" route can be covered. */
  directQuote: CompleteSetQuoteResult | undefined;
}

/**
 * Whether the market/collateral/direction combination can use mint-to-cover at all.
 * Deliberately narrower than `isMintToCoverRoutingEnabled`, see the two extra gates below.
 */
export function isMintToCoverEligible(params: MintToCoverEligibilityParams): boolean {
  return isMintToCoverEligibleIgnoringGas(params) && getOversizedSplit(params) === undefined;
}

export interface MintToCoverEligibilityParams {
  market: Market;
  parentMarkets?: Market[];
  outcomeIndex: number;
  selectedCollateral: Token;
  swapType: "buy" | "sell";
  tradeType: TradeType;
  account: Address | undefined;
}

/** The market whose set is too large to split in one transaction, if any: ancestors are checked first because they are split first. */
function getOversizedSplit(params: {
  market: Market;
  parentMarkets?: Market[];
  selectedCollateral: Token;
}): Extract<MintToCoverStatus, { kind: "splitTooLarge" }> | undefined {
  const { market, parentMarkets, selectedCollateral } = params;
  const chain = needsParentSplit(market, selectedCollateral.address) ? getAncestorChain(market, parentMarkets) : [];
  const splits: { market: Market; isParent: boolean }[] = [...(chain ?? [])]
    .reverse()
    .map((ancestor) => ({ market: ancestor, isParent: true }));
  splits.push({ market, isParent: false });

  for (const split of splits) {
    const outcomeCount = split.market.wrappedTokens.length;
    if (outcomeCount > MAX_SPLIT_OUTCOMES) {
      return { kind: "splitTooLarge", outcomeCount, maxOutcomeCount: MAX_SPLIT_OUTCOMES, isParent: split.isParent };
    }
  }
  return undefined;
}

/** Every gate except the split size, which `buildMintToCoverQuote` reports as its own status. */
function isMintToCoverEligibleIgnoringGas(params: MintToCoverEligibilityParams): boolean {
  const { market, parentMarkets, outcomeIndex, selectedCollateral, swapType, tradeType, account } = params;

  if (swapType !== "sell" || !account) {
    return false;
  }
  // EXACT_OUTPUT rewrites the amount field on every re-quote, so the shortfall (and the offer)
  // would flicker. Excluded until the sizing is driven off maximumAmountIn end to end.
  if (tradeType !== TradeType.EXACT_INPUT) {
    return false;
  }
  if (!isMintToCoverRoutingEnabled(market, outcomeIndex, selectedCollateral.address)) {
    return false;
  }
  // Paying in the base collateral on a child market mints the full set of every ancestor first, so
  // all of them are needed to build the splits and to disclose the leftovers, and the chain is only
  // mintable from the root's own collateral.
  if (needsParentSplit(market, selectedCollateral.address)) {
    const chain = getAncestorChain(market, parentMarkets);
    if (!chain || !isTwoStringsEqual(chain[chain.length - 1].collateralToken, selectedCollateral.address)) {
      return false;
    }
  }
  // Split amounts are compared against 18-decimal outcome tokens without conversion.
  if (selectedCollateral.decimals !== COMPLETE_SET_DECIMALS) {
    return false;
  }
  return true;
}

function isChildMarket(market: Market): boolean {
  return market.parentMarket.id !== zeroAddress;
}

/** Whether covering in `collateralToken` means splitting the parent market before the child. */
function needsParentSplit(market: Market, collateralToken: Address): boolean {
  return isChildMarket(market) && !isTwoStringsEqual(collateralToken, market.collateralToken as Address);
}

/**
 * The ancestors of `market` nearest first, ending at the root, picked out of `parentMarkets` by
 * following the `parentMarket.id` links. `undefined` when a link is not loaded, since a split
 * chain with a hole in it cannot be built. Cycles are impossible on chain, so the walk is bounded
 * by the list.
 */
function getAncestorChain(market: Market, parentMarkets: Market[] | undefined): Market[] | undefined {
  const chain: Market[] = [];
  let current = market;
  while (isChildMarket(current)) {
    const parent = parentMarkets?.find((candidate) => isTwoStringsEqual(candidate.id, current.parentMarket.id));
    if (!parent || chain.length >= (parentMarkets?.length ?? 0)) {
      return undefined;
    }
    chain.push(parent);
    current = parent;
  }
  return chain;
}

function toMarketLike(market: Market): MarketLike {
  return { id: market.id, type: market.type, chainId: market.chainId };
}

function getLeftovers(market: Market, keptOutcomeIndex: number, amount: bigint): CompleteSetLeftover[] {
  return market.wrappedTokens
    .map((_, index) => index)
    .filter((index) => index !== keptOutcomeIndex)
    .map((index) => ({ token: getOutcomeToken(market, index), amount, marketId: market.id }));
}

export function buildMintToCoverQuote(params: MintToCoverParams): MintToCoverStatus {
  const { market, parentMarkets, outcomeIndex, selectedCollateral, outcomeBalance, collateralBalance, directQuote } =
    params;

  if (!isMintToCoverEligibleIgnoringGas(params)) {
    return { kind: "off" };
  }
  const oversized = getOversizedSplit(params);
  if (oversized) {
    return oversized;
  }
  // Only a plain AMM sell can be covered. mint+sell and buy+merge have their own balance
  // requirements, and comparing against them here would be meaningless: the direct quote the
  // comparison is built on is not executable without the tokens in the first place.
  if (!directQuote || directQuote.route !== "direct" || !directQuote.trade) {
    return { kind: "off" };
  }
  // `outcomeIndex` and `directQuote` arrive as independent inputs, so a quote left over from
  // another outcome would have us split, then approve and sell a token the trade does not move.
  // Harmless to check, and the more outcomes a market has the more likely the mismatch.
  if (!isTwoStringsEqual(directQuote.trade.tokenIn.address, market.wrappedTokens[outcomeIndex])) {
    return { kind: "off" };
  }

  const sellAmount = getMaximumAmountIn(directQuote.trade);
  const splitAmount = sellAmount - outcomeBalance;
  if (splitAmount <= 0n) {
    return { kind: "off" };
  }

  if (collateralBalance < splitAmount) {
    return { kind: "insufficientCollateral", splitAmount, collateralBalance };
  }

  const targetOutcomeToken = getOutcomeToken(market, outcomeIndex);
  const marketLike = toMarketLike(market);

  // The markets to split, root first. Paying in the market's own collateral splits only the
  // market itself; paying in the base collateral splits every ancestor on the way down to it.
  const chain = needsParentSplit(market, selectedCollateral.address) ? getAncestorChain(market, parentMarkets) : [];
  if (!chain) {
    return { kind: "off" };
  }
  const levels = [...chain].reverse().concat(market);
  // The router derives every position id from the base collateral: the root's own when it is
  // loaded, otherwise the configured one, which is what the parent outcome being spent was minted from.
  const baseCollateral = isChildMarket(levels[0])
    ? getActivePrimaryCollateral(market.chainId).address
    : (levels[0].collateralToken as Address);

  // The rest of every complete set, Invalid included: minted by the splits, never swapped. A level
  // keeps everything except the outcome the next level is split from; the last keeps everything
  // except the outcome being sold.
  const leftoverTokens: CompleteSetLeftover[] = [];
  const splitSteps: CompleteSetSplitStep[] = [];
  levels.forEach((level, index) => {
    const next = levels[index + 1];
    const spentOutcomeIndex = next ? Number(next.parentOutcome) : outcomeIndex;
    const parent = levels[index - 1];
    splitSteps.push({
      market: toMarketLike(level),
      spendToken: level.collateralToken as Address,
      routerCollateral: baseCollateral,
      amount: splitAmount,
      outcomeCount: level.wrappedTokens.length,
      ...(parent ? { spendOutcome: getOutcomeToken(parent, Number(level.parentOutcome)) } : {}),
    });
    leftoverTokens.push(...getLeftovers(level, spentOutcomeIndex, splitAmount));
  });

  return {
    kind: "ready",
    quote: {
      ...directQuote,
      route: "mintToCover",
      // Collateral the user has to front before the sell pays out.
      netCollateral: splitAmount,
      savingsPercent: undefined,
      completeSetLeg: {
        route: "mintToCover",
        splitAmount,
        splitSteps,
        swapInputToken: targetOutcomeToken,
        swapInputAmount: sellAmount,
        existingBalance: outcomeBalance,
        leftoverTokens,
        secondaryTrade: directQuote.trade,
        market: marketLike,
        // The token the user fronts, which is what the balance check and the notice are about.
        collateralToken: selectedCollateral.address,
        targetOutcomeIndex: outcomeIndex,
        targetOutcomeToken,
      },
    },
  };
}
