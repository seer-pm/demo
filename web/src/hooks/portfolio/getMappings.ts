import { getCollateralByIndex } from "@/lib/market";
import { config } from "@/wagmi";
import { readContracts } from "@wagmi/core";
import { Address, erc20Abi } from "viem";
import { Market } from "../useMarket";

export interface MarketDataMapping {
  outcomeTokenToCollateral: Map<Address, Address>;
  conditionIdToMarketMapping: {
    [key: string]: Market;
  };
  allTokensIds: Set<Address>;
  tokenPairToMarketMapping: {
    [key: string]: Market;
  };
  tokenIdToTokenSymbolMapping: {
    [key: string]: string;
  };
}

export async function getMappings(markets: Market[]) {
  const conditionIdToMarketMapping: MarketDataMapping["conditionIdToMarketMapping"] = {};
  const tokenPairToMarketMapping: MarketDataMapping["tokenPairToMarketMapping"] = {};
  const outcomeTokenToCollateral: MarketDataMapping["outcomeTokenToCollateral"] = new Map();
  const allTokensIds: MarketDataMapping["allTokensIds"] = new Set();

  for (const market of markets) {
    conditionIdToMarketMapping[market.conditionId.toLocaleLowerCase()] = market;

    market.wrappedTokens.forEach((outcomeToken, i) => {
      const collateral = getCollateralByIndex(market, i);
      const key =
        collateral.toLocaleLowerCase() > outcomeToken.toLocaleLowerCase()
          ? `${outcomeToken.toLocaleLowerCase()}-${collateral.toLocaleLowerCase()}`
          : `${collateral.toLocaleLowerCase()}-${outcomeToken.toLocaleLowerCase()}`;
      tokenPairToMarketMapping[key] = market;

      outcomeTokenToCollateral.set(outcomeToken.toLocaleLowerCase() as Address, getCollateralByIndex(market, i));
      allTokensIds.add(market.wrappedTokens[i].toLocaleLowerCase() as Address);
      allTokensIds.add(collateral.toLocaleLowerCase() as Address);
    });
  }

  //get token symbols
  const allTokensSymbols = (await readContracts(config, {
    contracts: Array.from(allTokensIds.values()).map((tokenId) => ({
      abi: erc20Abi,
      address: tokenId,
      functionName: "symbol",
      args: [],
    })),
    allowFailure: false,
  })) as string[];
  const tokenIdToTokenSymbolMapping = Array.from(allTokensIds.values()).reduce(
    (acc, curr, index) => {
      acc[curr] = allTokensSymbols[index];
      return acc;
    },
    {} as { [key: string]: string },
  );

  return {
    outcomeTokenToCollateral,
    conditionIdToMarketMapping,
    allTokensIds,
    tokenPairToMarketMapping,
    tokenIdToTokenSymbolMapping,
  };
}
