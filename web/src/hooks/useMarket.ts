import { SupportedChain } from "@/lib/chains";
import { MarketTypes, getMarketType } from "@/lib/market";
import { getOutcomes } from "@/lib/market";
import { fetchMarket } from "@/lib/markets-search";
import { queryClient } from "@/lib/query-client";
import { unescapeJson } from "@/lib/reality";
import { INVALID_RESULT_OUTCOME, INVALID_RESULT_OUTCOME_TEXT, isUndefined } from "@/lib/utils";
import { config } from "@/wagmi";
import { useQuery } from "@tanstack/react-query";
import { Address, zeroAddress } from "viem";
import { useData } from "vike-react/useData";
import { marketFactoryAddress, readMarketViewGetMarket } from "./contracts/generated";

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
}

export type VerificationStatus = "verified" | "verifying" | "challenged" | "not_verified";
export type VerificationResult = { status: VerificationStatus; itemID?: string };

type MarketOffChainFields = {
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
  odds: number[];
  creator?: string | null;
  blockTimestamp?: number;
  verification?: VerificationResult;
  images?: { market: string; outcomes: string[] } | undefined;
  index?: number;
  url: string;
};

export type Market = MarketOffChainFields & {
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
  finalizeTs: number;
  encodedQuestions: readonly string[];
  lowerBound: bigint;
  upperBound: bigint;
  payoutReported: boolean;
  payoutNumerators: readonly bigint[];
};

export type SerializedMarket = Omit<
  Market,
  | "outcomesSupply"
  | "parentOutcome"
  | "templateId"
  | "questions"
  | "lowerBound"
  | "upperBound"
  | "payoutNumerators"
  | "parentMarket"
> & {
  outcomesSupply: string;
  parentMarket: Omit<Market["parentMarket"], "payoutNumerators"> & {
    payoutNumerators: readonly string[];
  };
  parentOutcome: string;
  templateId: string;
  questions: Array<
    Omit<Question, "bond" | "min_bond"> & {
      bond: string;
      min_bond: string;
    }
  >;
  lowerBound: string;
  upperBound: string;
  payoutNumerators: readonly string[];
};

export function serializeMarket(market: Market): SerializedMarket {
  return {
    ...market,
    outcomesSupply: market.outcomesSupply.toString(),
    parentMarket: {
      ...market.parentMarket,
      payoutNumerators: market.parentMarket.payoutNumerators.map((pn) => pn.toString()),
    },
    parentOutcome: market.parentOutcome.toString(),
    templateId: market.templateId.toString(),
    questions: market.questions.map((question) => ({
      ...question,
      bond: question.bond.toString(),
      min_bond: question.min_bond.toString(),
    })),
    lowerBound: market.lowerBound.toString(),
    upperBound: market.upperBound.toString(),
    payoutNumerators: market.payoutNumerators.map((pn) => pn.toString()),
  };
}

export function deserializeMarket(market: SerializedMarket): Market {
  return {
    ...market,
    outcomesSupply: BigInt(market.outcomesSupply),
    parentMarket: {
      ...market.parentMarket,
      payoutNumerators: market.parentMarket.payoutNumerators.map((pn) => BigInt(pn)),
    },
    parentOutcome: BigInt(market.parentOutcome),
    templateId: BigInt(market.templateId),
    questions: market.questions.map((question) => ({
      ...question,
      bond: BigInt(question.bond),
      min_bond: BigInt(question.min_bond),
    })),
    lowerBound: BigInt(market.lowerBound),
    upperBound: BigInt(market.upperBound),
    payoutNumerators: market.payoutNumerators.map((pn) => BigInt(pn)),
    images: market.images
      ? {
          market: `https://cdn.kleros.link${market.images.market}`,
          outcomes: ((market.images.outcomes || []) as string[]).map((path) => `https://cdn.kleros.link${path}`),
        }
      : undefined,
  };
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

  // Cache the market data under both its ID and URL keys to enable lookups by either value
  queryClient.setQueryData(getUseGraphMarketKey(market.url === marketIdOrSlug ? market.id : market.url), market);

  return market;
};

export const useGraphMarket = (marketId: Address, chainId: SupportedChain) => {
  const { market } = useData<{ market: Market }>() || {};
  return useQuery<Market | undefined, Error>({
    queryKey: getUseGraphMarketKey(marketId),
    enabled: marketId !== zeroAddress,
    ...(!isUndefined(market) && { placeholderData: market }),
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
