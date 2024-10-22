import { executeCoWTrade } from "@/hooks/trade/executeCowTrade";
import { executeSwaprTrade } from "@/hooks/trade/executeSwaprTrade";
import { executeUniswapTrade } from "@/hooks/trade/executeUniswapTrade";
import { SupportedChain } from "@/lib/chains";
import { COLLATERAL_TOKENS } from "@/lib/config";
import { queryClient } from "@/lib/query-client";
import { Token } from "@/lib/tokens";
import { NATIVE_TOKEN, isTwoStringsEqual, parseFraction } from "@/lib/utils";
import {
  CoWTrade,
  CurrencyAmount,
  Percent,
  Token as SwaprToken,
  SwaprV3Trade,
  TokenAmount,
  Trade,
  TradeType,
  UniswapTrade,
  WXDAI,
} from "@swapr/sdk";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Address, TransactionReceipt, formatUnits, parseUnits, zeroAddress } from "viem";
import { gnosis, mainnet } from "viem/chains";
import { useGlobalState } from "../useGlobalState";
import { useMissingApprovals } from "../useMissingApprovals";
import { convertToSDAI } from "./handleSDAI";

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
  _currencyIn: SwaprToken,
  currencyOut: SwaprToken,
  currencyAmountIn: TokenAmount,
  maximumSlippage: Percent,
  account: Address | undefined,
  _chainId: number,
): Promise<SwaprV3Trade | null> {
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
) => {
  const args = await getCowTradeArgs(chainId, amount, outcomeToken, collateralToken, swapType);

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

async function convertCollateralToShares(
  chainId: number,
  amount: string,
  collateralToken: Token,
  swapType: "buy" | "sell",
) {
  const sDAI = COLLATERAL_TOKENS[chainId].primary;
  if (swapType === "sell" || (swapType === "buy" && isTwoStringsEqual(collateralToken.address, sDAI.address))) {
    return { amount, collateralToken: sDAI };
  }

  const newAmount = await convertToSDAI({ amount: parseUnits(String(amount), collateralToken.decimals), chainId });
  return { amount: formatUnits(newAmount, sDAI.decimals), collateralToken: sDAI };
}

export function iswxsDAI(token: Token, chainId: number) {
  return (
    isTwoStringsEqual(token.address, COLLATERAL_TOKENS[chainId].primary.address) || // sDAI
    (chainId === gnosis.id && isTwoStringsEqual(token.address, NATIVE_TOKEN)) || // xDAI
    isTwoStringsEqual(token.address, WXDAI[chainId]?.address) // wxDAI
  );
}

async function getTradeArgs(
  chainId: number,
  initialAmount: string,
  outcomeToken: Token,
  initialCollateralToken: Token,
  swapType: "buy" | "sell",
) {
  // convert wxdai,xdai or dai to sDAI
  const { amount, collateralToken } = iswxsDAI(initialCollateralToken, chainId)
    ? await convertCollateralToShares(chainId, initialAmount, initialCollateralToken, swapType)
    : { amount: initialAmount, collateralToken: initialCollateralToken };
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

async function getCowTradeArgs(
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
  let currencyAmountIn: CurrencyAmount;
  if (isTwoStringsEqual(sellToken.address, NATIVE_TOKEN)) {
    currencyAmountIn = CurrencyAmount.nativeCurrency(parseUnits(String(amount), currencyIn.decimals), chainId);
  } else {
    currencyAmountIn = new TokenAmount(currencyIn, parseUnits(String(amount), currencyIn.decimals));
  }

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
    enabled: Number(amount) > 0 && chainId === gnosis.id,
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

export function useUniswapQuote(
  chainId: number,
  account: Address | undefined,
  amount: string,
  outcomeToken: Token,
  collateralToken: Token,
  swapType: "buy" | "sell",
) {
  return useQuery<QuoteTradeResult | undefined, Error>({
    queryKey: ["useUniswapQuote", chainId, account, amount.toString(), outcomeToken, collateralToken, swapType],
    enabled: Number(amount) > 0 && chainId === mainnet.id,
    retry: false,
    queryFn: async () => getUniswapQuote(chainId, account, amount, outcomeToken, collateralToken, swapType),
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
  const uniswapResult = useUniswapQuote(chainId, account, amount, outcomeToken, collateralToken, swapType);

  if (cowResult.status === "success" && cowResult.data?.value && cowResult.data.value > 0n) {
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
  collateral,
  originalAmount,
}: {
  trade: CoWTrade | SwaprV3Trade | UniswapTrade;
  account: Address;
  collateral: Token;
  originalAmount: string;
}): Promise<string | TransactionReceipt> {
  if (trade instanceof CoWTrade) {
    return executeCoWTrade(trade);
  }

  if (trade instanceof UniswapTrade) {
    return executeUniswapTrade(trade, account, collateral, originalAmount);
  }

  return executeSwaprTrade(trade, account, collateral, originalAmount);
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
