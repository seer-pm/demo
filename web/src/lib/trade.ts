import { buildSwaprTrade } from "@/hooks/trade/executeSwaprTrade";
import { buildUniswapTrade } from "@/hooks/trade/executeUniswapTrade";
import { Execution } from "@/hooks/useCheck7702Support";
import { useGlobalState } from "@/hooks/useGlobalState";
import { getApprovals7702 } from "@/hooks/useMissingApprovals";
import { getSplitMergeRedeemCollateral } from "@/hooks/useSelectedCollateral";
import { splitFromRouter } from "@/hooks/useSplitPosition";
import { NATIVE_TOKEN, isTwoStringsEqual, parseFraction } from "@/lib/utils";
import { config } from "@/wagmi";
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
import { sendCalls } from "@wagmi/core";
import { Address, formatUnits, parseUnits, zeroAddress } from "viem";
import { gnosis } from "viem/chains";
import { SupportedChain } from "./chains";
import { COLLATERAL_TOKENS, getRouterAddress } from "./config";
import { Market } from "./market";
import { toastifyTx } from "./toastify";
import { Token } from "./tokens";

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
) {
  const [buyToken, sellToken] =
    swapType === "buy" ? [outcomeToken, collateralToken] : ([collateralToken, outcomeToken] as [Token, Token]);

  const sellAmount = parseUnits(String(amount), sellToken.decimals);

  const { currencyIn, currencyOut, currencyAmountIn } = getCurrenciesFromTokens(chainId, buyToken, sellToken, amount);

  const slippage = String(Number(useGlobalState.getState().maxSlippage) / 100);
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
  isFastQuery?: boolean,
) => {
  const args = await getTradeArgs(chainId, amount, outcomeToken, collateralToken, swapType);

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
) => {
  const args = await getTradeArgs(chainId, amount, outcomeToken, collateralToken, swapType);

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
) => {
  const args = await getTradeArgs(chainId, amount, outcomeToken, collateralToken, swapType);

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

// sell others to rebuy outcome
export const getRebuyQuote = async (
  chainId: number,
  account: Address | undefined,
  market: Market,
  amount: string,
  outcomeToken: Token,
  collateralToken: Token,
) => {
  const getTradeFn = chainId === gnosis.id ? getSwaprTrade : getUniswapTrade;
  const sellOthers = await Promise.all(
    market.wrappedTokens.map(async (token) => {
      if (!isTwoStringsEqual(token, outcomeToken.address)) {
        const args = await getTradeArgs(
          chainId,
          amount,
          { address: token, symbol: "SEER_OUTCOME", decimals: 18 },
          collateralToken,
          "sell",
        );

        const trade = await getTradeFn(
          args.currencyIn,
          args.currencyOut,
          args.currencyAmountIn,
          args.maximumSlippage,
          account,
          chainId,
        );

        if (trade) {
          return {
            value: BigInt(trade.outputAmount.raw.toString()),
            decimals: args.sellToken.decimals,
            trade,
            buyToken: args.buyToken.address,
            sellToken: args.sellToken.address,
            sellAmount: args.sellAmount.toString(),
            swapType: "sell",
          };
        }
      }
    }),
  );
  const rebuyAmount = formatUnits(
    sellOthers.filter((x) => x).reduce((acc, curr) => acc + BigInt(curr!.value), 0n),
    18,
  );
  const args = await getTradeArgs(chainId, rebuyAmount, outcomeToken, collateralToken, "buy");

  const trade = await getTradeFn(
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
  return [
    ...sellOthers.filter((x) => x),
    {
      value: BigInt(trade.outputAmount.raw.toString()),
      decimals: args.sellToken.decimals,
      trade,
      buyToken: args.buyToken.address,
      sellToken: args.sellToken.address,
      sellAmount: args.sellAmount.toString(),
      swapType: "buy",
    },
  ];
};

//mint -> sell others -> rebuy
export const complexSwap = async (
  account: Address,
  market: Market,
  selectedCollateral: Token,
  amount: string,
  useAltCollateral: boolean,
  quotes: QuoteTradeResult[],
  isBuyExactOutputNative: boolean,
  isSellToNative: boolean,
) => {
  const parsedAmount = parseUnits(amount ?? "0", selectedCollateral.decimals);
  const router = getRouterAddress(market);

  //get split approvals
  const splitApprovalConfig = {
    tokensAddresses: selectedCollateral.address !== NATIVE_TOKEN ? [selectedCollateral.address] : [],
    account,
    spender: router,
    amounts: parsedAmount,
    chainId: market.chainId,
  };
  const calls: Execution[] = getApprovals7702(splitApprovalConfig);

  //get trade approvals (sell -> rebuy)
  for (const { trade } of quotes) {
    const quoteApprovalConfig = {
      tokensAddresses: [trade.executionPrice.baseCurrency.address as `0x${string}`],
      account,
      spender: trade.approveAddress as `0x${string}`,
      amounts: BigInt(trade.maximumAmountIn().raw.toString()),
      chainId: trade.chainId as SupportedChain,
    };
    calls.push(...getApprovals7702(quoteApprovalConfig));
  }

  // push split transaction
  calls.push(
    splitFromRouter(
      getSplitMergeRedeemCollateral(market, selectedCollateral, useAltCollateral),
      router,
      market,
      parsedAmount,
    ),
  );

  // push trade transactions
  const tradeTransactions = await Promise.all(
    quotes.map((quote) =>
      market.chainId === gnosis.id
        ? buildSwaprTrade(quote.trade as SwaprV3Trade, account, isBuyExactOutputNative, isSellToNative)
        : buildUniswapTrade(quote.trade as UniswapTrade, account),
    ),
  );
  calls.push(...tradeTransactions);

  const result = await toastifyTx(
    () =>
      sendCalls(config, {
        calls,
      }),
    {
      txSent: { title: "Minting tokens..." },
      txSuccess: { title: "Tokens minted!" },
    },
  );

  if (!result.status) {
    throw result.error;
  }

  return result.receipt;
};
