import { SupportedChain } from "@/lib/chains";
import { COLLATERAL_TOKENS } from "@/lib/config";
import { config } from "@/wagmi";
import { readContracts } from "@wagmi/core";
import { Address, erc20Abi } from "viem";
import { Market } from "../../useMarket";

export interface MarketDataMapping {
  outcomeTokenToCollateral: {
    [key: string]: Address;
  };
  conditionIdToMarketMapping: {
    [key: string]: Market;
  };
  allTokensIds: Address[];

  marketIdToCollateral: {
    [key: string]: Address;
  };
  tokenPairToMarketMapping: {
    [key: string]: Market;
  };
  tokenIdToTokenSymbolMapping: {
    [key: string]: string;
  };
}

export async function getMappings(markets: Market[], chainId: SupportedChain) {
  const marketAddressToMarket = markets.reduce(
    (acc, curr) => {
      acc[curr.id.toLocaleLowerCase()] = curr;
      return acc;
    },
    {} as { [key: string]: Market },
  );
  const conditionIdToMarketMapping = markets.reduce(
    (acc, curr) => {
      acc[curr.conditionId.toLocaleLowerCase()] = curr;
      return acc;
    },
    {} as { [key: string]: Market },
  );

  const tokenPairToMarketMapping = markets.reduce(
    (acc, curr) => {
      const collateral = marketAddressToMarket[curr.parentMarket.id.toLocaleLowerCase()]
        ? marketAddressToMarket[curr.parentMarket.id.toLocaleLowerCase()].wrappedTokens[Number(curr.parentOutcome)]
        : COLLATERAL_TOKENS[chainId].primary.address;
      for (const outcomeToken of curr.wrappedTokens) {
        const key =
          collateral.toLocaleLowerCase() > outcomeToken.toLocaleLowerCase()
            ? `${outcomeToken.toLocaleLowerCase()}-${collateral.toLocaleLowerCase()}`
            : `${collateral.toLocaleLowerCase()}-${outcomeToken.toLocaleLowerCase()}`;
        acc[key] = curr;
      }
      return acc;
    },
    {} as { [key: string]: Market },
  );

  const marketIdToCollateral = markets.reduce(
    (acc, curr) => {
      const collateral = marketAddressToMarket[curr.parentMarket.id.toLocaleLowerCase()]
        ? marketAddressToMarket[curr.parentMarket.id.toLocaleLowerCase()].wrappedTokens[Number(curr.parentOutcome)]
        : COLLATERAL_TOKENS[chainId].primary.address;
      acc[curr.id.toLocaleLowerCase()] = collateral;
      return acc;
    },
    {} as { [key: string]: Address },
  );

  const outcomeTokenToCollateral = markets.reduce(
    (acc, curr) => {
      const collateral = marketAddressToMarket[curr.parentMarket.id.toLocaleLowerCase()]
        ? marketAddressToMarket[curr.parentMarket.id.toLocaleLowerCase()].wrappedTokens[Number(curr.parentOutcome)]
        : COLLATERAL_TOKENS[chainId].primary.address;
      for (const outcomeToken of curr.wrappedTokens) {
        acc[outcomeToken.toLocaleLowerCase()] = collateral;
      }
      return acc;
    },
    {} as { [key: string]: Address },
  );

  const allTokensIds = markets.reduce((acc, market) => {
    for (let i = 0; i < market.wrappedTokens.length; i++) {
      const tokenId = market.wrappedTokens[i].toLocaleLowerCase() as Address;
      acc.push(tokenId);
    }
    return acc;
  }, [] as Address[]);

  //get token symbols
  const allTokensSymbols = (await readContracts(config, {
    contracts: allTokensIds.map((tokenId) => ({
      abi: erc20Abi,
      address: tokenId,
      functionName: "symbol",
      args: [],
    })),
    allowFailure: false,
  })) as string[];
  const tokenIdToTokenSymbolMapping = allTokensIds.reduce(
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
    marketIdToCollateral,
    tokenPairToMarketMapping,
    tokenIdToTokenSymbolMapping,
  };
}
