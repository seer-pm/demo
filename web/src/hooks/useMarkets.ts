import { SUPPORTED_CHAINS, SupportedChain } from "@/lib/chains";
import { VerificationStatus } from "@/lib/market";
import { MarketStatus } from "@/lib/market";
import { MarketsResult, fetchMarkets } from "@/lib/markets-fetch";
import { queryClient } from "@/lib/query-client";
import { config } from "@/wagmi";
import { useQuery } from "@tanstack/react-query";
import { Address } from "viem";
import { marketFactoryAddress } from "./contracts/generated-market-factory";
import { readMarketViewGetMarkets } from "./contracts/generated-market-view";
import { Market_OrderBy } from "./queries/gql-generated-seer";
import { getUseGraphMarketKey, mapOnChainMarket } from "./useMarket";

export async function searchOnChainMarkets(chainId: SupportedChain) {
  return (
    await readMarketViewGetMarkets(config, {
      args: [BigInt(50), marketFactoryAddress[chainId]],
      chainId,
    })
  )
    .filter((m) => m.id !== "0x0000000000000000000000000000000000000000")
    .map((market) =>
      mapOnChainMarket(market, {
        chainId,
        outcomesSupply: 0n,
        liquidityUSD: 0,
        incentive: 0,
        hasLiquidity: false,
        categories: ["misc"],
        poolBalance: [],
        odds: [],
        url: "",
      }),
    );
}

const useOnChainMarkets = (
  chainsList: Array<string | "all">,
  marketName: string,
  marketStatusList: MarketStatus[] | undefined,
  disabled?: boolean,
) => {
  const chainIds = (
    chainsList.length === 0
      ? Object.keys(SUPPORTED_CHAINS)
      : chainsList.filter((chain) => chain !== "all" && chain !== "31337")
  )
    .filter((chain) => chain !== "31337")
    .map((chainId) => Number(chainId)) as SupportedChain[];

  return useQuery<MarketsResult, Error>({
    queryKey: ["useOnChainMarkets", chainIds, marketName, marketStatusList],
    enabled: !disabled,
    queryFn: async () => {
      const markets = (await Promise.all(chainIds.map(searchOnChainMarkets))).flat();
      return {
        markets,
        count: markets.length,
        pages: 1,
      };
    },
  });
};

export type UseGraphMarketsParams = {
  chainsList: Array<string | "all">;
  marketName: string;
  categoryList?: string[];
  marketStatusList: MarketStatus[] | undefined;
  verificationStatusList: VerificationStatus[] | undefined;
  showConditionalMarkets: boolean | undefined;
  showMarketsWithRewards: boolean | undefined;
  minLiquidity?: number;
  creator: Address | "";
  participant: Address | "";
  orderBy: Market_OrderBy | undefined;
  orderDirection: "asc" | "desc" | undefined;
  marketIds: string[] | undefined;
  disabled: boolean | undefined;
  limit: number | undefined;
  page: number | undefined;
};

export const getUseGraphMarketsKey = (params: UseGraphMarketsParams) => ["useGraphMarkets", params];

export const useGraphMarketsQueryFn = async (params: UseGraphMarketsParams) => {
  const result = await fetchMarkets(params);
  for (const market of result.markets) {
    queryClient.setQueryData(getUseGraphMarketKey(market.id), market);
  }

  return result;
};

function useGraphMarkets(params: UseGraphMarketsParams) {
  return useQuery<MarketsResult, Error>({
    enabled: !params.disabled,
    queryKey: getUseGraphMarketsKey(params),
    queryFn: async () => {
      return useGraphMarketsQueryFn(params);
    },
    retry: false,
  });
}

export interface UseMarketsProps {
  marketName?: string;
  marketStatusList?: MarketStatus[];
  verificationStatusList?: VerificationStatus[];
  categoryList?: string[];
  chainsList?: Array<string | "all">;
  creator?: Address | "";
  participant?: Address | "";
  orderBy?: Market_OrderBy;
  showMyMarkets?: boolean;
  showConditionalMarkets?: boolean;
  showMarketsWithRewards?: boolean;
  minLiquidity?: number;
  orderDirection?: "asc" | "desc";
  marketIds?: string[];
  disabled?: boolean;
  limit?: number;
  page?: number;
}

export const useMarkets = ({
  marketName = "",
  categoryList = [],
  marketStatusList = [],
  verificationStatusList = [],
  showConditionalMarkets,
  showMarketsWithRewards,
  minLiquidity,
  chainsList = [],
  creator = "",
  participant = "",
  orderBy,
  orderDirection,
  marketIds,
  disabled,
  limit,
  page,
}: UseMarketsProps) => {
  const onChainMarkets = useOnChainMarkets(chainsList, marketName, marketStatusList, disabled);
  const graphMarkets = useGraphMarkets({
    chainsList,
    marketName,
    categoryList,
    marketStatusList,
    verificationStatusList,
    showConditionalMarkets,
    showMarketsWithRewards,
    minLiquidity,
    creator,
    participant,
    orderBy,
    orderDirection,
    marketIds,
    disabled,
    limit,
    page,
  });
  if (marketName || marketStatusList.length > 0) {
    // we only filter using the subgraph
    return graphMarkets;
  }

  // if the subgraph is error we return on chain markets, otherwise we return subgraph
  return graphMarkets.isError ? onChainMarkets : graphMarkets;
};
