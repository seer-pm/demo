/**
 * Quote (exact-in and exact-out) and trade-building helpers for CoW and Lens AMM.
 */

import { PriceQuality } from "@cowprotocol/cow-sdk";
import { CoWTrade, Currency, CurrencyAmount, Percent, Token as SwaprToken, TokenAmount } from "@swapr/sdk";
import type { Address, PublicClient } from "viem";
import { formatUnits, parseUnits, zeroAddress } from "viem";
import { AmmTrade, quoteAmmTrade } from "./amm-trade";
import { isTwoStringsEqual, parseFraction } from "./quote-utils";
import type { Token } from "./tokens";
import { NATIVE_TOKEN } from "./tokens";
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
  trade: CoWTrade | AmmTrade;
  psm3Leg?: Psm3Leg;
}

export type QuoteTradeFn = (
  chainId: number,
  account: Address | undefined,
  amount: string,
  outcomeToken: Token,
  collateralToken: Token,
  swapType: "buy" | "sell",
  maxSlippage: string,
  isFastQuery?: boolean,
) => Promise<QuoteTradeResult>;

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

// ----- Exact-in helpers -----

function getCurrenciesFromTokensExactIn(
  chainId: number,
  buyToken: Token,
  sellToken: Token,
  amount: string,
): {
  currencyIn: Currency;
  currencyOut: Currency;
  currencyAmountIn: CurrencyAmount;
} {
  let currencyIn: Currency;
  let currencyAmountIn: CurrencyAmount;
  if (isTwoStringsEqual(sellToken.address, NATIVE_TOKEN)) {
    currencyIn = SwaprToken.getNative(chainId);
    currencyAmountIn = CurrencyAmount.nativeCurrency(parseUnits(String(amount), currencyIn.decimals), chainId);
  } else {
    const tokenIn = new SwaprToken(chainId, sellToken.address, sellToken.decimals, sellToken.symbol);
    currencyAmountIn = new TokenAmount(tokenIn, parseUnits(String(amount), tokenIn.decimals));
    currencyIn = tokenIn;
  }

  let currencyOut: Currency;
  if (isTwoStringsEqual(buyToken.address, NATIVE_TOKEN)) {
    currencyOut = SwaprToken.getNative(chainId);
  } else {
    currencyOut = new SwaprToken(chainId, buyToken.address, buyToken.decimals, buyToken.symbol);
  }

  return {
    currencyIn,
    currencyOut,
    currencyAmountIn,
  };
}

export async function getTradeArgsExactIn(
  chainId: number,
  amount: string,
  outcomeToken: Token,
  collateralToken: Token,
  swapType: "buy" | "sell",
  maxSlippage: string,
) {
  const [buyToken, sellToken] =
    swapType === "buy" ? [outcomeToken, collateralToken] : ([collateralToken, outcomeToken] as [Token, Token]);

  const sellAmount = parseUnits(String(amount), sellToken.decimals);
  const { currencyIn, currencyOut, currencyAmountIn } = getCurrenciesFromTokensExactIn(
    chainId,
    buyToken,
    sellToken,
    amount,
  );

  const slippage = String(Number(maxSlippage) / 100);
  const [numerator, denominator] = parseFraction(slippage) ?? [];
  const maximumSlippage =
    Number.isInteger(numerator) && Number.isInteger(denominator)
      ? new Percent(String(numerator), String(denominator))
      : new Percent("1", "100");

  return {
    buyToken,
    sellToken,
    sellAmount,
    currencyIn,
    currencyOut,
    currencyAmountIn,
    maximumSlippage,
  };
}

export const getCowQuote: QuoteTradeFn = async (
  chainId,
  account,
  amount,
  outcomeToken,
  collateralToken,
  swapType,
  maxSlippage,
  isFastQuery,
) => {
  const args = await getTradeArgsExactIn(chainId, amount, outcomeToken, collateralToken, swapType, maxSlippage);

  const trade = await CoWTrade.bestTradeExactIn({
    currencyAmountIn: args.currencyAmountIn,
    currencyOut: args.currencyOut,
    maximumSlippage: args.maximumSlippage,
    user: account || zeroAddress,
    receiver: account || zeroAddress,
    priceQuality: isFastQuery ? PriceQuality.FAST : PriceQuality.OPTIMAL,
  });

  if (!trade) {
    throw new Error("No route found");
  }

  return {
    value: BigInt(trade.outputAmount.raw.toString()),
    decimals: args.sellToken.decimals,
    trade,
    buyToken: args.buyToken.address,
    sellToken: args.sellToken.address,
    sellAmount: args.sellAmount.toString(),
    swapType,
  };
};

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

