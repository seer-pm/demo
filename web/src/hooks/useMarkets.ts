import { SupportedChain } from "@/lib/chains";
import { generateBasicPartition } from "@/lib/conditional-tokens";
import { getRouterAddress } from "@/lib/config";
import { graphQLClient } from "@/lib/subgraph";
import { config } from "@/wagmi";
import { useQuery } from "@tanstack/react-query";
import { readContracts } from "@wagmi/core";
import { Address } from "viem";
import {
  marketFactoryAddress,
  marketViewAbi,
  marketViewAddress,
  readMarketViewGetMarkets,
} from "./contracts/generated";
import { Market_Filter, Market_OrderBy, OrderDirection, getSdk } from "./queries/generated";
import { Market, OnChainMarket, mapOnChainMarket } from "./useMarket";
import { MarketStatus } from "./useMarketStatus";
import useSortMarket from "./useSortMarket";
import { fetchWrappedAddresses } from "./useWrappedAddresses";

export const useOnChainMarkets = (chainId: SupportedChain, marketName: string, marketStatus: MarketStatus | "") => {
  return useQuery<Market[] | undefined, Error>({
    queryKey: ["useOnChainMarkets", chainId, marketName, marketStatus],
    queryFn: async () => {
      const markets = (
        await readMarketViewGetMarkets(config, {
          args: [BigInt(50), marketFactoryAddress[chainId]],
          chainId,
        })
      ).map(mapOnChainMarket);

      return markets.filter((m) => {
        const hasOpenQuestions = m.questions.find((q) => q.opening_ts !== 0);
        return hasOpenQuestions;
      });
    },
  });
};

export const useGraphMarkets = (
  chainId: SupportedChain,
  marketName: string,
  marketStatus: MarketStatus | "",
  creator: Address | "",
  orderBy: Market_OrderBy | undefined,
) => {
  return useQuery<Market[], Error>({
    queryKey: ["useGraphMarkets", chainId, marketName, marketStatus, creator, orderBy],
    queryFn: async () => {
      const client = graphQLClient(chainId);

      if (client) {
        const now = String(Math.round(new Date().getTime() / 1000));

        const where: Market_Filter = { marketName_contains_nocase: marketName };

        if (marketStatus === MarketStatus.NOT_OPEN) {
          where["openingTs_gt"] = now;
        } else if (marketStatus === MarketStatus.OPEN) {
          where["openingTs_lt"] = now;
          where["hasAnswers"] = false;
        } else if (marketStatus === MarketStatus.ANSWER_NOT_FINAL) {
          where["openingTs_lt"] = now;
          where["hasAnswers"] = true;
          where["finalizeTs_gt"] = now;
        } else if (marketStatus === MarketStatus.IN_DISPUTE) {
          where["questionsInArbitration_gt"] = "0";
        } else if (marketStatus === MarketStatus.PENDING_EXECUTION) {
          where["finalizeTs_lt"] = now;
          where["payoutReported"] = false;
        } else if (marketStatus === MarketStatus.CLOSED) {
          where["payoutReported"] = true;
        }

        if (creator !== "") {
          where["creator"] = creator;
        }

        const { markets } = await getSdk(client).GetMarkets({ where, orderBy, orderDirection: OrderDirection.Desc });

        // add creator field to market to sort
        // create marketId-creator mapping for quick add to market
        const creatorMapping = markets.reduce(
          (obj, item) => {
            obj[item.id.toLowerCase()] = item.creator;
            return obj;
          },
          {} as { [key: string]: string | null | undefined },
        );

        const onChainMarkets = (await readContracts(config, {
          allowFailure: false,
          contracts: markets.map((market) => ({
            abi: marketViewAbi,
            address: marketViewAddress[chainId],
            functionName: "getMarket",
            args: [market.factory, market.id],
          })),
        })) as OnChainMarket[];
        const router = getRouterAddress(chainId);

        // add outcomeAddresses field to market to sort by liquidity
        // get all possible outcome token addresses
        const outcomeAddresses = await Promise.all(
          onChainMarkets.map((market) => {
            return fetchWrappedAddresses(
              chainId,
              router,
              market.conditionId,
              generateBasicPartition(market.outcomes.length),
            );
          }),
        );
        // create marketId - outcomeAddresses mapping for quick add to market
        const outcomeAddressMapping = onChainMarkets.reduce(
          (obj, item, index) => {
            obj[item.id.toLowerCase()] = outcomeAddresses[index];
            return obj;
          },
          {} as { [key: string]: `0x${string}`[] },
        );

        // add creator and outcome addresses to each market
        return onChainMarkets.map((market) => {
          return mapOnChainMarket({
            ...market,
            creator: creatorMapping[market.id.toLowerCase()],
            outcomeAddresses: outcomeAddressMapping[market.id.toLowerCase()],
          });
        });
      }

      throw new Error("Subgraph not available");
    },
    retry: false,
  });
};

interface UseMarketsProps {
  chainId: SupportedChain;
  marketName?: string;
  marketStatus?: MarketStatus | "";
  creator?: Address | "";
  orderBy?: Market_OrderBy;
}

export const useMarkets = ({ chainId, marketName = "", marketStatus = "", creator = "", orderBy }: UseMarketsProps) => {
  const onChainMarkets = useOnChainMarkets(chainId, marketName, marketStatus);
  const graphMarkets = useGraphMarkets(chainId, marketName, marketStatus, creator, orderBy);

  if (marketName || marketStatus) {
    // we only filter using the subgraph
    return graphMarkets;
  }

  // if the subgraph is slow return first the onChain data, and update with the subgraph data once it's available
  return graphMarkets.data ? graphMarkets : onChainMarkets;
};

export const useSortedMarkets = (params: UseMarketsProps) => {
  const result = useMarkets(params);
  const markets = result.data || [];

  const defaultSortedMarkets = useSortMarket(markets);
  const data = params.orderBy ? markets : defaultSortedMarkets;

  return {
    ...result,
    data,
  };
};
