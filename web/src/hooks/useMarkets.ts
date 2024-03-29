import { SupportedChain } from "@/lib/chains";
import { graphQLClient, mapGraphMarket } from "@/lib/subgraph";
import { config } from "@/wagmi";
import { useQuery } from "@tanstack/react-query";
import { marketFactoryAddress, readMarketViewGetMarkets } from "./contracts/generated";
import { Market_Filter, Market_OrderBy, OrderDirection, getSdk } from "./queries/generated";
import { Market, mapOnChainMarket } from "./useMarket";
import { MarketStatus } from "./useMarketStatus";

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
  orderBy: Market_OrderBy,
) => {
  return useQuery<Market[], Error>({
    queryKey: ["useGraphMarkets", chainId, marketName, marketStatus, orderBy],
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
          where["questionsInArbitration_gt"] = '0';
        } else if (marketStatus === MarketStatus.PENDING_EXECUTION) {
          where["finalizeTs_lt"] = now;
          where["payoutReported"] = false;
        } else if (marketStatus === MarketStatus.CLOSED) {
          where["payoutReported"] = true;
        }

        const { markets } = await getSdk(client).GetMarkets({ where, orderBy, orderDirection: OrderDirection.Desc });
        return markets.map((market) => mapGraphMarket(market));
      }

      throw new Error("Subgraph not available");
    },
    retry: false,
  });
};

export const useMarkets = (
  chainId: SupportedChain,
  marketName: string,
  marketStatus: MarketStatus | "",
  orderBy: Market_OrderBy,
) => {
  const onChainMarkets = useOnChainMarkets(chainId, marketName, marketStatus);
  const graphMarkets = useGraphMarkets(chainId, marketName, marketStatus, orderBy);

  if (marketName || marketStatus) {
    // we only filter using the subgraph
    return graphMarkets;
  }

  // if the subgraph is slow return first the onChain data, and update with the subgraph data once it's available
  return graphMarkets.data ? graphMarkets : onChainMarkets;
};
