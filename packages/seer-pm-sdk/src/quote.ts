/**
 * Quote (exact-in and exact-out) and trade-building helpers via Lens smart quoter.
 */

import type { Address, PublicClient } from "viem";
import { formatUnits, parseUnits } from "viem";
import { AmmTrade, quoteAmmTrade } from "./amm-trade";
import type { Token } from "./tokens";
import { TradeType } from "./trade-type";
import { getTradeAmountIn, getTradeAmountOut, getTradeTokenIn, getTradeTokenOut } from "./trade-utils";

export type Psm3TradeType = "exactIn" | "exactOut";

export interface Psm3Leg {
  tradeType: Psm3TradeType;
  assetIn: Address;
  assetOut: Address;
  amountIn: bigint;
  amountOut: bigint;
  limitAmount: bigint;
}

export interface QuoteTradeResult {
  value: bigint;
  decimals: number;
  buyToken: Address;
  sellToken: Address;
  sellAmount: string;
  swapType: "buy" | "sell";
  trade: AmmTrade;
  psm3Leg?: Psm3Leg;
}

export type AmmQuoteTradeFn = (
  client: PublicClient,
  chainId: number,
  account: Address | undefined,
  amount: string,
  outcomeToken: Token,
  collateralToken: Token,
  swapType: "buy" | "sell",
  maxSlippage: string,
) => Promise<QuoteTradeResult>;

export function getCollateralPerShare(quoteData: QuoteTradeResult | undefined, swapType: "buy" | "sell"): number {
  if (!quoteData) return 0;
  const tokenIn = getTradeTokenIn(quoteData.trade);
  const tokenOut = getTradeTokenOut(quoteData.trade);
  const inputAmount = Number(formatUnits(getTradeAmountIn(quoteData.trade), tokenIn.decimals));
  const outputAmount = Number(formatUnits(getTradeAmountOut(quoteData.trade), tokenOut.decimals));
  return swapType === "buy" ? inputAmount / outputAmount : outputAmount / inputAmount;
}

export function getOutcomeTokenVolume(quoteData: QuoteTradeResult | undefined, swapType: "buy" | "sell"): number {
  if (!quoteData) return 0;
  const tokenIn = getTradeTokenIn(quoteData.trade);
  const tokenOut = getTradeTokenOut(quoteData.trade);
  const inputAmount = Number(formatUnits(getTradeAmountIn(quoteData.trade), tokenIn.decimals));
  const outputAmount = Number(formatUnits(getTradeAmountOut(quoteData.trade), tokenOut.decimals));
  return swapType === "buy" ? outputAmount : inputAmount;
}

async function getAmmQuoteExactIn(
  client: PublicClient,
  chainId: number,
  account: Address | undefined,
  amount: string,
  outcomeToken: Token,
  collateralToken: Token,
  swapType: "buy" | "sell",
  maxSlippage: string,
): Promise<QuoteTradeResult> {
  const [buyToken, sellToken] =
    swapType === "buy" ? [outcomeToken, collateralToken] : ([collateralToken, outcomeToken] as [Token, Token]);
  const sellAmount = parseUnits(String(amount), sellToken.decimals);

  const trade = await quoteAmmTrade(client, {
    chainId,
    account,
    amount,
    outcomeToken,
    collateralToken,
    swapType,
    maxSlippage,
    tradeType: TradeType.EXACT_INPUT,
  });

  return {
    value: trade.amountOut,
    decimals: sellToken.decimals,
    trade,
    buyToken: buyToken.address,
    sellToken: sellToken.address,
    sellAmount: sellAmount.toString(),
    swapType,
  };
}

async function getAmmQuoteExactOut(
  client: PublicClient,
  chainId: number,
  account: Address | undefined,
  amount: string,
  outcomeToken: Token,
  collateralToken: Token,
  swapType: "buy" | "sell",
  maxSlippage: string,
): Promise<QuoteTradeResult> {
  const [buyToken, sellToken] =
    swapType === "buy" ? [outcomeToken, collateralToken] : ([collateralToken, outcomeToken] as [Token, Token]);
  const buyAmount = parseUnits(String(amount), buyToken.decimals);

  const trade = await quoteAmmTrade(client, {
    chainId,
    account,
    amount,
    outcomeToken,
    collateralToken,
    swapType,
    maxSlippage,
    tradeType: TradeType.EXACT_OUTPUT,
  });

  return {
    value: trade.amountIn,
    decimals: buyToken.decimals,
    trade,
    buyToken: buyToken.address,
    sellToken: sellToken.address,
    sellAmount: buyAmount.toString(),
    swapType,
  };
}

/** Quote via Lens smart quoter (Uniswap / Swapr DEX routers). */
export async function fetchAmmQuote(
  client: PublicClient,
  tradeType: TradeType,
  chainId: number,
  account: Address | undefined,
  amount: string,
  outcomeToken: Token,
  collateralToken: Token,
  swapType: "buy" | "sell",
  maxSlippage: string,
): Promise<QuoteTradeResult> {
  return tradeType === TradeType.EXACT_INPUT
    ? getAmmQuoteExactIn(client, chainId, account, amount, outcomeToken, collateralToken, swapType, maxSlippage)
    : getAmmQuoteExactOut(client, chainId, account, amount, outcomeToken, collateralToken, swapType, maxSlippage);
}
