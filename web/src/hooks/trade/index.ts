import { createCowOrder, executeCoWTrade } from "@/hooks/trade/executeCowTrade";
import { executeSwaprTrade } from "@/hooks/trade/executeSwaprTrade";
import { executeUniswapTrade } from "@/hooks/trade/executeUniswapTrade";
import { SupportedChain } from "@/lib/chains";
import SEER_ENV from "@/lib/env";
import { queryClient } from "@/lib/query-client";
import { Token } from "@/lib/tokens";
import { QuoteTradeResult, getCowQuote, getSwaprQuote, getUniswapQuote } from "@/lib/trade";
import { getCowQuoteExactOut, getSwaprQuoteExactOut, getUniswapQuoteExactOut } from "@/lib/tradeExactOut";
import { CoWTrade, SwaprV3Trade, Trade, TradeType, UniswapTrade } from "@swapr/sdk";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Address, TransactionReceipt } from "viem";
import { gnosis, mainnet } from "viem/chains";
import { useGlobalState } from "../useGlobalState";
import { useMissingApprovals } from "../useMissingApprovals";

const QUOTE_REFETCH_INTERVAL = Number(SEER_ENV.VITE_QUOTE_REFETCH_INTERVAL) || 30_000;

function useSwaprQuote(
  chainId: number,
  account: Address | undefined,
  amount: string,
  outcomeToken: Token,
  collateralToken: Token,
  swapType: "buy" | "sell",
  enabled = true,
  tradeType: TradeType = TradeType.EXACT_INPUT,
) {
  const maxSlippage = useGlobalState((state) => state.maxSlippage);
  const isInstantSwap = useGlobalState((state) => state.isInstantSwap);
  return useQuery<QuoteTradeResult | undefined, Error>({
    queryKey: [
      "useSwaprQuote",
      chainId,
      account,
      amount.toString(),
      outcomeToken,
      collateralToken,
      swapType,
      maxSlippage,
      isInstantSwap,
      tradeType,
    ],
    enabled: Number(amount) > 0 && chainId === gnosis.id && enabled,
    retry: false,
    queryFn: async () =>
      tradeType === TradeType.EXACT_INPUT
        ? getSwaprQuote(chainId, account, amount, outcomeToken, collateralToken, swapType)
        : getSwaprQuoteExactOut(chainId, account, amount, outcomeToken, collateralToken, swapType),
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
  tradeType: TradeType,
) => ["useCowQuote", chainId, account, amount.toString(), outcomeToken, collateralToken, swapType, tradeType];

export function useCowQuote(
  chainId: number,
  account: Address | undefined,
  amount: string,
  outcomeToken: Token,
  collateralToken: Token,
  swapType: "buy" | "sell",
  enabled = true,
  tradeType: TradeType = TradeType.EXACT_INPUT,
) {
  const maxSlippage = useGlobalState((state) => state.maxSlippage);
  const isInstantSwap = useGlobalState((state) => state.isInstantSwap);
  const queryKey = [
    ...getUseCowQuoteQueryKey(chainId, account, amount, outcomeToken, collateralToken, swapType, tradeType),
    maxSlippage,
    isInstantSwap,
  ];
  const previousData = queryClient.getQueryData(queryKey);
  const isFastQuery = previousData === undefined;
  return useQuery<QuoteTradeResult | undefined, Error>({
    queryKey: queryKey,
    enabled: Number(amount) > 0 && enabled,
    retry: false,
    queryFn: async () =>
      tradeType === TradeType.EXACT_INPUT
        ? getCowQuote(chainId, account, amount, outcomeToken, collateralToken, swapType, isFastQuery)
        : getCowQuoteExactOut(chainId, account, amount, outcomeToken, collateralToken, swapType, isFastQuery),
    refetchInterval: (query) =>
      query.state.dataUpdateCount <= 1 && query.state.errorUpdateCount === 0 ? 1 : QUOTE_REFETCH_INTERVAL,
  });
}

function useUniswapQuote(
  chainId: number,
  account: Address | undefined,
  amount: string,
  outcomeToken: Token,
  collateralToken: Token,
  swapType: "buy" | "sell",
  enabled = true,
  tradeType: TradeType = TradeType.EXACT_INPUT,
) {
  const maxSlippage = useGlobalState((state) => state.maxSlippage);
  const isInstantSwap = useGlobalState((state) => state.isInstantSwap);
  return useQuery<QuoteTradeResult | undefined, Error>({
    queryKey: [
      "useUniswapQuote",
      chainId,
      account,
      amount.toString(),
      outcomeToken,
      collateralToken,
      swapType,
      maxSlippage,
      isInstantSwap,
      tradeType,
    ],
    enabled: Number(amount) > 0 && chainId === mainnet.id && enabled,
    retry: false,
    queryFn: async () =>
      tradeType === TradeType.EXACT_INPUT
        ? getUniswapQuote(chainId, account, amount, outcomeToken, collateralToken, swapType)
        : getUniswapQuoteExactOut(chainId, account, amount, outcomeToken, collateralToken, swapType),
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
  tradeType: TradeType,
) {
  const isInstantSwap = useGlobalState((state) => state.isInstantSwap);
  const cowResult = useCowQuote(
    chainId,
    account,
    amount,
    outcomeToken,
    collateralToken,
    swapType,
    !isInstantSwap,
    tradeType,
  );
  const isCowResultOk = cowResult.status === "success" && cowResult.data?.value && cowResult.data.value > 0n;

  const swaprResult = useSwaprQuote(chainId, account, amount, outcomeToken, collateralToken, swapType, true, tradeType);
  const uniswapResult = useUniswapQuote(
    chainId,
    account,
    amount,
    outcomeToken,
    collateralToken,
    swapType,
    true,
    tradeType,
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
  const { data: missingApprovals, isLoading } = useMissingApprovals({
    tokensAddresses: [trade.executionPrice.baseCurrency.address as `0x${string}`],
    account,
    spender: trade.approveAddress as `0x${string}`,
    amounts: BigInt(trade.inputAmount.raw.toString()),
    chainId: trade.chainId as SupportedChain,
  });

  return { missingApprovals, isLoading };
}

async function tradeTokens({
  trade,
  account,
  isBuyExactOutputNative,
}: { trade: CoWTrade | SwaprV3Trade | UniswapTrade; account: Address; isBuyExactOutputNative: boolean }): Promise<
  string | TransactionReceipt
> {
  if (trade instanceof CoWTrade) {
    return executeCoWTrade(trade);
  }

  if (trade instanceof UniswapTrade) {
    return executeUniswapTrade(trade, account);
  }

  return executeSwaprTrade(trade, account, isBuyExactOutputNative);
}

export function useTrade(onSuccess: () => unknown) {
  const { addPendingOrder } = useGlobalState();
  return useMutation({
    mutationFn: tradeTokens,
    onSuccess: (result: string | TransactionReceipt) => {
      if (typeof result === "string") {
        addPendingOrder(result);
      }
      queryClient.invalidateQueries({ queryKey: ["useMarketPositions"] });
      queryClient.invalidateQueries({ queryKey: ["useTokenBalance"] });
      queryClient.invalidateQueries({ queryKey: ["useTokenBalances"] });
      onSuccess();
    },
  });
}

export function useCowLimitOrder(onSuccess: () => unknown) {
  const { addPendingOrder } = useGlobalState();
  return useMutation({
    mutationFn: createCowOrder,
    onSuccess: (result: string) => {
      addPendingOrder(result);
      queryClient.invalidateQueries({ queryKey: ["useMarketPositions"] });
      queryClient.invalidateQueries({ queryKey: ["useTokenBalance"] });
      queryClient.invalidateQueries({ queryKey: ["useTokenBalances"] });
      onSuccess();
    },
  });
}
