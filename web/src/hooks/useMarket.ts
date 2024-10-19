import { SupportedChain } from "@/lib/chains";
import { MarketTypes, getMarketType } from "@/lib/market";
import { fetchMarkets } from "@/lib/markets-search";
import { unescapeJson } from "@/lib/reality";
import { INVALID_RESULT_OUTCOME, INVALID_RESULT_OUTCOME_TEXT, isUndefined } from "@/lib/utils";
import { config } from "@/wagmi";
import { useQuery } from "@tanstack/react-query";
import { Address, zeroAddress } from "viem";
import { marketFactoryAddress, readMarketViewGetMarket } from "./contracts/generated";
import { getOutcomes } from "./useCreateMarket";

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

interface MarketOffChainFields {
  chainId: SupportedChain;
  outcomesSupply: bigint;
  creator?: string | null;
  blockTimestamp?: number;
  verification?: VerificationResult;
  index?: number;
}

export interface Market extends MarketOffChainFields {
  id: Address;
  marketName: string;
  outcomes: readonly string[];
  wrappedTokens: Address[];
  parentMarket: Address;
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
}

export type OnChainMarket = Awaited<ReturnType<typeof readMarketViewGetMarket>>;

export function mapOnChainMarket(onChainMarket: OnChainMarket, offChainFields: MarketOffChainFields): Market {
  const market: Market = {
    ...onChainMarket,
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
    ...offChainFields,
  };

  if (getMarketType(market) === MarketTypes.SCALAR) {
    market.outcomes = getOutcomes(market.outcomes.slice(), getMarketType(market));
  }
  return market;
}

export const useGraphMarket = (marketId: Address, chainId: SupportedChain) => {
  return useQuery<Market | undefined, Error>({
    queryKey: ["useMarket", "useGraphMarket", marketId.toLocaleLowerCase()],
    enabled: marketId !== zeroAddress,
    queryFn: async () => {
      const markets = await fetchMarkets(chainId, { id: marketId.toLocaleLowerCase() });

      if (markets.length === 0) {
        throw new Error("Market not found");
      }

      return markets[0];
    },
  });
};

const useOnChainMarket = (marketId: Address, chainId: SupportedChain) => {
  const { data: graphMarket } = useGraphMarket(marketId, chainId);
  // @ts-ignore
  const factory = chainId === 31337 && !graphMarket?.factory ? marketFactoryAddress[31337] : graphMarket?.factory;

  return useQuery<Market | undefined, Error>({
    queryKey: ["useMarket", "useOnChainMarket", marketId.toLocaleLowerCase(), chainId, factory?.toLocaleLowerCase()],
    enabled: marketId && marketId !== zeroAddress && !isUndefined(factory),
    queryFn: async () => {
      return mapOnChainMarket(
        await readMarketViewGetMarket(config, {
          args: [factory!, marketId],
          chainId,
        }),
        {
          chainId,
          creator: graphMarket?.creator,
          outcomesSupply: BigInt(graphMarket?.outcomesSupply || 0),
          blockTimestamp: graphMarket?.blockTimestamp ? Number(graphMarket?.blockTimestamp) : undefined,
          verification: graphMarket?.verification,
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