// ----- Exact-out helpers -----

function getCurrenciesFromTokensExactOut(
  chainId: number,
  buyToken: Token,
  sellToken: Token,
  amount: string,
): {
  currencyIn: Currency;
  currencyOut: Currency;
  currencyAmountOut: CurrencyAmount;
} {
  let currencyIn: Currency;
  if (isTwoStringsEqual(sellToken.address, NATIVE_TOKEN)) {
    currencyIn = SwaprToken.getNative(chainId);
  } else {
    currencyIn = new SwaprToken(chainId, sellToken.address, sellToken.decimals, sellToken.symbol);
  }

  let currencyOut: Currency;
  let currencyAmountOut: CurrencyAmount;
  if (isTwoStringsEqual(buyToken.address, NATIVE_TOKEN)) {
    currencyOut = SwaprToken.getNative(chainId);
    currencyAmountOut = CurrencyAmount.nativeCurrency(parseUnits(String(amount), currencyOut.decimals), chainId);
  } else {
    const tokenOut = new SwaprToken(chainId, buyToken.address, buyToken.decimals, buyToken.symbol);
    currencyOut = tokenOut;
    currencyAmountOut = new TokenAmount(tokenOut, parseUnits(String(amount), tokenOut.decimals));
  }

  return {
    currencyIn,
    currencyOut,
    currencyAmountOut,
  };
}

export async function getTradeArgsExactOut(
  chainId: number,
  amount: string,
  outcomeToken: Token,
  collateralToken: Token,
  swapType: "buy" | "sell",
  maxSlippage: string,
) {
  const [buyToken, sellToken] =
    swapType === "buy" ? [outcomeToken, collateralToken] : ([collateralToken, outcomeToken] as [Token, Token]);

  const buyAmount = parseUnits(String(amount), buyToken.decimals);
  const { currencyIn, currencyOut, currencyAmountOut } = getCurrenciesFromTokensExactOut(
    chainId,
    buyToken,
    sellToken,
    amount,
  );

  const slippage = String(Number(maxSlippage) / 100);
  const [numerator, denominator] = parseFraction(slippage) ?? [];
  const maximumSlippage =
    Number.isInteger(numerator) && Number.isInteger(denominator)
      ? new Percent(String(numerator), String(denominator))
      : new Percent("1", "100");

  return {
    buyToken,
    sellToken,
    buyAmount,
    currencyIn,
    currencyOut,
    currencyAmountOut,
    maximumSlippage,
  };
}

export const getCowQuoteExactOut: QuoteTradeFn = async (
  chainId,
  account,
  amount,
  outcomeToken,
  collateralToken,
  swapType,
  maxSlippage,
  isFastQuery,
) => {
  const args = await getTradeArgsExactOut(chainId, amount, outcomeToken, collateralToken, swapType, maxSlippage);
  const trade = await CoWTrade.bestTradeExactOut({
    currencyIn: args.currencyIn,
    currencyAmountOut: args.currencyAmountOut,
    maximumSlippage: args.maximumSlippage,
    user: account || zeroAddress,
    receiver: account || zeroAddress,
    priceQuality: isFastQuery ? PriceQuality.FAST : PriceQuality.OPTIMAL,
  });

  if (!trade) {
    throw new Error("No route found");
  }

  return {
    value: BigInt(trade.inputAmount.raw.toString()),
    decimals: args.buyToken.decimals,
    trade,
    buyToken: args.buyToken.address,
    sellToken: args.sellToken.address,
    sellAmount: args.buyAmount.toString(),
    swapType,
  };
};

// ----- Fetch helpers (pick exact-in vs exact-out by tradeType) -----

export async function fetchCowQuote(
  tradeType: TradeType,
  chainId: number,
  account: Address | undefined,
  amount: string,
  outcomeToken: Token,
  collateralToken: Token,
  swapType: "buy" | "sell",
  maxSlippage: string,
  isFastQuery?: boolean,
): Promise<QuoteTradeResult> {
  return tradeType === TradeType.EXACT_INPUT
    ? getCowQuote(chainId, account, amount, outcomeToken, collateralToken, swapType, maxSlippage, isFastQuery)
    : getCowQuoteExactOut(chainId, account, amount, outcomeToken, collateralToken, swapType, maxSlippage, isFastQuery);
}

/** Quote via Lens (Uniswap / Swapr on-chain aggregators). */
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
