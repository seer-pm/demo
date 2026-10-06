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
 * collateral instead, the shortfall is covered by two splits: the parent market from the base
 * collateral, then the child from the parent outcome just minted. The leftovers then span both
 * markets. One parent level is supported, which is what the protocol's redeem path assumes.
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
  /** The parent of a child market. Required to cover a shortfall paid in the base collateral. */
  parentMarket?: Market;
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
  parentMarket?: Market;
  outcomeIndex: number;
  selectedCollateral: Token;
  swapType: "buy" | "sell";
  tradeType: TradeType;
  account: Address | undefined;
}

/** The market whose set is too large to split in one transaction, if any: the parent is checked first because it is split first. */
function getOversizedSplit(params: {
  market: Market;
  parentMarket?: Market;
  selectedCollateral: Token;
}): Extract<MintToCoverStatus, { kind: "splitTooLarge" }> | undefined {
  const { market, parentMarket, selectedCollateral } = params;
  const splits: { market: Market; isParent: boolean }[] = [];
  if (needsParentSplit(market, selectedCollateral.address) && isParentMarketOf(market, parentMarket)) {
    splits.push({ market: parentMarket, isParent: true });
  }
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
  const { market, parentMarket, outcomeIndex, selectedCollateral, swapType, tradeType, account } = params;

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
  // Paying in the base collateral on a child market mints the parent's full set first, so the
  // parent's outcomes are needed to build the split and to disclose the leftovers.
  if (needsParentSplit(market, selectedCollateral.address) && !isParentMarketOf(market, parentMarket)) {
    return false;
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

function isParentMarketOf(market: Market, parentMarket: Market | undefined): parentMarket is Market {
  return parentMarket !== undefined && isTwoStringsEqual(parentMarket.id, market.parentMarket.id);
}

function toMarketLike(market: Market): MarketLike {
  return { id: market.id, type: market.type, chainId: market.chainId };
}

function getLeftovers(market: Market, keptOutcomeIndex: number, amount: bigint): CompleteSetLeftover[] {
  return market.wrappedTokens
    .map((_, index) => index)
    .filter((index) => index !== keptOutcomeIndex)
    .map((index) => ({ token: getOutcomeToken(market, index), amount }));
}

export function buildMintToCoverQuote(params: MintToCoverParams): MintToCoverStatus {
  const { market, parentMarket, outcomeIndex, selectedCollateral, outcomeBalance, collateralBalance, directQuote } =
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

  // The rest of the complete set, Invalid included: minted by the same split, never swapped.
  const leftoverTokens: CompleteSetLeftover[] = getLeftovers(market, outcomeIndex, splitAmount);
  const splitSteps: CompleteSetSplitStep[] = [];

  if (isChildMarket(market)) {
    const baseCollateral = getActivePrimaryCollateral(market.chainId).address;
    if (needsParentSplit(market, selectedCollateral.address)) {
      if (!isParentMarketOf(market, parentMarket)) {
        return { kind: "off" };
      }
      // The parent's full set is minted so that one of its outcomes can be split again; every
      // other parent outcome stays in the wallet alongside the child leftovers.
      splitSteps.push({
        market: toMarketLike(parentMarket),
        spendToken: baseCollateral,
        routerCollateral: baseCollateral,
        amount: splitAmount,
        outcomeCount: parentMarket.wrappedTokens.length,
      });
      leftoverTokens.unshift(...getLeftovers(parentMarket, Number(market.parentOutcome), splitAmount));
    }
    splitSteps.push({
      market: marketLike,
      spendToken: market.collateralToken as Address,
      routerCollateral: baseCollateral,
      amount: splitAmount,
      outcomeCount: market.wrappedTokens.length,
    });
  } else {
    splitSteps.push({
      market: marketLike,
      spendToken: market.collateralToken as Address,
      routerCollateral: market.collateralToken as Address,
      amount: splitAmount,
      outcomeCount: market.wrappedTokens.length,
    });
  }

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
