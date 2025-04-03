import { executeCoWTrade } from "@/hooks/trade/executeCowTrade";
import { executeSwaprTrade } from "@/hooks/trade/executeSwaprTrade";
import { executeUniswapTrade } from "@/hooks/trade/executeUniswapTrade";
import { SupportedChain } from "@/lib/chains";
import SEER_ENV from "@/lib/env";
import { queryClient } from "@/lib/query-client";
import { Token } from "@/lib/tokens";
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
  Trade,
  TradeType,
  UniswapTrade,
} from "@swapr/sdk";
import { useMutation, useQuery } from "@tanstack/react-query";
import pLimit from "p-limit";
import { Address, TransactionReceipt, parseUnits, zeroAddress } from "viem";
import { gnosis, mainnet } from "viem/chains";
import { useGlobalState } from "../useGlobalState";
import { useMissingApprovals } from "../useMissingApprovals";

const QUOTE_REFETCH_INTERVAL = Number(SEER_ENV.VITE_QUOTE_REFETCH_INTERVAL) || 30_000;

export interface QuoteTradeResult {
  value: bigint;
  decimals: number;
  buyToken: Address;
  sellToken: Address;
  sellAmount: string;
  swapType: "buy" | "sell";
  trade: CoWTrade | SwaprV3Trade | UniswapTrade;
}

