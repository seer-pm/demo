import { createCowOrder, executeCoWTrade } from "@/hooks/trade/executeCowTrade";
import { executeSwaprTrade, getSwaprTradeExecution } from "@/hooks/trade/executeSwaprTrade";
import { executeUniswapTrade, getUniswapTradeExecution } from "@/hooks/trade/executeUniswapTrade";
import { SupportedChain } from "@/lib/chains";
import { COLLATERAL_TOKENS, isSeerCredits } from "@/lib/config";
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
import { Interface } from "ethers/lib/utils";
import { Address, TransactionReceipt } from "viem";
import { base, gnosis, mainnet, optimism } from "viem/chains";
import { Execution, useCheck7702Support } from "../useCheck7702Support";
import { useGlobalState } from "../useGlobalState";
import { getApprovals7702, useMissingApprovals } from "../useMissingApprovals";
import { UNISWAP_ROUTER_ABI } from "./abis";
import { getWrappedSeerCreditsExecution } from "./utils";

const QUOTE_REFETCH_INTERVAL = Number(SEER_ENV.VITE_QUOTE_REFETCH_INTERVAL) || 30_000;

const EMPTY_APPROVALS = {
  data: [],
  isLoading: false,
};

function useSwaprQuote(
  chainId: number,
  account: Address | undefined,
  amount: string,
  outcomeToken: Token,
  collateralToken: Token,
  swapType: "buy" | "sell",
  enabled: boolean,
  tradeType: TradeType,
  maxSlippage: string,
) {
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
      tradeType,
    ],
    enabled: Number(amount) > 0 && chainId === gnosis.id && enabled,
    retry: false,
    queryFn: async () =>
      tradeType === TradeType.EXACT_INPUT
        ? getSwaprQuote(chainId, account, amount, outcomeToken, collateralToken, swapType, maxSlippage)
        : getSwaprQuoteExactOut(chainId, account, amount, outcomeToken, collateralToken, swapType, maxSlippage),
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
  maxSlippage: string,
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
  maxSlippage,
];

export function useCowQuote(
  chainId: number,
  account: Address | undefined,
  amount: string,
  outcomeToken: Token,
  collateralToken: Token,
  swapType: "buy" | "sell",
  enabled: boolean,
  tradeType: TradeType,
  maxSlippage: string,
) {
  const queryKey = getUseCowQuoteQueryKey(
    chainId,
    account,
    amount,
    outcomeToken,
    collateralToken,
    swapType,
    tradeType,
    maxSlippage,
  );
  const previousData = queryClient.getQueryData(queryKey);
  const isFastQuery = previousData === undefined;
  return useQuery<QuoteTradeResult | undefined, Error>({
    queryKey: queryKey,
    enabled: Number(amount) > 0 && enabled,
    retry: false,
    queryFn: async () =>
      tradeType === TradeType.EXACT_INPUT
        ? getCowQuote(chainId, account, amount, outcomeToken, collateralToken, swapType, maxSlippage, isFastQuery)
        : getCowQuoteExactOut(
            chainId,
            account,
            amount,
            outcomeToken,
            collateralToken,
            swapType,
            maxSlippage,
            isFastQuery,
          ),
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
  enabled: boolean,
  tradeType: TradeType,
  maxSlippage: string,
) {
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
      tradeType,
    ],
    enabled:
      Number(amount) > 0 && (chainId === mainnet.id || chainId === optimism.id || chainId === base.id) && enabled,
    retry: false,
    queryFn: async () =>
      tradeType === TradeType.EXACT_INPUT
        ? getUniswapQuote(chainId, account, amount, outcomeToken, collateralToken, swapType, maxSlippage)
        : getUniswapQuoteExactOut(chainId, account, amount, outcomeToken, collateralToken, swapType, maxSlippage),
    refetchInterval: QUOTE_REFETCH_INTERVAL,
  });
}

export function useQuoteTrade(
  chainId: SupportedChain,
  account: Address | undefined,
  amount: string,
  outcomeToken: Token,
  collateralToken: Token,
  swapType: "buy" | "sell",
  tradeType: TradeType,
) {
  const isSeerCreditsCollateral = isSeerCredits(chainId, collateralToken.address);

  const realCollateralToken: Token = isSeerCreditsCollateral ? COLLATERAL_TOKENS[chainId].primary : collateralToken;

  const maxSlippage = useGlobalState((state) => state.maxSlippage);
  const isInstantSwap = useGlobalState((state) => state.isInstantSwap);
  const shouldUseInstantSwap = isInstantSwap || isSeerCreditsCollateral;
  const cowResult = useCowQuote(
    chainId,
    account,
    amount,
    outcomeToken,
    realCollateralToken,
    swapType,
    !shouldUseInstantSwap,
    tradeType,
    maxSlippage,
  );
  const isCowResultOk = cowResult.status === "success" && cowResult.data?.value && cowResult.data.value > 0n;

  const swaprResult = useSwaprQuote(
    chainId,
    account,
    amount,
    outcomeToken,
    realCollateralToken,
    swapType,
    true,
    tradeType,
    maxSlippage,
  );
  const uniswapResult = useUniswapQuote(
    chainId,
    account,
    amount,
    outcomeToken,
    realCollateralToken,
    swapType,
    true,
    tradeType,
    maxSlippage,
  );

  if (isCowResultOk) {
    return cowResult;
  }

  if (chainId === mainnet.id || chainId === optimism.id || chainId === base.id) {
    return uniswapResult;
  }
  return swaprResult;
}

