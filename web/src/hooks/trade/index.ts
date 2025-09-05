import { createCowOrder, executeCoWTrade } from "@/hooks/trade/executeCowTrade";
import { executeSwaprTrade, getSwaprTradeExecution } from "@/hooks/trade/executeSwaprTrade";
import { executeUniswapTrade, getUniswapTradeExecution } from "@/hooks/trade/executeUniswapTrade";
import { SupportedChain } from "@/lib/chains";
import SEER_ENV from "@/lib/env";
import { queryClient } from "@/lib/query-client";
import { toastifyTx } from "@/lib/toastify";
import { Token } from "@/lib/tokens";
import { QuoteTradeResult, getCowQuote, getSwaprQuote, getUniswapQuote } from "@/lib/trade";
import { getCowQuoteExactOut, getSwaprQuoteExactOut, getUniswapQuoteExactOut } from "@/lib/tradeExactOut";
import { config } from "@/wagmi";
import { CoWTrade, SwaprV3Trade, Trade, TradeType, UniswapTrade } from "@swapr/sdk";
import { useMutation, useQuery } from "@tanstack/react-query";
import { sendCalls } from "@wagmi/core";
import { Address, TransactionReceipt } from "viem";
import { gnosis, mainnet } from "viem/chains";
import { Execution, useCheck7702Support } from "../useCheck7702Support";
import { useGlobalState } from "../useGlobalState";
import { getApprovals7702, useMissingApprovals } from "../useMissingApprovals";

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
      "useQuote",
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
) => [
  "useQuote",
  "useCowQuote",
  chainId,
  account,
  amount.toString(),
  outcomeToken,
  collateralToken,
  swapType,
  tradeType,
];

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
      "useQuote",
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

function useMissingTradeApproval(account: Address | undefined, trade: Trade | undefined) {
  const { data, isLoading } = useMissingApprovals(
    !trade
      ? undefined
      : {
          tokensAddresses: [trade.executionPrice.baseCurrency.address as `0x${string}`],
          account,
          spender: trade.approveAddress as `0x${string}`,
          amounts: BigInt(trade.maximumAmountIn().raw.toString()),
          chainId: trade.chainId as SupportedChain,
        },
  );

  return { data, isLoading };
}

function getTradeApprovals7702(account: Address, trade: Trade) {
  return getApprovals7702({
    tokensAddresses: [trade.executionPrice.baseCurrency.address as `0x${string}`],
    account,
    spender: trade.approveAddress as `0x${string}`,
    amounts: BigInt(trade.maximumAmountIn().raw.toString()),
    chainId: trade.chainId as SupportedChain,
  });
}

interface TradeTokensProps {
  trade: CoWTrade | SwaprV3Trade | UniswapTrade;
  account: Address;
  isBuyExactOutputNative: boolean;
  isSellToNative: boolean;
}

async function tradeTokens({
  trade,
  account,
  isBuyExactOutputNative,
  isSellToNative,
}: TradeTokensProps): Promise<string | TransactionReceipt> {
  if (trade instanceof CoWTrade) {
    return executeCoWTrade(trade);
  }

  if (trade instanceof UniswapTrade) {
    return executeUniswapTrade(trade, account);
  }

  return executeSwaprTrade(trade, account, isBuyExactOutputNative, isSellToNative);
}

function useTradeLegacy(account: Address | undefined, trade: Trade | undefined, onSuccess: () => unknown) {
  const { addPendingOrder } = useGlobalState();

  const approvals = useMissingTradeApproval(account, trade);

  return {
    approvals,
    tradeTokens: useMutation({
      mutationFn: tradeTokens,
      onSuccess: (result: string | TransactionReceipt) => {
        if (typeof result === "string") {
          addPendingOrder(result);
        }
        queryClient.invalidateQueries({ queryKey: ["useQuote"] });
        queryClient.invalidateQueries({ queryKey: ["useMarketPositions"] });
        queryClient.invalidateQueries({ queryKey: ["useTokenBalance"] });
        queryClient.invalidateQueries({ queryKey: ["useTokenBalances"] });
        onSuccess();
      },
    }),
  };
}

async function tradeTokens7702(
  account: Address,
  trade: Trade,
  props: TradeTokensProps,
): Promise<string | TransactionReceipt> {
  if (props.trade instanceof CoWTrade) {
    return executeCoWTrade(props.trade);
  }

  const calls: Execution[] = getTradeApprovals7702(account, trade);

  calls.push(
    props.trade instanceof UniswapTrade
      ? await getUniswapTradeExecution(props.trade, props.account)
      : await getSwaprTradeExecution(props.trade, props.account, props.isBuyExactOutputNative, props.isSellToNative),
  );

  const result = await toastifyTx(
    () =>
      sendCalls(config, {
        calls,
      }),
    {
      txSent: { title: "Executing trade..." },
      txSuccess: { title: "Trade executed!" },
    },
  );

  if (!result.status) {
    throw result.error;
  }

  return result.receipt;
}

const useTrade7702 = (account: Address | undefined, trade: Trade | undefined, onSuccess: () => unknown) => {
  const { addPendingOrder } = useGlobalState();

  const approvals = {
    data: [],
    isLoading: false,
  };

  return {
    approvals,
    tradeTokens: useMutation({
      mutationFn: (props: TradeTokensProps) => tradeTokens7702(account!, trade!, props),
      onSuccess: (result: string | TransactionReceipt) => {
        if (typeof result === "string") {
          addPendingOrder(result);
        }
        queryClient.invalidateQueries({ queryKey: ["useQuote"] });
        queryClient.invalidateQueries({ queryKey: ["useMarketPositions"] });
        queryClient.invalidateQueries({ queryKey: ["useTokenBalance"] });
        queryClient.invalidateQueries({ queryKey: ["useTokenBalances"] });
        onSuccess();
      },
    }),
  };
};

export const useTrade = (account: Address | undefined, trade: Trade | undefined, onSuccess: () => unknown) => {
  const supports7702 = useCheck7702Support();
  const trade7702 = useTrade7702(account, trade, onSuccess);
  const tradeLegacy = useTradeLegacy(account, trade, onSuccess);

  return supports7702 ? trade7702 : tradeLegacy;
};

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
