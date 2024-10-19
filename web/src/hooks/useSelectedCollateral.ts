import { COLLATERAL_TOKENS } from "@/lib/config";
import { Token, hasAltCollateral } from "@/lib/tokens";
import { Market, useMarket } from "./useMarket";
import { useTokenInfo } from "./useTokenInfo";

export function useSelectedCollateral(market: Market, useAltCollateral: boolean): Token {
  const { data: parentMarket } = useMarket(market.parentMarket, market.chainId);
  const { data: parentCollateral } = useTokenInfo(
    parentMarket?.wrappedTokens?.[Number(market.parentOutcome)],
    market.chainId,
  );
  if (parentCollateral) {
    return parentCollateral;
  }

  return (
    hasAltCollateral(COLLATERAL_TOKENS[market.chainId].secondary) && useAltCollateral
      ? COLLATERAL_TOKENS[market.chainId].secondary
      : COLLATERAL_TOKENS[market.chainId].primary
  ) as Token;
}
