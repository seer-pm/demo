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
 * any outcome count. The leftovers are never swapped — they just stay in the wallet — so the only
 * pool it needs is the target outcome's, and the direct sell quote it is built on already proves
 * that one exists.
 *
 * The sell leg is the direct AMM quote for the full N: the Lens quoter is a view and does not care
 * about the caller's balance, so no extra round trip is needed and this stays a pure transform.
 */

import type { Address } from "viem";
import type { CompleteSetLeftover, CompleteSetQuoteResult } from "./complete-set-quote";
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
  | { kind: "ready"; quote: CompleteSetQuoteResult };

export interface MintToCoverParams {
  market: Market;
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
export function isMintToCoverEligible(params: {
  market: Market;
  outcomeIndex: number;
  selectedCollateral: Token;
  swapType: "buy" | "sell";
  tradeType: TradeType;
  account: Address | undefined;
}): boolean {
  const { market, outcomeIndex, selectedCollateral, swapType, tradeType, account } = params;

  if (swapType !== "sell" || !account) {
    return false;
  }
  // EXACT_OUTPUT rewrites the amount field on every re-quote, so the shortfall (and the offer)
  // would flicker. Excluded until the sizing is driven off maximumAmountIn end to end.
  if (tradeType !== TradeType.EXACT_INPUT) {
    return false;
  }
  // Also excludes conditional markets, whose split takes the base collateral rather than
  // `market.collateralToken`.
  if (!isMintToCoverRoutingEnabled(market, outcomeIndex, selectedCollateral.address)) {
    return false;
  }
  // Split amounts are compared against 18-decimal outcome tokens without conversion.
  if (selectedCollateral.decimals !== COMPLETE_SET_DECIMALS) {
    return false;
  }
  return true;
}

export function buildMintToCoverQuote(params: MintToCoverParams): MintToCoverStatus {
  const { market, outcomeIndex, outcomeBalance, collateralBalance, directQuote } = params;

  if (!isMintToCoverEligible(params)) {
    return { kind: "off" };
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

  // The rest of the complete set, Invalid included: minted by the same split, never swapped.
  const leftoverTokens: CompleteSetLeftover[] = market.wrappedTokens
    .map((_, index) => index)
    .filter((index) => index !== outcomeIndex)
    .map((index) => ({ token: getOutcomeToken(market, index), amount: splitAmount }));

  const marketLike: MarketLike = { id: market.id, type: market.type, chainId: market.chainId };

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
        swapInputToken: targetOutcomeToken,
        swapInputAmount: sellAmount,
        existingBalance: outcomeBalance,
        leftoverTokens,
        secondaryTrade: directQuote.trade,
        market: marketLike,
        collateralToken: market.collateralToken as Address,
        targetOutcomeIndex: outcomeIndex,
        targetOutcomeToken,
      },
    },
  };
}
