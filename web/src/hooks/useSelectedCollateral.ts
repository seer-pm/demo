import { useTokenInfo } from "@seer-pm/react";
import {
  EMPTY_TOKEN,
  Market,
  type Token,
  getActiveCollateralProfile,
  getActivePrimaryCollateral,
  hasAltCollateral,
  isProfileCollateral,
} from "@seer-pm/sdk";
import { marketAbi } from "@seer-pm/sdk/contracts/market-factory";
import { Address, zeroAddress } from "viem";
import { useReadContract } from "wagmi";

/**
 * Whether the market trades in one collateral only, with no primary/secondary choice: a conditional
 * market (its collateral is a parent outcome token) or a root market whose collateral is not one of the
 * active profile's tokens.
 */
export function hasFixedCollateral(market: Market): boolean {
  if (market.type !== "Generic") {
    return false;
  }
  return market.parentMarket.id !== zeroAddress || !isProfileCollateral(market.chainId, market.collateralToken);
}

export function useSelectedCollateral(market: Market, useAltCollateral: boolean): Token {
  const { data: fixedCollateral } = useTokenInfo(
    hasFixedCollateral(market) ? market.collateralToken : undefined,
    market.chainId,
  );

  const { data: futarchyCollateral } = useTokenInfo(
    useAltCollateral ? market.collateralToken2 : market.collateralToken1,
    market.chainId,
  );

  if (market.type === "Futarchy") {
    return futarchyCollateral || EMPTY_TOKEN;
  }

  if (fixedCollateral) {
    return fixedCollateral;
  }

  const profile = getActiveCollateralProfile(market.chainId);
  return (hasAltCollateral(profile.secondary) && useAltCollateral ? profile.secondary : profile.primary) as Token;
}

/**
 * The base collateral of the market's conditional chain: what the Router splits, merges and redeems
 * against. MarketView resolves it for every market, V1 ones included; a market loaded from the
 * subgraph does not carry it, so it is read from the market itself. Markets created by a V1 factory
 * do not expose it either and were all created on the active profile's primary, so that is the
 * fallback when the call reverts.
 */
export function useBaseCollateral(market: Market): Address {
  // MarketView reports address(0) on a Futarchy proposal, which has no base collateral
  const baseCollateralToken =
    market.baseCollateralToken && market.baseCollateralToken !== zeroAddress ? market.baseCollateralToken : undefined;
  const { data: collateralToken } = useReadContract({
    abi: marketAbi,
    address: market.id,
    functionName: "collateralToken",
    chainId: market.chainId,
    query: {
      enabled: market.type === "Generic" && !baseCollateralToken,
      retry: false,
      staleTime: Number.POSITIVE_INFINITY,
    },
  });
  return baseCollateralToken ?? collateralToken ?? getActivePrimaryCollateral(market.chainId).address;
}

export function getSplitMergeRedeemCollateral(
  market: Market,
  selectedCollateral: Token,
  useAltCollateral: boolean,
  baseCollateral: Address = getActivePrimaryCollateral(market.chainId).address,
): Address | undefined {
  if (market.type === "Futarchy") {
    return selectedCollateral.address;
  }

  if (market.parentMarket.id !== zeroAddress) {
    return baseCollateral;
  }

  if (hasFixedCollateral(market)) {
    return market.collateralToken;
  }

  return !useAltCollateral ? selectedCollateral.address : undefined;
}
