import { SupportedChain } from "@/lib/chains";
import { graphQLClient } from "@/lib/subgraph";
import { config } from "@/wagmi";
import { useQuery } from "@tanstack/react-query";
import { marketFactoryAddress, readMarketViewGetMarkets } from "./contracts/generated";
import { GetMarketsQuery, Market_Filter, getSdk } from "./queries/generated";
import { Market } from "./useMarket";
import { MarketStatus } from "./useMarketStatus";

function mapGraphMarket(market: GetMarketsQuery["markets"][number]): Market {
  return {
    ...market,
    lowerBound: BigInt(market.lowerBound),
    upperBound: BigInt(market.upperBound),
    templateId: BigInt(market.templateId),
    questions: market.questions.map((marketQuestion) => {
      const question = marketQuestion.question;
      return {
        ...question,
        opening_ts: Number(question.opening_ts),
        timeout: Number(question.timeout),
        finalize_ts: Number(question.finalize_ts),
        bond: BigInt(question.bond),
        min_bond: BigInt(question.min_bond),
      };
    }),
  };
}

export const useMarkets = (chainId: SupportedChain, marketName: string, marketStatus: MarketStatus | "") => {
  return useQuery<Market[] | undefined, Error>({
    queryKey: ["useMarkets", chainId, marketName, marketStatus],
    queryFn: async () => {
      try {
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
          } else if (marketStatus === MarketStatus.PENDING_EXECUTION) {
            where["finalizeTs_gt"] = "0";
            where["finalizeTs_lt"] = now;
            where["payoutReported"] = false;
          } else if (marketStatus === MarketStatus.CLOSED) {
            where["payoutReported"] = true;
          }

          const { markets } = await getSdk(client).GetMarkets({ where });
          return markets.map((market) => mapGraphMarket(market));
        }
      } catch (e) {
        console.log("subgraph error", e);
      }

      // fallback to market view if subgraph fails
      const markets = await readMarketViewGetMarkets(config, {
        args: [BigInt(50), marketFactoryAddress[chainId]],
        chainId,
      });

      return markets.filter((m) => {
        const hasOpenQuestions = m.questions.find((q) => q.opening_ts !== 0);
        return hasOpenQuestions;
      });
    },
  });
};
