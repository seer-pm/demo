import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Address } from "viem";
import { base, gnosis, mainnet, optimism } from "viem/chains";

import {
  COLLATERAL_TOKENS,
  type QuoteTradeResult,
  type Token,
  type TradeType,
  fetchCowQuote,
  fetchSwaprQuote,
  fetchUniswapQuote,
  isSeerCredits,
} from "@seer-pm/sdk";

const QUOTE_REFETCH_INTERVAL = 30_000;

export function useSwaprQuote(
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
      fetchSwaprQuote(tradeType, chainId, account, amount, outcomeToken, collateralToken, swapType, maxSlippage),
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
  const queryClient = useQueryClient();
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
    queryKey,
    enabled: Number(amount) > 0 && enabled,
    retry: false,
    queryFn: async () =>
      fetchCowQuote(
        tradeType,
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

export function useUniswapQuote(
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
      fetchUniswapQuote(tradeType, chainId, account, amount, outcomeToken, collateralToken, swapType, maxSlippage),
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
  maxSlippage: string,
  isCowQuoteEnabled: boolean,
) {
  const isSeerCreditsCollateral = isSeerCredits(chainId, collateralToken.address);

  const realCollateralToken: Token = isSeerCreditsCollateral ? COLLATERAL_TOKENS[chainId].primary : collateralToken;

  const shouldUseInstantSwap = isCowQuoteEnabled || isSeerCreditsCollateral;
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
