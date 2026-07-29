import { getLensV4HookParams } from "@seer-pm/order-book";
import { TradeType, type V4HookParams } from "@seer-pm/sdk";
import { useQuery } from "@tanstack/react-query";
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
  fetchAmmQuote,
  fetchBestCompleteSetQuote,
  fetchPsm3AmmQuote,
  getActivePrimaryCollateral,
  getCompleteSetRoutingDisabledReasons,
  isCompleteSetRoutingEnabled,
  isPsm3SwapToken,
  isSeerCredits,
} from "@seer-pm/sdk";

const QUOTE_REFETCH_INTERVAL = 30_000;

const AMM_CHAIN_IDS: Set<number> = new Set([gnosis.id, mainnet.id, optimism.id, base.id]);

export function useAmmQuote(
  chainId: number,
  account: Address | undefined,
  amount: string,
  outcomeToken: Token,
  collateralToken: Token,
  swapType: "buy" | "sell",
  enabled: boolean,
  tradeType: TradeType,
  maxSlippage: string,
  v4Hook?: V4HookParams,
) {
  const config = useConfig();

  return useQuery<QuoteTradeResult | undefined, Error>({
    queryKey: [
      "useQuote",
      "useAmmQuote",
      chainId,
      account,
      amount.toString(),
      outcomeToken,
      collateralToken,
      swapType,
      maxSlippage,
      tradeType,
      v4Hook,
    ],
    enabled:
      Number(amount) > 0 && AMM_CHAIN_IDS.has(chainId) && enabled && !isPsm3SwapToken(chainId, collateralToken.address),
    retry: false,
    queryFn: async () => {
      const publicClient = getPublicClient(config, { chainId });
      if (!publicClient) {
        throw new Error("Public client not available");
      }
      return fetchAmmQuote(
        publicClient,
        tradeType,
        chainId,
        account,
        amount,
        outcomeToken,
        collateralToken,
        swapType,
        maxSlippage,
        v4Hook,
      );
    },
    refetchInterval: QUOTE_REFETCH_INTERVAL,
  });
}

export function usePsm3AmmQuote(
  chainId: number,
  account: Address | undefined,
  amount: string,
  outcomeToken: Token,
  collateralToken: Token,
  swapType: "buy" | "sell",
  enabled: boolean,
  tradeType: TradeType,
  maxSlippage: string,
  v4Hook?: V4HookParams,
) {
  const config = useConfig();

  return useQuery<QuoteTradeResult | undefined, Error>({
    queryKey: [
      "useQuote",
      "usePsm3AmmQuote",
      chainId,
      account,
      amount.toString(),
      outcomeToken,
      collateralToken,
      swapType,
      maxSlippage,
      tradeType,
      v4Hook,
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
      return fetchPsm3AmmQuote(
        publicClient,
        tradeType,
        chainId,
        account,
        amount,
        outcomeToken,
        collateralToken,
        swapType,
        maxSlippage,
        v4Hook,
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
  market?: Market,
  outcomeIndex?: number,
) {
  const config = useConfig();
  const isSeerCreditsCollateral = isSeerCredits(chainId, collateralToken.address);
  const isPsm3Collateral = isPsm3SwapToken(chainId, collateralToken.address);

  const realCollateralToken: Token = isSeerCreditsCollateral ? getActivePrimaryCollateral(chainId) : collateralToken;
  const v4Hook = market ? getLensV4HookParams(market) : undefined;

  const ammResult = useAmmQuote(
    chainId,
    account,
    amount,
    outcomeToken,
    realCollateralToken,
    swapType,
    true,
    tradeType,
    maxSlippage,
    v4Hook,
  );
  const psm3AmmResult = usePsm3AmmQuote(
    chainId,
    account,
    amount,
    outcomeToken,
    realCollateralToken,
    swapType,
    true,
    tradeType,
    maxSlippage,
    v4Hook,
  );

  const directQuery = useMemo(() => {
    if (isPsm3Collateral && (chainId === optimism.id || chainId === base.id)) {
      return psm3AmmResult;
    }
    return ammResult;
  }, [chainId, ammResult, psm3AmmResult, isPsm3Collateral]);

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
        tradeType,
        disabledReasons,
      });
    }
  }, [market, outcomeIndex, amount, collateralToken.address, swapType, tradeType]);

  const completeSetQuery = useQuery({
    queryKey: [
      "useQuote",
      "useCompleteSetQuote",
      chainId,
      account,
      amount.toString(),
      outcomeToken,
      collateralToken,
      swapType,
      maxSlippage,
      tradeType,
      market?.id,
      outcomeIndex,
      v4Hook,
      directQuery.data?.value?.toString(),
      directQuery.dataUpdatedAt,
    ],
    enabled: completeSetEnabled && Number(amount) > 0 && !directQuery.isLoading,
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
        v4Hook,
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
    // Only surface an error when neither path produced a usable quote; otherwise the
    // losing path's NoRoute/etc. would show alongside a valid quote from the winner.
    error: data ? null : (directQuery.error ?? completeSetQuery.error),
  };
}

export type { CompleteSetQuoteResult };
