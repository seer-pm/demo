import { Address } from "viem";
import { SubgraphMarket } from "./getAllMarkets";

function getCollateralByIndex(market: SubgraphMarket, index: number) {
  if (market.type === "Generic") {
    return market.collateralToken;
  }
  return index < 2 ? market.collateralToken1 : market.collateralToken2;
}

export function getAllTokens(markets: SubgraphMarket[]) {
  const marketIdToMarket = markets.reduce(
    (acum, market) => {
      acum[market.id] = market;
      return acum;
    },
    {} as { [key: string]: SubgraphMarket },
  );
  const tokens = markets.reduce(
    (acum, market) => {
      const parentMarket = marketIdToMarket[market.parentMarket.id];
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
