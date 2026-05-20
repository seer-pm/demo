import { useTokenInfo } from "@seer-pm/react";
import {
  EMPTY_TOKEN,
  Market,
  type Token,
  getActiveCollateralProfile,
  getActivePrimaryCollateral,
  hasAltCollateral,
} from "@seer-pm/sdk";
import { Address, zeroAddress } from "viem";

export function useSelectedCollateral(market: Market, useAltCollateral: boolean): Token {
  const { data: parentCollateral } = useTokenInfo(
    market.parentMarket.id !== zeroAddress ? market.collateralToken : undefined,
    market.chainId,
  );

  const { data: futarchyCollateral } = useTokenInfo(
    useAltCollateral ? market.collateralToken2 : market.collateralToken1,
    market.chainId,
  );

  if (market.type === "Futarchy") {
    return futarchyCollateral || EMPTY_TOKEN;
  }

  if (parentCollateral) {
    return parentCollateral;
  }

  const profile = getActiveCollateralProfile(market.chainId);
  return (hasAltCollateral(profile.secondary) && useAltCollateral ? profile.secondary : profile.primary) as Token;
}

export function getSplitMergeRedeemCollateral(
  market: Market,
  selectedCollateral: Token,
  useAltCollateral: boolean,
): Address | undefined {
  if (market.type === "Futarchy") {
    return selectedCollateral.address;
  }

  if (market.parentMarket.id !== zeroAddress) {
    return getActivePrimaryCollateral(market.chainId).address;
  }

  return !useAltCollateral ? selectedCollateral.address : undefined;
}
