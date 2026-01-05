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
  const isSingleHop =
    isTwoStringsEqual(
      currencyAmountIn.currency.address,
      COLLATERAL_TOKENS[chainId as SupportedChain].primary.address,
    ) || isTwoStringsEqual(currencyOut.address, COLLATERAL_TOKENS[chainId as SupportedChain].primary.address);
  return SwaprV3Trade.getQuote(
    {
      amount: currencyAmountIn,
      quoteCurrency: currencyOut,
      maximumSlippage,
      recipient: account || zeroAddress,
      tradeType: TradeType.EXACT_INPUT,
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

  const sellAmount = parseUnits(String(amount), sellToken.decimals);

  const { currencyIn, currencyOut, currencyAmountIn } = getCurrenciesFromTokens(chainId, buyToken, sellToken, amount);

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
  chainId: number,
  account: Address | undefined,
  amount: string,
  outcomeToken: Token,
  collateralToken: Token,
  swapType: "buy" | "sell",
  maxSlippage: string,
) => {
  const args = await getTradeArgs(chainId, amount, outcomeToken, collateralToken, swapType, maxSlippage);

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
  chainId: number,
  account: Address | undefined,
  amount: string,
  outcomeToken: Token,
  collateralToken: Token,
  swapType: "buy" | "sell",
  maxSlippage: string,
) => {
  const args = await getTradeArgs(chainId, amount, outcomeToken, collateralToken, swapType, maxSlippage);

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
