import { executeCoWTrade } from "@/hooks/trade/executeCowTrade";
import { executeSwaprTrade } from "@/hooks/trade/executeSwaprTrade";
import { executeUniswapTrade } from "@/hooks/trade/executeUniswapTrade";
import { queryClient } from "@/lib/query-client";
import { Token } from "@/lib/tokens";
import { NATIVE_TOKEN, parseFraction } from "@/lib/utils";
import {
  CoWTrade,
  Currency,
  CurrencyAmount,
  Percent,
  SwaprV3Trade,
  Token as SwaprToken,
  TokenAmount,
  Trade,
  TradeType,
  UniswapTrade,
  WXDAI,
} from "@swapr/sdk";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Address, TransactionReceipt, parseUnits, zeroAddress } from "viem";
import { gnosis } from "viem/chains";
import { useGlobalState } from "../useGlobalState";
import { useMissingApprovals } from "../useMissingApprovals";

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
  _currencyIn: SwaprToken,
  currencyOut: SwaprToken,
  currencyAmountIn: TokenAmount,
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

function getSwaprTrade(
  currencyIn: SwaprToken,
  currencyOut: SwaprToken,
  currencyAmountIn: TokenAmount,
  maximumSlippage: Percent,
  account: Address | undefined,
  chainId: number,
): Promise<SwaprV3Trade | null> {
  if (
    chainId === gnosis.id &&
    (currencyIn.address === WXDAI[chainId].address || currencyOut.address === WXDAI[chainId].address)
  ) {
    // build the route using the intermediate WXDAI<>sDAI pool
    const SDAI = new SwaprToken(chainId, "0xaf204776c7245bf4147c2612bf6e5972ee483701", 18, "sDAI");
    const path: Currency[] = [currencyIn, SDAI, currencyOut];

    return SwaprV3Trade.getQuoteWithPath({
      amount: currencyAmountIn,
      path,
      maximumSlippage,
      recipient: account || zeroAddress,
      tradeType: TradeType.EXACT_INPUT,
    });
  }
  if (
    chainId === gnosis.id &&
    (currencyIn.address.toLowerCase() === NATIVE_TOKEN || currencyOut.address.toLowerCase() === NATIVE_TOKEN)
  ) {
    // build the route using the intermediate WXDAI<>sDAI pool
    const SDAI = new SwaprToken(chainId, "0xaf204776c7245bf4147c2612bf6e5972ee483701", 18, "sDAI");
    const pathBuy: Currency[] = [WXDAI[chainId], SDAI, currencyOut];
    const pathSell: Currency[] = [currencyIn, SDAI, WXDAI[chainId]];

    return SwaprV3Trade.getQuoteWithPath({
      amount:
        currencyIn.address.toLowerCase() === NATIVE_TOKEN
          ? CurrencyAmount.nativeCurrency(BigInt(currencyAmountIn.raw.toString()), chainId)
          : currencyAmountIn,
      path: currencyIn.address.toLowerCase() === NATIVE_TOKEN ? pathBuy : pathSell,
      maximumSlippage,
      recipient: account || zeroAddress,
      tradeType: TradeType.EXACT_INPUT,
    }).then((trade) => {
      if (trade && currencyOut.address.toLowerCase() === NATIVE_TOKEN) {
        // change outputAmount to XDAI instead of WXDAI
        return new SwaprV3Trade({
          maximumSlippage: trade.maximumSlippage,
          inputAmount: trade.inputAmount,
          outputAmount: CurrencyAmount.nativeCurrency(BigInt(trade.outputAmount.raw.toString()), chainId),
          tradeType: TradeType.EXACT_INPUT,
          chainId,
          priceImpact: trade.priceImpact,
          fee: trade.fee,
        });
      }
      return trade;
    });
  }

  return SwaprV3Trade.getQuote({
    amount: currencyAmountIn,
    quoteCurrency: currencyOut,
    maximumSlippage,
    recipient: account || zeroAddress,
    tradeType: TradeType.EXACT_INPUT,
  });
}

type QuoteTradeFn = (
  chainId: number,
  account: Address | undefined,
  amount: string,
  outcomeToken: Token,
  collateralToken: Token,
  swapType: "buy" | "sell",
) => Promise<QuoteTradeResult>;

export const getUniswapQuote: QuoteTradeFn = async (
  chainId: number,
  account: Address | undefined,
  amount: string,
  outcomeToken: Token,
  collateralToken: Token,
  swapType: "buy" | "sell",
) => {
  const args = getTradeArgs(chainId, amount, outcomeToken, collateralToken, swapType);

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
  const args = getTradeArgs(chainId, amount, outcomeToken, collateralToken, swapType);

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
) => {
  const args = getTradeArgs(chainId, amount, outcomeToken, collateralToken, swapType);

  const trade = await CoWTrade.bestTradeExactIn({
    currencyAmountIn: args.currencyAmountIn,
    currencyOut: args.currencyOut,
    maximumSlippage: args.maximumSlippage,
    user: account || zeroAddress,
    receiver: account || zeroAddress,
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

function getTradeArgs(
  chainId: number,
  amount: string,
  outcomeToken: Token,
  collateralToken: Token,
  swapType: "buy" | "sell",
) {
  const [buyToken, sellToken] =
    swapType === "buy" ? [outcomeToken, collateralToken] : ([collateralToken, outcomeToken] as [Token, Token]);

  const sellAmount = parseUnits(String(amount), sellToken.decimals);

  const currencyIn = new SwaprToken(chainId, sellToken.address, sellToken.decimals, sellToken.symbol);
  const currencyOut = new SwaprToken(chainId, buyToken.address, buyToken.decimals, buyToken.symbol);

  const currencyAmountIn = new TokenAmount(currencyIn, parseUnits(String(amount), currencyIn.decimals));

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
) {
  return useQuery<QuoteTradeResult | undefined, Error>({
    queryKey: ["useSwaprQuote", chainId, account, amount.toString(), outcomeToken, collateralToken, swapType],
    enabled: Number(amount) > 0,
    retry: false,
    queryFn: async () => getSwaprQuote(chainId, account, amount, outcomeToken, collateralToken, swapType),
  });
}

export function useCowQuote(
  chainId: number,
  account: Address | undefined,
  amount: string,
  outcomeToken: Token,
  collateralToken: Token,
  swapType: "buy" | "sell",
) {
  return useQuery<QuoteTradeResult | undefined, Error>({
    queryKey: ["useCowQuote", chainId, account, amount.toString(), outcomeToken, collateralToken, swapType],
    enabled: Number(amount) > 0,
    retry: false,
    queryFn: async () => getCowQuote(chainId, account, amount, outcomeToken, collateralToken, swapType),
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
  const swaprResult = useSwaprQuote(chainId, account, amount, outcomeToken, collateralToken, swapType);
  const cowResult = useCowQuote(chainId, account, amount, outcomeToken, collateralToken, swapType);

  if (cowResult.status === "success" && cowResult.data?.value && cowResult.data.value > 0n) {
    return cowResult;
  }

  return swaprResult;
}

export function useMissingTradeApproval(account: Address, trade: Trade) {
  const { data: missingApprovals } = useMissingApprovals(
    [trade.executionPrice.baseCurrency.address as `0x${string}`],
    account,
    trade.approveAddress as `0x${string}`,
    BigInt(trade.inputAmount.raw.toString()),
  );

  return missingApprovals;
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
