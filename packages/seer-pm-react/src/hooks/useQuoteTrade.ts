import { TradeType } from "@swapr/sdk";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getPublicClient } from "@wagmi/core";
import { useEffect, useMemo } from "react";
import type { Address } from "viem";
import { base, gnosis, mainnet, optimism } from "viem/chains";
import { useConfig } from "wagmi";

import {
  type CompleteSetQuoteResult,
  type Market,
  type QuoteTradeResult,
  type Token,
  fetchBestCompleteSetQuote,
  fetchCowQuote,
  fetchPsm3UniswapQuote,
  fetchSwaprQuote,
  fetchUniswapQuote,
  getActivePrimaryCollateral,
  getCompleteSetRoutingDisabledReasons,
  isCompleteSetRoutingEnabled,
  isPsm3SwapToken,
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
      Number(amount) > 0 &&
      (chainId === mainnet.id || chainId === optimism.id || chainId === base.id) &&
      enabled &&
      !isPsm3SwapToken(chainId, collateralToken.address),
    retry: false,
    queryFn: async () =>
      fetchUniswapQuote(tradeType, chainId, account, amount, outcomeToken, collateralToken, swapType, maxSlippage),
    refetchInterval: QUOTE_REFETCH_INTERVAL,
  });
}

export function usePsm3UniswapQuote(
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
  const config = useConfig();

  return useQuery<QuoteTradeResult | undefined, Error>({
    queryKey: [
      "useQuote",
      "usePsm3UniswapQuote",
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
      Number(amount) > 0 &&
      (chainId === optimism.id || chainId === base.id) &&
      enabled &&
      isPsm3SwapToken(chainId, collateralToken.address),
    retry: false,
    queryFn: async () => {
      const publicClient = getPublicClient(config, { chainId });
      if (!publicClient) {
        throw new Error("Public client not available");
      }
      return fetchPsm3UniswapQuote(
        publicClient,
        tradeType,
        chainId,
        account,
        amount,
        outcomeToken,
        collateralToken,
        swapType,
        maxSlippage,
      );
    },
    refetchInterval: QUOTE_REFETCH_INTERVAL,
  });
}

function toCompleteSetQuote(direct: QuoteTradeResult): CompleteSetQuoteResult {
  return {
    ...direct,
    route: "direct",
    // Placeholder: netCollateral is only used for complete-set route breakdowns.
    // Direct routes don't display this value in the UI.
    netCollateral: 0n,
  };
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
  market?: Market,
  outcomeIndex?: number,
) {
  const config = useConfig();
  const isSeerCreditsCollateral = isSeerCredits(chainId, collateralToken.address);
  const isPsm3Collateral = isPsm3SwapToken(chainId, collateralToken.address);

  const realCollateralToken: Token = isSeerCreditsCollateral ? getActivePrimaryCollateral(chainId) : collateralToken;

  const shouldUseInstantSwap = isCowQuoteEnabled || isSeerCreditsCollateral || isPsm3Collateral;
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
  const psm3UniswapResult = usePsm3UniswapQuote(
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

  const directQuery = useMemo(() => {
    if (isPsm3Collateral && (chainId === optimism.id || chainId === base.id)) {
      return psm3UniswapResult;
    }
    if (isCowResultOk) {
      return cowResult;
    }
    if (chainId === mainnet.id || chainId === optimism.id || chainId === base.id) {
      return uniswapResult;
    }
    return swaprResult;
  }, [chainId, isCowResultOk, cowResult, swaprResult, uniswapResult, psm3UniswapResult, isPsm3Collateral]);

  const completeSetEnabled = Boolean(
    market && outcomeIndex !== undefined && isCompleteSetRoutingEnabled(market, outcomeIndex, collateralToken.address),
  );

  useEffect(() => {
    if (!market || outcomeIndex === undefined || Number(amount) <= 0) {
      return;
    }

    const disabledReasons = getCompleteSetRoutingDisabledReasons(market, outcomeIndex, collateralToken.address);

    if (disabledReasons.length > 0) {
      console.log("[complete-set] routing skipped in UI", {
        marketId: market.id,
        outcomeIndex,
        swapType,
        tradeType: tradeType === TradeType.EXACT_INPUT ? "exactIn" : "exactOut",
        selectedCollateral: collateralToken.address,
        marketCollateral: market.collateralToken,
        disabledReasons,
      });
    }
  }, [market, outcomeIndex, amount, collateralToken.address, swapType, tradeType]);

  const completeSetQuery = useQuery<CompleteSetQuoteResult | undefined, Error>({
    queryKey: [
      "useQuote",
      "completeSet",
      market?.id,
      outcomeIndex,
      chainId,
      account,
      amount.toString(),
      outcomeToken,
      realCollateralToken,
      swapType,
      tradeType,
      maxSlippage,
      directQuery.dataUpdatedAt,
    ],
    enabled: completeSetEnabled && Number(amount) > 0 && Boolean(directQuery.data),
    retry: false,
    queryFn: async () => {
      const publicClient = getPublicClient(config, { chainId });
      const best = await fetchBestCompleteSetQuote({
        market: market!,
        targetOutcomeIndex: outcomeIndex!,
        tradeType,
        swapType,
        amount,
        account,
        client: publicClient,
        maxSlippage,
        directQuote: directQuery.data,
        selectedCollateralToken: collateralToken.address,
      });
      return best ?? (directQuery.data ? toCompleteSetQuote(directQuery.data) : undefined);
    },
    refetchInterval: QUOTE_REFETCH_INTERVAL,
  });

  const data = useMemo(() => {
    if (completeSetEnabled && completeSetQuery.data) {
      return completeSetQuery.data;
    }
    if (directQuery.data) {
      return toCompleteSetQuote(directQuery.data);
    }
    return undefined;
  }, [completeSetEnabled, completeSetQuery.data, directQuery.data]);

  return {
    ...directQuery,
    data,
    isLoading: directQuery.isLoading || (completeSetEnabled && completeSetQuery.isLoading),
    isFetching: directQuery.isFetching || completeSetQuery.isFetching,
    error: directQuery.error ?? completeSetQuery.error,
  };
}

export type { CompleteSetQuoteResult };
