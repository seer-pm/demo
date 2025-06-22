import { COLLATERAL_TOKENS } from "@/lib/config";
import { Market } from "@/lib/market";
import { Token, hasAltCollateral } from "@/lib/tokens";
import { Address, zeroAddress } from "viem";
import { useMarket } from "./useMarket";
import { useTokenInfo } from "./useTokenInfo";

export function useSelectedCollateral(market: Market, useAltCollateral: boolean): Token {
  const { data: parentMarket } = useMarket(market.parentMarket.id, market.chainId);
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
