import { useTokenInfo } from "@seer-pm/react";
import { Market } from "@seer-pm/sdk";
import { EMPTY_TOKEN, type Token, hasAltCollateral } from "@seer-pm/sdk";
import { COLLATERAL_TOKENS } from "@seer-pm/sdk";
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

  return (
    hasAltCollateral(COLLATERAL_TOKENS[market.chainId].secondary) && useAltCollateral
      ? COLLATERAL_TOKENS[market.chainId].secondary
      : COLLATERAL_TOKENS[market.chainId].primary
  ) as Token;
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
    return COLLATERAL_TOKENS[market.chainId].primary.address;
  }

  return !useAltCollateral ? selectedCollateral.address : undefined;
}
