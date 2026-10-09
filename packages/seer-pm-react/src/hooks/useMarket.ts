import type { Market, SupportedChain } from "@seer-pm/sdk";
import { fetchMarket, mapOnChainMarket } from "@seer-pm/sdk";
import { marketFactoryAddress, marketFactoryV1Address } from "@seer-pm/sdk/contracts/market-factory";
import { readMarketViewGetMarket } from "@seer-pm/sdk/contracts/market-view";
import type { QueryClient } from "@tanstack/react-query";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
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

/**
 * @param factory The factory that created the market, when known. MarketView reads the market's questions from
 * the Reality instance of the factory it is given, and factories on RealityETH 3.0 and 3.2 coexist.
 */
function useOnChainMarket(marketId: Address, chainId: SupportedChain, factory?: Address) {
  const config = useConfig();
  return useQuery<Market | undefined, Error>({
    queryKey: ["useMarket", "useOnChainMarket", marketId.toLowerCase(), chainId, factory?.toLowerCase()] as const,
    enabled: !!marketId && marketId !== zeroAddress,
    queryFn: async () => {
      const factoryAddress =
        factory ??
        (marketFactoryAddress as Partial<Record<number, Address>>)[chainId] ??
        (marketFactoryV1Address as Partial<Record<number, Address>>)[chainId];
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
          openInterestUSD: 0,
          volumeUSD: 0,
          volumeNotionalUSD: 0,
          maxLiquidity: 0,
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
  const { data: onChainMarket } = useOnChainMarket(market?.id ?? zeroAddress, chainId, market?.factory);

  return useMemo(() => {
    if (market === undefined || onChainMarket === undefined) {
      return market;
    }

    return { ...market, questions: onChainMarket.questions };
  }, [market, onChainMarket]);
}
