import type { Address, PublicClient } from "viem";
import { erc20Abi } from "viem";
import { multicall } from "viem/actions";
import type { SupportedChain } from "./chains";
import { getCollateralByIndex, getToken0Token1, getTokensPairKey } from "./market-pools";
import type { Market } from "./market-types";

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

/**
 * Builds outcome/collateral/token-pair maps for a chain and fetches ERC-20 symbols via multicall.
 */
export async function getMappings(
  publicClient: PublicClient,
  initialMarkets: Market[],
  chainId: SupportedChain,
): Promise<MarketDataMapping> {
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
      tokenPairToMarketMapping[getTokensPairKey(token0, token1)] = market;

      outcomeTokenToCollateral.set(outcomeToken.toLocaleLowerCase() as Address, getCollateralByIndex(market, i));
      allTokensIds.add(market.wrappedTokens[i].toLocaleLowerCase() as Address);
      allTokensIds.add(collateral.toLocaleLowerCase() as Address);
    });
  }

  const symbolResults = await multicall(publicClient, {
    contracts: Array.from(allTokensIds.values()).map((tokenId) => ({
      abi: erc20Abi,
      address: tokenId,
      functionName: "symbol",
      args: [],
    })),
    allowFailure: true,
  });
  const allTokensSymbols = symbolResults.map((r) => (r.status === "success" ? (r.result as string) : ""));
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
