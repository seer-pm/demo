import { SupportedChain } from "@/lib/chains";
import { config } from "@/wagmi";
import { useQuery } from "@tanstack/react-query";
import { readContracts } from "@wagmi/core";
import { Address, erc20Abi, formatUnits } from "viem";
import { getMarketStatus } from "./useMarketStatus";
import { fetchMarkets } from "./useMarkets";

export interface PortfolioPosition {
  tokenName: string;
  tokenId: string;
  tokenIndex: number;
  marketAddress: string;
  marketName: string;
  marketStatus: string;
  tokenBalance: number;
  tokenValue?: number;
  tokenPrice?: number;
}
export const fetchPositions = async (address: Address, chainId: SupportedChain) => {
  // tokenId => marketId
  const markets = await fetchMarkets(chainId);

  const marketIdToMarket = markets.reduce(
    (acum, market) => {
      acum[market.id] = {
        marketName: market.marketName,
        marketStatus: getMarketStatus(market),
      };
      return acum;
    },
    {} as Record<Address, { marketName: string; marketStatus: string }>,
  );

  const tokenToMarket = markets.reduce(
    (acum, market) => {
      for (let i = 0; i < market.wrappedTokens.length; i++) {
        const tokenId = market.wrappedTokens[i];
        acum[tokenId] = {
          marketAddress: market.id,
          tokenIndex: i,
        };
      }
      return acum;
    },
    {} as Record<`0x${string}`, { marketAddress: Address; tokenIndex: number }>,
  );

  // [tokenId, ..., ...]
  const allTokensIds = Object.keys(tokenToMarket) as `0x${string}`[];

  // [tokenBalance, ..., ...]
  const balances = (await readContracts(config, {
    contracts: allTokensIds.map((wrappedAddresses) => ({
      abi: erc20Abi,
      address: wrappedAddresses,
      functionName: "balanceOf",
      args: [address],
    })),
    allowFailure: false,
  })) as bigint[];

  // tokenNames
  const tokenNames = (await readContracts(config, {
    contracts: allTokensIds.map((wrappedAddresses) => ({
      abi: erc20Abi,
      address: wrappedAddresses,
      functionName: "name",
      args: [],
    })),
    allowFailure: false,
  })) as string[];

  // decimals
  const tokenDecimals = (await readContracts(config, {
    contracts: allTokensIds.map((wrappedAddresses) => ({
      abi: erc20Abi,
      address: wrappedAddresses,
      functionName: "decimals",
      args: [],
    })),
    allowFailure: false,
  })) as bigint[];

  const positions = balances.reduce((acumm, balance, index) => {
    if (balance > 0n) {
      const { marketAddress, tokenIndex } = tokenToMarket[allTokensIds[index]];
      acumm.push({
        marketAddress,
        tokenIndex,
        tokenName: tokenNames[index],
        tokenId: allTokensIds[index],
        tokenBalance: Number(formatUnits(balance, Number(tokenDecimals[index]))),
        marketName: marketIdToMarket[marketAddress].marketName,
        marketStatus: marketIdToMarket[marketAddress].marketStatus,
      });
    }
    return acumm;
  }, [] as PortfolioPosition[]);
  return positions;
};

export const usePositions = (address: Address, chainId: SupportedChain) => {
  return useQuery<PortfolioPosition[] | undefined, Error>({
    enabled: !!address,
    queryKey: ["usePositions", address, chainId],
    queryFn: async () => fetchPositions(address, chainId),
  });
};
