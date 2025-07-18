import { SupportedChain } from "@/lib/chains";
import { Market, MarketOffChainFields, MarketTypes, Question, getMarketType, getOutcomes } from "@/lib/market";
import { fetchMarket } from "@/lib/markets-fetch";
import { queryClient } from "@/lib/query-client";
import { unescapeJson } from "@/lib/reality";
import { INVALID_RESULT_OUTCOME, INVALID_RESULT_OUTCOME_TEXT } from "@/lib/utils";
import { config } from "@/wagmi";
import { useQuery } from "@tanstack/react-query";
import { Address, zeroAddress, zeroHash } from "viem";
import { marketFactoryAddress } from "./contracts/generated-market-factory";
import { readMarketViewGetMarket } from "./contracts/generated-market-view";

export type OnChainMarket = Awaited<ReturnType<typeof readMarketViewGetMarket>>;

export function mapOnChainMarket(onChainMarket: OnChainMarket, offChainFields: MarketOffChainFields): Market {
  const market: Market = {
    ...onChainMarket,
    type: onChainMarket.collateralToken1 === zeroAddress ? "Generic" : "Futarchy",
    wrappedTokens: onChainMarket.wrappedTokens.slice(),
    marketName: unescapeJson(onChainMarket.marketName),
    outcomes: onChainMarket.outcomes.map((outcome) => {
      if (outcome === INVALID_RESULT_OUTCOME) {
        return INVALID_RESULT_OUTCOME_TEXT;
      }
      return unescapeJson(outcome);
    }),
    questions: onChainMarket.questions.map(
      (question, i) =>
        ({
          id: onChainMarket.questionsIds[i],
          base_question: zeroHash,
          ...question,
        }) as Question,
    ),
    openingTs: onChainMarket.questions[0].opening_ts,
    finalizeTs: 0,
    ...offChainFields,
  };

  if (getMarketType(market) === MarketTypes.SCALAR) {
    market.outcomes = getOutcomes(market.outcomes.slice(), getMarketType(market));
  }
  return market;
}

export const getUseGraphMarketKey = (marketIdOrSlug: string) => [
  "useMarket",
  "useGraphMarket",
  marketIdOrSlug.toLocaleLowerCase(),
];

export const useGraphMarketQueryFn = async (marketIdOrSlug: string, chainId: SupportedChain) => {
  const market = await fetchMarket(chainId, marketIdOrSlug);

  if (market) {
    // Cache the market data under both its ID and URL keys to enable lookups by either value
    queryClient.setQueryData(getUseGraphMarketKey(market.url === marketIdOrSlug ? market.id : market.url), market);
  }

  return market;
};

export const useGraphMarket = (marketId: Address, chainId: SupportedChain) => {
  return useQuery<Market | undefined, Error>({
    queryKey: getUseGraphMarketKey(marketId),
    enabled: marketId !== zeroAddress,
    queryFn: async () => {
      return useGraphMarketQueryFn(marketId, chainId);
    },
  });
};

const useOnChainMarket = (marketId: Address, chainId: SupportedChain) => {
  return useQuery<Market | undefined, Error>({
    queryKey: ["useMarket", "useOnChainMarket", marketId.toLocaleLowerCase(), chainId],
    enabled: marketId && marketId !== zeroAddress,
    queryFn: async () => {
      return mapOnChainMarket(
        await readMarketViewGetMarket(config, {
          // TODO: we should have an array of all the existing marketFactories for a given chain and read from all of them
          args: [marketFactoryAddress[chainId], marketId],
          chainId,
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
};

export const useMarket = (marketId: Address, chainId: SupportedChain) => {
  const onChainMarket = useOnChainMarket(marketId, chainId);
  const graphMarket = useGraphMarket(marketId, chainId);
  return graphMarket.isError ? onChainMarket : graphMarket;
};

/**
 * This function overrides the question object by reading the data directly from the blockchain.
 *
 * While the graph is the primary data source for markets, this function ensures we have the
 * most accurate question data, particularly for:
 * - The correct answer for each question (best_answer)
 * - Proper status for reopened questions
 *
 * This is critical because the graph may not update immediately when questions are reopened
 * or when new answers are submitted, leading to stale or incorrect data being displayed.
 *
 * @param market The market object that may contain stale question data from the graph
 * @param chainId The chain ID to fetch the on-chain data from
 * @returns The market object with updated question data from the blockchain
 */
export const useMarketQuestions = (market: Market | undefined, chainId: SupportedChain) => {
  const { data: onChainMarket } = useOnChainMarket(market?.id || zeroAddress, chainId);

  if (market === undefined || onChainMarket === undefined) {
    return market;
  }

  return Object.assign(market, {
    questions: onChainMarket.questions,
  });
};
