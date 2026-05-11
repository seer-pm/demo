import { Market } from "@seer-pm/sdk";
import type { Address } from "viem";

function getCollateralByIndex(market: Market, index: number) {
  if (market.type === "Generic") {
    return market.collateralToken;
  }
  return index < 2 ? market.collateralToken1 : market.collateralToken2;
}

export function getAllTokens(markets: Market[]) {
  const marketIdToMarket = markets.reduce(
    (acum, market) => {
      acum[market.id] = market;
      return acum;
    },
    {} as { [key: string]: Market },
  );
  const tokens = markets.reduce(
    (acum, market) => {
      const parentMarket = market.parentMarket != null ? marketIdToMarket[market.parentMarket.id] : undefined;
      const parentTokenId = parentMarket
        ? (parentMarket.wrappedTokens[Number(market.parentOutcome)] as Address)
        : undefined;
      for (let i = 0; i < market.wrappedTokens.length; i++) {
        const tokenId = market.wrappedTokens[i] as Address;
        acum.push({
          tokenId,
          parentTokenId,
          collateralToken: getCollateralByIndex(market, i) as Address,
        });
      }
      return acum;
    },
    [] as { tokenId: Address; parentTokenId?: Address; collateralToken: Address }[],
  );
  return tokens;
}
