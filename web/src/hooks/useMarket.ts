import { SupportedChain } from "@/lib/chains";
import { MarketTypes, getMarketType } from "@/lib/market";
import { fetchMarkets } from "@/lib/markets-search";
import { unescapeJson } from "@/lib/reality";
import { INVALID_RESULT_OUTCOME, INVALID_RESULT_OUTCOME_TEXT } from "@/lib/utils";
import { config } from "@/wagmi";
import { useQuery } from "@tanstack/react-query";
import { Address, zeroAddress } from "viem";
import { marketFactoryAddress, readMarketViewGetMarket } from "./contracts/generated";
import { getOutcomes } from "./useCreateMarket";
import { SUBGRAPH_EMPTY_BYTES } from "@/lib/config";

export interface Question {
  id: `0x${string}`;
  arbitrator: Address;
  opening_ts: number;
  timeout: number;
  finalize_ts: number;
  is_pending_arbitration: boolean;
  best_answer: `0x${string}`;
  bond: bigint;
  min_bond: bigint;
  reopensQuestionId: `0x${string}`;
}

export type VerificationStatus = "verified" | "verifying" | "challenged" | "not_verified";
export type VerificationResult = { status: VerificationStatus; itemID?: string };

interface MarketOffChainFields {
  chainId: SupportedChain;
  outcomesSupply: bigint;
  liquidityUSD: number;
  incentive: number;
  hasLiquidity: boolean;
  categories: string[];
  poolBalance: ({
    token0: {
      symbol: string;
      balance: number;
    };
    token1: {
      symbol: string;
      balance: number;
    };
  } | null)[];
  odds: (number | null)[];
  creator?: string | null;
  blockTimestamp?: number;
  verification?: VerificationResult;
  index?: number;
}

export interface Market extends MarketOffChainFields {
  id: Address;
  type: "Generic" | "Futarchy";
  marketName: string;
  outcomes: readonly string[];
  collateralToken: Address;
  collateralToken1: Address;
  collateralToken2: Address;
  wrappedTokens: Address[];
  parentMarket: {
    id: Address;
    conditionId: `0x${string}`;
    payoutReported: boolean;
    payoutNumerators: readonly bigint[];
  };
  parentOutcome: bigint;
  //MarketView's outcomesSupply is buggy
  //outcomesSupply: bigint;
  parentCollectionId: `0x${string}`;
  conditionId: `0x${string}`;
  questionId: `0x${string}`;
  templateId: bigint;
  questions: readonly Question[];
  openingTs: number;
  encodedQuestions: readonly string[];
  lowerBound: bigint;
  upperBound: bigint;
  payoutReported: boolean;
  payoutNumerators: readonly bigint[];
}

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
          reopensQuestionId: SUBGRAPH_EMPTY_BYTES,
          ...question,
        }) as Question,
    ),
    openingTs: onChainMarket.questions[0].opening_ts,
    ...offChainFields,
  };

  if (getMarketType(market) === MarketTypes.SCALAR) {
    market.outcomes = getOutcomes(market.outcomes.slice(), getMarketType(market));
  }
  return market;
}

export const getUseGraphMarketKey = (marketId: Address) => [
  "useMarket",
  "useGraphMarket",
  marketId.toLocaleLowerCase(),
];

export const useGraphMarketQueryFn = async (marketId: Address, chainId: SupportedChain) => {
  const markets = await fetchMarkets(chainId, { id: marketId.toLocaleLowerCase() });

  if (markets.length === 0) {
    throw new Error("Market not found");
  }

  return markets[0];
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
