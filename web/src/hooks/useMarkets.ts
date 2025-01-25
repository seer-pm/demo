import { SUPPORTED_CHAINS, SupportedChain } from "@/lib/chains";
import { queryClient } from "@/lib/query-client";
import { config } from "@/wagmi";
import { useQuery } from "@tanstack/react-query";
import { Address } from "viem";
import { marketFactoryAddress, readMarketViewGetMarkets } from "./contracts/generated";
import { Market_OrderBy } from "./queries/gql-generated-seer";
import {
  Market,
  SerializedMarket,
  VerificationStatus,
  deserializeMarket,
  getUseGraphMarketKey,
  mapOnChainMarket,
} from "./useMarket";
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
      }),
    );
}

const useOnChainMarkets = (
  chainsList: Array<string | "all">,
  marketName: string,
  marketStatusList: MarketStatus[] | undefined,
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
};

function useGraphMarkets(params: UseGraphMarketsParams) {
  return useQuery<Market[], Error>({
    queryKey: ["useGraphMarkets", params],
    queryFn: async () => {
      const response = await fetch("/.netlify/functions/markets-search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
      });
      const markets: Market[] = (await response.json()).map((market: SerializedMarket) => deserializeMarket(market));
      for (const market of markets) {
        queryClient.setQueryData(getUseGraphMarketKey(market.id), market);
      }

      return markets;
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
  orderDirection?: "asc" | "desc";
}

export const useMarkets = ({
  marketName = "",
  marketStatusList = [],
  chainsList = [],
  creator = "",
  participant = "",
  orderBy,
  orderDirection,
}: UseMarketsProps) => {
  const onChainMarkets = useOnChainMarkets(chainsList, marketName, marketStatusList);
  const graphMarkets = useGraphMarkets({
    chainsList,
    marketName,
    marketStatusList,
    creator,
    participant,
    orderBy,
    orderDirection,
  });
  if (marketName || marketStatusList.length > 0) {
    // we only filter using the subgraph
    return graphMarkets;
  }

  // if the subgraph is error we return on chain markets, otherwise we return subgraph
  return graphMarkets.isError ? onChainMarkets : graphMarkets;
};
