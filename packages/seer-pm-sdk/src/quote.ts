/**
 * Quote (exact-in and exact-out) and trade-building helpers for CoW, Swapr, Uniswap.
 */

import { PriceQuality } from "@cowprotocol/cow-sdk";
import {
  CoWTrade,
  Currency,
  CurrencyAmount,
  Percent,
  Token as SwaprToken,
  SwaprV3Trade,
  TokenAmount,
  TradeType,
  UniswapTrade,
} from "@swapr/sdk";
import { Address, formatUnits, parseUnits, zeroAddress } from "viem";
import { COLLATERAL_TOKENS } from "./collateral";
import { isTwoStringsEqual, parseFraction } from "./quote-utils";
import type { Token } from "./tokens";
import { NATIVE_TOKEN } from "./tokens";

export interface QuoteTradeResult {
  value: bigint;
  decimals: number;
  buyToken: Address;
  sellToken: Address;
  sellAmount: string;
  swapType: "buy" | "sell";
  trade: CoWTrade | SwaprV3Trade | UniswapTrade;
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

export function getCollateralPerShare(quoteData: QuoteTradeResult | undefined, swapType: "buy" | "sell"): number {
  if (!quoteData) return 0;
  const inputAmount = Number(
    formatUnits(BigInt(quoteData.trade.inputAmount.raw.toString()), quoteData.trade.inputAmount.currency.decimals),
  );
  const outputAmount = Number(
    formatUnits(BigInt(quoteData.trade.outputAmount.raw.toString()), quoteData.trade.outputAmount.currency.decimals),
  );
  return swapType === "buy" ? inputAmount / outputAmount : outputAmount / inputAmount;
}

export function getOutcomeTokenVolume(quoteData: QuoteTradeResult | undefined, swapType: "buy" | "sell"): number {
  if (!quoteData) return 0;
  const inputAmount = Number(
    formatUnits(BigInt(quoteData.trade.inputAmount.raw.toString()), quoteData.trade.inputAmount.currency.decimals),
  );
  const outputAmount = Number(
    formatUnits(BigInt(quoteData.trade.outputAmount.raw.toString()), quoteData.trade.outputAmount.currency.decimals),
  );
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

export function getUniswapTrade(
  _currencyIn: Currency,
  currencyOut: Currency,
  currencyAmountIn: CurrencyAmount,
  maximumSlippage: Percent,
  account: Address | undefined,
  _chainId: number,
): Promise<UniswapTrade | null> {
  return UniswapTrade.getQuote({
    amount: currencyAmountIn,
    quoteCurrency: currencyOut,
    maximumSlippage,
    recipient: account || zeroAddress,
    tradeType: TradeType.EXACT_INPUT,
  });
}

export function getSwaprTrade(
  _currencyIn: Currency,
  currencyOut: Currency,
  currencyAmountIn: CurrencyAmount,
  maximumSlippage: Percent,
  account: Address | undefined,
  chainId: number,
): Promise<SwaprV3Trade | null> {
  const primary = COLLATERAL_TOKENS[chainId]?.primary;
  const isSingleHop =
    primary &&
    (isTwoStringsEqual(currencyAmountIn.currency.address, primary.address) ||
      isTwoStringsEqual(currencyOut.address, primary.address));
  return SwaprV3Trade.getQuote(
    {
      amount: currencyAmountIn,
      quoteCurrency: currencyOut,
      maximumSlippage,
      recipient: account || zeroAddress,
      tradeType: TradeType.EXACT_INPUT,
    },
    undefined,
    !!isSingleHop,
  );
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

export const getUniswapQuote: QuoteTradeFn = async (
  chainId,
  account,
  amount,
  outcomeToken,
  collateralToken,
  swapType,
  maxSlippage,
) => {
  const args = await getTradeArgsExactIn(chainId, amount, outcomeToken, collateralToken, swapType, maxSlippage);

  const trade = await getUniswapTrade(
    args.currencyIn,
    args.currencyOut,
    args.currencyAmountIn,
    args.maximumSlippage,
    account,
    chainId,
  );
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

export const getSwaprQuote: QuoteTradeFn = async (
  chainId,
  account,
  amount,
  outcomeToken,
  collateralToken,
  swapType,
  maxSlippage,
) => {
  const args = await getTradeArgsExactIn(chainId, amount, outcomeToken, collateralToken, swapType, maxSlippage);

  const trade = await getSwaprTrade(
    args.currencyIn,
    args.currencyOut,
    args.currencyAmountIn,
    args.maximumSlippage,
    account,
    chainId,
  );

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

export function getUniswapTradeExactOut(
  currencyIn: Currency,
  _currencyOut: Currency,
  currencyAmountOut: CurrencyAmount,
  maximumSlippage: Percent,
  account: Address | undefined,
  _chainId: number,
): Promise<UniswapTrade | null> {
  return UniswapTrade.getQuote({
    amount: currencyAmountOut,
    quoteCurrency: currencyIn,
    maximumSlippage,
    recipient: account || zeroAddress,
    tradeType: TradeType.EXACT_OUTPUT,
  });
}

export function getSwaprTradeExactOut(
  currencyIn: Currency,
  currencyOut: Currency,
  currencyAmountOut: CurrencyAmount,
  maximumSlippage: Percent,
  account: Address | undefined,
  chainId: number,
): Promise<SwaprV3Trade | null> {
  const primary = COLLATERAL_TOKENS[chainId]?.primary;
  const isSingleHop =
    primary &&
    (isTwoStringsEqual(currencyIn.address, primary.address) || isTwoStringsEqual(currencyOut.address, primary.address));

  return SwaprV3Trade.getQuote(
    {
      amount: currencyAmountOut,
      quoteCurrency: currencyIn,
      maximumSlippage,
      recipient: account || zeroAddress,
      tradeType: TradeType.EXACT_OUTPUT,
    },
    undefined,
    !!isSingleHop,
  );
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

export const getUniswapQuoteExactOut: QuoteTradeFn = async (
  chainId,
  account,
  amount,
  outcomeToken,
  collateralToken,
  swapType,
  maxSlippage,
) => {
  const args = await getTradeArgsExactOut(chainId, amount, outcomeToken, collateralToken, swapType, maxSlippage);

  const trade = await getUniswapTradeExactOut(
    args.currencyIn,
    args.currencyOut,
    args.currencyAmountOut,
    args.maximumSlippage,
    account,
    chainId,
  );
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

export const getSwaprQuoteExactOut: QuoteTradeFn = async (
  chainId,
  account,
  amount,
  outcomeToken,
  collateralToken,
  swapType,
  maxSlippage,
) => {
  const args = await getTradeArgsExactOut(chainId, amount, outcomeToken, collateralToken, swapType, maxSlippage);

  const trade = await getSwaprTradeExactOut(
    args.currencyIn,
    args.currencyOut,
    args.currencyAmountOut,
    args.maximumSlippage,
    account,
    chainId,
  );

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

export async function fetchSwaprQuote(
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
    ? getSwaprQuote(chainId, account, amount, outcomeToken, collateralToken, swapType, maxSlippage)
    : getSwaprQuoteExactOut(chainId, account, amount, outcomeToken, collateralToken, swapType, maxSlippage);
}

export async function fetchUniswapQuote(
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
    ? getUniswapQuote(chainId, account, amount, outcomeToken, collateralToken, swapType, maxSlippage)
    : getUniswapQuoteExactOut(chainId, account, amount, outcomeToken, collateralToken, swapType, maxSlippage);
}
