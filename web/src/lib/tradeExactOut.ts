import { TradeManagerTrade } from "@/hooks/trade/TradeManagerTrade";
import { NATIVE_TOKEN, isTwoStringsEqual, parseFraction } from "@/lib/utils";
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
import { Address, parseUnits, zeroAddress } from "viem";
import { SupportedChain } from "./chains";
import { COLLATERAL_TOKENS } from "./config";
import { Token } from "./tokens";

export interface QuoteTradeResult {
  value: bigint;
  decimals: number;
  buyToken: Address;
  sellToken: Address;
  sellAmount: string;
  swapType: "buy" | "sell";
  trade: CoWTrade | SwaprV3Trade | UniswapTrade | TradeManagerTrade;
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
  const isSingleHop =
    isTwoStringsEqual(currencyIn.address, COLLATERAL_TOKENS[chainId as SupportedChain].primary.address) ||
    isTwoStringsEqual(currencyOut.address, COLLATERAL_TOKENS[chainId as SupportedChain].primary.address);

  return SwaprV3Trade.getQuote(
    {
      amount: currencyAmountOut,
      quoteCurrency: currencyIn,
      maximumSlippage,
      recipient: account || zeroAddress,
      tradeType: TradeType.EXACT_OUTPUT,
    },
    undefined,
    isSingleHop,
  );
}

function getCurrenciesFromTokens(
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

export async function getTradeArgs(
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

  const { currencyIn, currencyOut, currencyAmountOut } = getCurrenciesFromTokens(chainId, buyToken, sellToken, amount);

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

export function tryGetChainId(currencyAmount: CurrencyAmount, currency: Currency) {
  return currencyAmount instanceof TokenAmount
    ? currencyAmount.token.chainId
    : currency instanceof SwaprToken
      ? currency.chainId
      : undefined;
}

export const getCowQuoteExactOut: QuoteTradeFn = async (
  chainId: number,
  account: Address | undefined,
  amount: string,
  outcomeToken: Token,
  collateralToken: Token,
  swapType: "buy" | "sell",
  maxSlippage: string,
  isFastQuery?: boolean,
) => {
  const args = await getTradeArgs(chainId, amount, outcomeToken, collateralToken, swapType, maxSlippage);
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
  chainId: number,
  account: Address | undefined,
  amount: string,
  outcomeToken: Token,
  collateralToken: Token,
  swapType: "buy" | "sell",
  maxSlippage: string,
) => {
  const args = await getTradeArgs(chainId, amount, outcomeToken, collateralToken, swapType, maxSlippage);

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
  chainId: number,
  account: Address | undefined,
  amount: string,
  outcomeToken: Token,
  collateralToken: Token,
  swapType: "buy" | "sell",
  maxSlippage: string,
) => {
  const args = await getTradeArgs(chainId, amount, outcomeToken, collateralToken, swapType, maxSlippage);

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
