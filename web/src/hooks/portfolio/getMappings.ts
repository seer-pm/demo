import { SupportedChain } from "@/lib/chains";
import { Market, getCollateralByIndex, getToken0Token1 } from "@/lib/market";
import { config } from "@/wagmi";
import { readContracts } from "@wagmi/core";
import { Address, erc20Abi } from "viem";

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

export async function getMappings(initialMarkets: Market[], chainId: SupportedChain): Promise<MarketDataMapping> {
  const markets = initialMarkets.filter((x) => x.chainId === chainId);
  const conditionIdToMarketMapping: MarketDataMapping["conditionIdToMarketMapping"] = {};
  const tokenPairToMarketMapping: MarketDataMapping["tokenPairToMarketMapping"] = {};
  const outcomeTokenToCollateral: MarketDataMapping["outcomeTokenToCollateral"] = new Map();
  const allTokensIds: MarketDataMapping["allTokensIds"] = new Set();

  for (const market of markets) {
    conditionIdToMarketMapping[market.conditionId.toLocaleLowerCase()] = market;

    market.wrappedTokens.forEach((outcomeToken, i) => {
      const collateral = getCollateralByIndex(market, i);
      const { token0, token1 } = getToken0Token1(collateral, outcomeToken);
      tokenPairToMarketMapping[`${token0}-${token1}`] = market;

      outcomeTokenToCollateral.set(outcomeToken.toLocaleLowerCase() as Address, getCollateralByIndex(market, i));
      allTokensIds.add(market.wrappedTokens[i].toLocaleLowerCase() as Address);
      allTokensIds.add(collateral.toLocaleLowerCase() as Address);
    });
  }

  //get token symbols
  const allTokensSymbols = (await readContracts(config, {
    contracts: Array.from(allTokensIds.values()).map((tokenId) => ({
      abi: erc20Abi,
      chainId,
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
