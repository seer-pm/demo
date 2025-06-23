import { COLLATERAL_TOKENS } from "@/lib/config";
import { Market } from "@/lib/market";
import { EMPTY_TOKEN, Token, hasAltCollateral } from "@/lib/tokens";
import { Address, zeroAddress } from "viem";
import { useTokenInfo } from "./useTokenInfo";

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
