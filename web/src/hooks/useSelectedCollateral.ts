import { SupportedChain } from "@/lib/chains";
import { COLLATERAL_TOKENS } from "@/lib/config";
import { Token, hasAltCollateral } from "@/lib/tokens";
import { Market, useMarket } from "./useMarket";
import { useTokenInfo } from "./useTokenInfo";

export function useSelectedCollateral(market: Market, chainId: SupportedChain, useAltCollateral: boolean): Token {
  const { data: parentMarket } = useMarket(market.parentMarket, chainId);
  const { data: parentCollateral } = useTokenInfo(parentMarket?.wrappedTokens?.[Number(market.parentOutcome)], chainId);
  if (parentCollateral) {
    return parentCollateral;
  }

  return (
    hasAltCollateral(COLLATERAL_TOKENS[chainId].secondary) && useAltCollateral
      ? COLLATERAL_TOKENS[chainId].secondary
      : COLLATERAL_TOKENS[chainId].primary
  ) as Token;
}
