import { SUPPORTED_CHAINS, SupportedChain } from "@/lib/chains";
import { fetchMarkets } from "@/lib/markets-search";
import { queryClient } from "@/lib/query-client";
import { config } from "@/wagmi";
import { useQuery } from "@tanstack/react-query";
import { Address } from "viem";
import { marketFactoryAddress, readMarketViewGetMarkets } from "./contracts/generated";
import { Market_OrderBy } from "./queries/gql-generated-seer";
import { Market, VerificationStatus, getUseGraphMarketKey, mapOnChainMarket } from "./useMarket";
import { MarketStatus } from "./useMarketStatus";

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

  return useQuery<Market[] | undefined, Error>({
    queryKey: ["useOnChainMarkets", chainIds, marketName, marketStatusList],
    enabled: !disabled,
    queryFn: async () => {
      return (await Promise.all(chainIds.map(searchOnChainMarkets))).flat();
    },
  });
};

export type UseGraphMarketsParams = {
  chainsList: Array<string | "all">;
  marketName: string;
  marketStatusList: MarketStatus[] | undefined;
  creator: Address | "";
  participant: Address | "";
  orderBy: Market_OrderBy | undefined;
  orderDirection: "asc" | "desc" | undefined;
  marketIds: string[] | undefined;
  disabled: boolean | undefined;
};

export const getUseGraphMarketsKey = (params: UseGraphMarketsParams) => ["useGraphMarkets", params];

export const useGraphMarketsQueryFn = async (params: UseGraphMarketsParams) => {
  const markets = await fetchMarkets(params);
  for (const market of markets) {
    queryClient.setQueryData(getUseGraphMarketKey(market.id), market);
  }

  return markets;
};

function useGraphMarkets(params: UseGraphMarketsParams) {
  return useQuery<Market[], Error>({
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
  isShowMyMarkets?: boolean;
  isShowConditionalMarkets?: boolean;
  isShowMarketsWithRewards?: boolean;
  orderDirection?: "asc" | "desc";
  marketIds?: string[];
  disabled?: boolean;
}

export const useMarkets = ({
  marketName = "",
  marketStatusList = [],
  chainsList = [],
  creator = "",
  participant = "",
  orderBy,
  orderDirection,
  marketIds,
  disabled,
}: UseMarketsProps) => {
  const onChainMarkets = useOnChainMarkets(chainsList, marketName, marketStatusList, disabled);
  const graphMarkets = useGraphMarkets({
    chainsList,
    marketName,
    marketStatusList,
    creator,
    participant,
    orderBy,
    orderDirection,
    marketIds,
    disabled,
  });
  if (marketName || marketStatusList.length > 0) {
    // we only filter using the subgraph
    return graphMarkets;
  }

  // if the subgraph is error we return on chain markets, otherwise we return subgraph
  return graphMarkets.isError ? onChainMarkets : graphMarkets;
};
