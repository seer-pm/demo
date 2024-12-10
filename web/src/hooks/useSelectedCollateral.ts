import { COLLATERAL_TOKENS } from "@/lib/config";
import { EMPTY_TOKEN, Token, hasAltCollateral } from "@/lib/tokens";
import { zeroAddress } from "viem";
import { Market } from "./useMarket";
import { useTokenInfo } from "./useTokenInfo";

export function useSelectedCollateral(market: Market, useAltCollateral: boolean): Token {
  const { data: parentCollateral } = useTokenInfo(
    market.parentMarket !== zeroAddress ? market.collateralToken : undefined,
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
