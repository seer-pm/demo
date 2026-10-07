import {
  type CompleteSetQuoteResult,
  type Market,
  type MintToCoverStatus,
  type Token,
  TradeType,
  buildMintToCoverQuote,
} from "@seer-pm/sdk";
import { useMemo } from "react";
import { type Address, parseUnits } from "viem";

interface Props {
  market: Market;
  /** Loaded ancestors of a child market; covering a shortfall paid in the base collateral splits each of them first. */
  parentMarkets: Market[] | undefined;
  outcomeIndex: number;
  selectedCollateral: Token;
  outcomeToken: Token;
  swapType: "buy" | "sell";
  tradeType: TradeType;
  account: Address | undefined;
  /** Raw input from the amount field, in outcome-token units. */
  amount: string;
  /** Balance of the token being sold — the outcome token when swapType is "sell". */
  balance: bigint;
  collateralBalance: bigint;
  quoteData: CompleteSetQuoteResult | undefined;
}

/**
 * Offers the mint-to-cover route when the user is selling more of an outcome than they hold.
 *
 * Pure derivation over the direct quote and two balances — no extra network call — so the leg
 * handed to the trade is always the one the UI just rendered.
 */
export function useMintToCover({
  market,
  parentMarkets,
  outcomeIndex,
  selectedCollateral,
  outcomeToken,
  swapType,
  tradeType,
  account,
  amount,
  balance,
  collateralBalance,
  quoteData,
}: Props): MintToCoverStatus {
  return useMemo(() => {
    let parsedAmount: bigint;
    try {
      parsedAmount = parseUnits(amount || "0", outcomeToken.decimals);
    } catch {
      return { kind: "off" };
    }
    if (parsedAmount <= balance) {
      return { kind: "off" };
    }

    return buildMintToCoverQuote({
      market,
      parentMarkets,
      outcomeIndex,
      selectedCollateral,
      swapType,
      tradeType,
      account,
      outcomeBalance: balance,
      collateralBalance,
      directQuote: quoteData,
    });
  }, [
    market,
    parentMarkets,
    outcomeIndex,
    selectedCollateral,
    outcomeToken.decimals,
    swapType,
    tradeType,
    account,
    amount,
    balance,
    collateralBalance,
    quoteData,
  ]);
}
