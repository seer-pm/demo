import { SupportedChain } from "@/lib/chains";
import { COLLATERAL_TOKENS } from "@/lib/config";
import { Token, hasAltCollateral } from "@/lib/tokens";
import { Market, useMarket } from "./useMarket";

export function useSelectedCollateral(market: Market, chainId: SupportedChain, useAltCollateral: boolean): Token {
  const { data: conditionalMarket } = useMarket(market.parentMarket, chainId);

  if (conditionalMarket) {
    return {
      address: conditionalMarket.wrappedTokens[Number(market.parentOutcome)],
      symbol: conditionalMarket.outcomes[Number(market.parentOutcome)],
      decimals: 18,
    };
  }

  return (
    hasAltCollateral(COLLATERAL_TOKENS[chainId].secondary) && useAltCollateral
      ? COLLATERAL_TOKENS[chainId].secondary
      : COLLATERAL_TOKENS[chainId].primary
  ) as Token;
}
