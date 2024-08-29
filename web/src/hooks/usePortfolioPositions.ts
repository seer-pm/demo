import { SupportedChain } from "@/lib/chains";
import { config } from "@/wagmi";
import { useQuery } from "@tanstack/react-query";
import { readContracts } from "@wagmi/core";
import { Address, erc20Abi, formatUnits } from "viem";
import { readConditionalTokensPayoutNumerators } from "./contracts/generated";
import { Market } from "./useMarket";
import { MarketStatus, getMarketStatus } from "./useMarketStatus";
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
        ...market,
        marketStatus: getMarketStatus(market),
      };
      return acum;
    },
    {} as Record<Address, Market & { marketStatus: string }>,
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
    {} as Record<Address, { marketAddress: Address; tokenIndex: number }>,
  );

  // [tokenId, ..., ...]
  const allTokensIds = Object.keys(tokenToMarket) as Address[];

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

  const marketsWithPositions = [...new Set(positions.map((position) => position.marketAddress))] as Address[];
  const marketsPayouts = await Promise.all(
    marketsWithPositions.map((marketAddress) => fetchMarketPayouts(marketIdToMarket[marketAddress], chainId)),
  );
  const marketToMarketPayouts = marketsWithPositions.reduce(
    (acc, marketAddress, index) => {
      acc[marketAddress] = marketsPayouts[index];
      return acc;
    },
    {} as { [key: Address]: bigint[] },
  );
  return positions.filter((position) => {
    const payouts = marketToMarketPayouts[position.marketAddress as Address];
    if (position.marketStatus === MarketStatus.CLOSED) {
      return payouts[position.tokenIndex] > 0;
    }
    return true;
  });
};

export const fetchMarketPayouts = async (market: Market | undefined, chainId: SupportedChain) => {
  if (!market) return [];
  return await Promise.all(
    market.outcomes.map((_, index) =>
      readConditionalTokensPayoutNumerators(config, {
        args: [market.conditionId, BigInt(index)],
        chainId,
      }),
    ),
  );
};

export const usePositions = (address: Address, chainId: SupportedChain) => {
  return useQuery<PortfolioPosition[] | undefined, Error>({
    enabled: !!address,
    queryKey: ["usePositions", address, chainId],
    queryFn: async () => fetchPositions(address, chainId),
  });
};