function getUniswapTrade(
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

const limit = pLimit(3);

function getSwaprTrade(
  _currencyIn: Currency,
  currencyOut: Currency,
  currencyAmountIn: CurrencyAmount,
  maximumSlippage: Percent,
  account: Address | undefined,
  _chainId: number,
): Promise<SwaprV3Trade | null> {
  return limit(() =>
    SwaprV3Trade.getQuote({
      amount: currencyAmountIn,
      quoteCurrency: currencyOut,
      maximumSlippage,
      recipient: account || zeroAddress,
      tradeType: TradeType.EXACT_INPUT,
    }),
  );
}

type QuoteTradeFn = (
  chainId: number,
  account: Address | undefined,
  amount: string,
  outcomeToken: Token,
  collateralToken: Token,
  swapType: "buy" | "sell",
  isFastQuery?: boolean,
) => Promise<QuoteTradeResult>;

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
    priceQuality: isFastQuery ? PriceQuality.FAST : undefined,
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

// async function convertCollateralToShares(
//   chainId: number,
//   amount: string,
//   collateralToken: Token,
//   swapType: "buy" | "sell",
// ) {
//   const sDAI = COLLATERAL_TOKENS[chainId].primary;
//   if (swapType === "sell" || (swapType === "buy" && isTwoStringsEqual(collateralToken.address, sDAI.address))) {
//     return { amount, collateralToken: sDAI };
//   }

//   const newAmount = await convertToSDAI({ amount: parseUnits(String(amount), collateralToken.decimals), chainId });
//   return { amount: formatUnits(newAmount, sDAI.decimals), collateralToken: sDAI };
// }

// export function iswxsDAI(token: Token, chainId: number) {
//   return (
//     isTwoStringsEqual(token.address, COLLATERAL_TOKENS[chainId].primary.address) || // sDAI
//     (chainId === gnosis.id && isTwoStringsEqual(token.address, NATIVE_TOKEN)) || // xDAI
//     isTwoStringsEqual(token.address, WXDAI[chainId]?.address) || // wxDAI
//     isTwoStringsEqual(token.address, DAI[chainId]?.address)
//   );
// }

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

async function getTradeArgs(
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

export function useSwaprQuote(
  chainId: number,
  account: Address | undefined,
  amount: string,
  outcomeToken: Token,
  collateralToken: Token,
  swapType: "buy" | "sell",
  enabled: boolean,
) {
  return useQuery<QuoteTradeResult | undefined, Error>({
    queryKey: ["useSwaprQuote", chainId, account, amount.toString(), outcomeToken, collateralToken, swapType],
    enabled: Number(amount) > 0 && chainId === gnosis.id && enabled,
    retry: false,
    queryFn: async () => getSwaprQuote(chainId, account, amount, outcomeToken, collateralToken, swapType),
    refetchInterval: QUOTE_REFETCH_INTERVAL,
  });
}

const getUseCowQuoteQueryKey = (
  chainId: number,
  account: Address | undefined,
  amount: string,
  outcomeToken: Token,
  collateralToken: Token,
  swapType: "buy" | "sell",
) => ["useCowQuote", chainId, account, amount.toString(), outcomeToken, collateralToken, swapType];

export function useCowQuote(
  chainId: number,
  account: Address | undefined,
  amount: string,
  outcomeToken: Token,
  collateralToken: Token,
  swapType: "buy" | "sell",
) {
  const queryKey = getUseCowQuoteQueryKey(chainId, account, amount, outcomeToken, collateralToken, swapType);
  // Check if we have data for this quote
  // If we don't, perform an initial fetch to give the user a fast quote
  // it will fill the query cache, and subsequent fetches will return the verified quote
  const previousData = queryClient.getQueryData(queryKey);
  const isFastQuery = previousData === undefined;
  return useQuery<QuoteTradeResult | undefined, Error>({
    queryKey: queryKey,
    enabled: Number(amount) > 0,
    retry: false,
    queryFn: async () => getCowQuote(chainId, account, amount, outcomeToken, collateralToken, swapType, isFastQuery),
    // If we used a fast quote, refetch immediately to obtain the verified quote
    refetchInterval: (query) => (query.state.dataUpdateCount <= 1 ? 1 : QUOTE_REFETCH_INTERVAL),
  });
}

export function useUniswapQuote(
  chainId: number,
  account: Address | undefined,
  amount: string,
  outcomeToken: Token,
  collateralToken: Token,
  swapType: "buy" | "sell",
  enabled: boolean,
) {
  return useQuery<QuoteTradeResult | undefined, Error>({
    queryKey: ["useUniswapQuote", chainId, account, amount.toString(), outcomeToken, collateralToken, swapType],
    enabled: Number(amount) > 0 && chainId === mainnet.id && enabled,
    retry: false,
    queryFn: async () => getUniswapQuote(chainId, account, amount, outcomeToken, collateralToken, swapType),
    refetchInterval: QUOTE_REFETCH_INTERVAL,
  });
}

export function useQuoteTrade(
  chainId: number,
  account: Address | undefined,
  amount: string,
  outcomeToken: Token,
  collateralToken: Token,
  swapType: "buy" | "sell",
) {
  // try to get cow quote first, if not success we will get other sources
  const cowResult = useCowQuote(chainId, account, amount, outcomeToken, collateralToken, swapType);
  const isCowResultOk = cowResult.status === "success" && cowResult.data?.value && cowResult.data.value > 0n;

  const swaprResult = useSwaprQuote(chainId, account, amount, outcomeToken, collateralToken, swapType, !isCowResultOk);
  const uniswapResult = useUniswapQuote(
    chainId,
    account,
    amount,
    outcomeToken,
    collateralToken,
    swapType,
    !isCowResultOk,
  );

  if (isCowResultOk) {
    return cowResult;
  }

  if (chainId === mainnet.id) {
    return uniswapResult;
  }
  return swaprResult;
}

export function useMissingTradeApproval(account: Address, trade: Trade) {
  const { data: missingApprovals, isLoading } = useMissingApprovals(
    [trade.executionPrice.baseCurrency.address as `0x${string}`],
    account,
    trade.approveAddress as `0x${string}`,
    BigInt(trade.inputAmount.raw.toString()),
    trade.chainId as SupportedChain,
  );

  return { missingApprovals, isLoading };
}

async function tradeTokens({
  trade,
  account,
}: {
  trade: CoWTrade | SwaprV3Trade | UniswapTrade;
  account: Address;
}): Promise<string | TransactionReceipt> {
  if (trade instanceof CoWTrade) {
    return executeCoWTrade(trade);
  }

  if (trade instanceof UniswapTrade) {
    return executeUniswapTrade(trade, account);
  }

  return executeSwaprTrade(trade, account);
}

export function useTrade(onSuccess: () => unknown) {
  const { addPendingOrder } = useGlobalState();
  return useMutation({
    mutationFn: tradeTokens,
    onSuccess: (result: string | TransactionReceipt) => {
      if (typeof result === "string") {
        // cowswap order id
        addPendingOrder(result);
      }
      queryClient.invalidateQueries({ queryKey: ["useMarketPositions"] });
      queryClient.invalidateQueries({ queryKey: ["useTokenBalance"] });
      queryClient.invalidateQueries({ queryKey: ["useTokenBalances"] });
      onSuccess();
    },
  });
}
