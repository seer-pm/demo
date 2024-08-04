import { executeCoWTrade } from "@/hooks/trade/executeCowTrade";
import { executeSwaprTrade } from "@/hooks/trade/executeSwaprTrade";
import { queryClient } from "@/lib/query-client";
import { Token } from "@/lib/tokens";
import { NATIVE_TOKEN } from "@/lib/utils";
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
} from "@swapr/sdk";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Address, TransactionReceipt, isAddressEqual, parseUnits, zeroAddress } from "viem";
import { useGlobalState } from "../useGlobalState";
import { useMissingApprovals } from "../useMissingApprovals";

export interface QuoteTradeResult {
  value: bigint;
  decimals: number;
  buyToken: Address;
  sellToken: Address;
  sellAmount: string;
  swapType: "buy" | "sell";
  trade: CoWTrade | SwaprV3Trade;
}

type QuoteTradeFn = (
  chainId: number,
  account: Address | undefined,
  amount: string,
  outcomeToken: Token,
  collateralToken: Token,
  swapType: "buy" | "sell",
) => Promise<QuoteTradeResult>;

export const getSwaprQuote: QuoteTradeFn = async (
  chainId: number,
  account: Address | undefined,
  amount: string,
  outcomeToken: Token,
  collateralToken: Token,
  swapType: "buy" | "sell",
) => {
  const args = getTradeArgs(chainId, amount, outcomeToken, collateralToken, swapType);

  const trade = await SwaprV3Trade.getQuote({
    amount: args.currencyAmountIn,
    quoteCurrency: args.currencyOut,
    maximumSlippage: args.maximumSlippage,
    recipient: account || zeroAddress,
    tradeType: TradeType.EXACT_INPUT,
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

function getCurrencyOrTokenIn(
  sellToken: Token,
  amount: string,
  chainId: number,
): { currencyIn: Currency; currencyAmountIn: CurrencyAmount } | { currencyIn: Token; currencyAmountIn: TokenAmount } {
  if (isAddressEqual(sellToken.address, NATIVE_TOKEN)) {
    const currencyIn = Currency.getNative(chainId);
    return {
      currencyIn: currencyIn,
      currencyAmountIn: CurrencyAmount.nativeCurrency(parseUnits(String(amount), currencyIn.decimals), chainId),
    };
  }

  const currencyIn = new SwaprToken(chainId, sellToken.address, sellToken.decimals, sellToken.symbol);
  return {
    currencyIn,
    currencyAmountIn: new TokenAmount(currencyIn, parseUnits(String(amount), currencyIn.decimals)),
  };
}

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

  const { currencyIn, currencyAmountIn } = getCurrencyOrTokenIn(sellToken, amount, chainId);

  const currencyOut = new SwaprToken(chainId, buyToken.address, buyToken.decimals, buyToken.symbol);

  const maximumSlippage = new Percent("1", "100");

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
  trade: CoWTrade | SwaprV3Trade;
  account: Address;
}): Promise<string | TransactionReceipt> {
  if (trade instanceof CoWTrade) {
    return executeCoWTrade(trade);
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
      queryClient.invalidateQueries({ queryKey: ["useUserPositions"] });
      queryClient.invalidateQueries({ queryKey: ["useTokenBalance"] });
      queryClient.invalidateQueries({ queryKey: ["useTokenBalances"] });
      onSuccess();
    },
  });
}
