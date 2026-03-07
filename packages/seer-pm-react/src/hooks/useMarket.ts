import type { Market, MarketOffChainFields, SupportedChain } from "@seer-pm/sdk";
import { fetchMarket, mapOnChainMarket } from "@seer-pm/sdk";
import { marketFactoryAddress } from "@seer-pm/sdk/contracts/market-factory";
import { readMarketViewGetMarket } from "@seer-pm/sdk/contracts/market-view";
import type { QueryClient } from "@tanstack/react-query";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Address } from "viem";
import { zeroAddress } from "viem";
import { useConfig } from "wagmi";

export const getUseGraphMarketKey = (marketIdOrSlug: string, chainId: SupportedChain) =>
  ["useMarket", "useGraphMarket", marketIdOrSlug.toLowerCase(), chainId] as const;

/** For use as queryFn; pass queryClient from useQueryClient(). */
export async function getGraphMarketQueryFn(
  queryClient: QueryClient,
  marketIdOrSlug: string,
  chainId: SupportedChain,
): Promise<Market | undefined> {
  const market = await fetchMarket(chainId, marketIdOrSlug);
  if (market) {
    queryClient.setQueryData(
      getUseGraphMarketKey(market.url === marketIdOrSlug ? market.id : market.url, chainId),
      market,
    );
  }
  return market;
}

export function useGraphMarket(marketId: Address, chainId: SupportedChain) {
  const queryClient = useQueryClient();
  return useQuery<Market | undefined, Error>({
    queryKey: getUseGraphMarketKey(marketId, chainId),
    enabled: marketId !== zeroAddress,
    queryFn: () => getGraphMarketQueryFn(queryClient, marketId, chainId),
  });
}

function useOnChainMarket(marketId: Address, chainId: SupportedChain) {
  const config = useConfig();
  return useQuery<Market | undefined, Error>({
    queryKey: ["useMarket", "useOnChainMarket", marketId.toLowerCase(), chainId] as const,
    enabled: !!marketId && marketId !== zeroAddress,
    queryFn: async () => {
      const factoryAddress = marketFactoryAddress[chainId as SupportedChain];
      if (!factoryAddress) return undefined;
      return mapOnChainMarket(
        await readMarketViewGetMarket(config, {
          args: [factoryAddress, marketId],
          chainId: chainId as SupportedChain,
        }),
        {
          chainId,
          outcomesSupply: 0n,
          liquidityUSD: 0,
          incentive: 0,
          hasLiquidity: false,
          categories: ["misc"],
          poolBalance: [],
          odds: [],
          url: "",
        },
      );
    },
    refetchOnWindowFocus: true,
  });
}

export function useMarket(marketId: Address, chainId: SupportedChain) {
  const onChainMarket = useOnChainMarket(marketId, chainId);
  const graphMarket = useGraphMarket(marketId, chainId);
  return graphMarket.isError ? onChainMarket : graphMarket;
}

/**
 * Overrides the market's question data with fresh on-chain data (e.g. best_answer, reopened status).
 */
export function useMarketQuestions(market: Market | undefined, chainId: SupportedChain) {
  const { data: onChainMarket } = useOnChainMarket(market?.id ?? zeroAddress, chainId);

  if (market === undefined || onChainMarket === undefined) {
    return market;
  }

  return Object.assign(market, {
    questions: onChainMarket.questions,
  });
}