export function getMaximumAmountIn(trade: Trade) {
  let maximumAmountIn = BigInt(trade.maximumAmountIn().raw.toString());
  if (trade instanceof UniswapTrade) {
    const routerInterface = new Interface(UNISWAP_ROUTER_ABI);
    const routerFunction = trade.tradeType === TradeType.EXACT_INPUT ? "exactInputSingle" : "exactOutputSingle";
    const callData = trade.swapRoute.methodParameters?.calldata;
    if (callData) {
      try {
        const data = routerInterface.decodeFunctionData("multicall(uint256,bytes[])", callData);
        const decodedData = routerInterface.decodeFunctionData(routerFunction, data.data[0]);
        const callDataAmountIn =
          trade.tradeType === TradeType.EXACT_INPUT
            ? BigInt(decodedData[0][4].toString()) //amountIn
            : BigInt(decodedData[0][5].toString()); //maximumAmountIn
        maximumAmountIn = callDataAmountIn > maximumAmountIn ? callDataAmountIn : maximumAmountIn;
      } catch {}
    }
  }
  return maximumAmountIn;
}

function useMissingTradeApproval(account: Address | undefined, trade: Trade | undefined) {
  const { data, isLoading } = useMissingApprovals(
    !trade
      ? undefined
      : {
          tokensAddresses: [trade.executionPrice.baseCurrency.address as `0x${string}`],
          account,
          spender: trade.approveAddress as `0x${string}`,
          amounts: getMaximumAmountIn(trade),
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
    amounts: getMaximumAmountIn(trade),
    chainId: trade.chainId as SupportedChain,
  });
}

interface TradeTokensProps {
  trade: CoWTrade | SwaprV3Trade | UniswapTrade;
  account: Address;
  isBuyExactOutputNative: boolean;
  isSellToNative: boolean;
  isSeerCredits: boolean;
}

async function tradeTokens({
  trade,
  account,
  isBuyExactOutputNative,
  isSellToNative,
  isSeerCredits,
}: TradeTokensProps): Promise<string | TransactionReceipt> {
  if (trade instanceof CoWTrade) {
    return executeCoWTrade(trade);
  }

  if (trade instanceof UniswapTrade) {
    return executeUniswapTrade(trade, account, isSeerCredits);
  }

  return executeSwaprTrade(trade, account, isBuyExactOutputNative, isSellToNative, isSeerCredits);
}

function useTradeLegacy(
  account: Address | undefined,
  trade: Trade | undefined,
  isSeerCredits: boolean,
  onSuccess: () => unknown,
) {
  const { addPendingOrder } = useGlobalState();

  const approvals = useMissingTradeApproval(account, trade);

  return {
    approvals: isSeerCredits ? EMPTY_APPROVALS : approvals,
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

async function tradeTokens7702(props: TradeTokensProps): Promise<string | TransactionReceipt> {
  if (props.trade instanceof CoWTrade) {
    return executeCoWTrade(props.trade);
  }

  const calls: Execution[] = props.isSeerCredits ? [] : getTradeApprovals7702(props.account, props.trade);

  calls.push(
    getWrappedSeerCreditsExecution(
      props.isSeerCredits,
      props.trade,
      props.trade instanceof UniswapTrade
        ? await getUniswapTradeExecution(props.trade, props.account)
        : await getSwaprTradeExecution(props.trade, props.account, props.isBuyExactOutputNative, props.isSellToNative),
    ),
  );

  const result = await toastifyTx(
    () =>
      sendCalls(config, {
        calls,
        chainId: props.trade.chainId,
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

const useTrade7702 = (onSuccess: () => unknown) => {
  const { addPendingOrder } = useGlobalState();

  return {
    approvals: EMPTY_APPROVALS,
    tradeTokens: useMutation({
      mutationFn: (props: TradeTokensProps) => tradeTokens7702(props),
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

export const useTrade = (
  account: Address | undefined,
  trade: Trade | undefined,
  isSeerCredits: boolean,
  onSuccess: () => unknown,
) => {
  const supports7702 = useCheck7702Support();
  const trade7702 = useTrade7702(onSuccess);
  const tradeLegacy = useTradeLegacy(account, trade, isSeerCredits, onSuccess);

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
