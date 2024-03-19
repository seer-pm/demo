import { SupportedChain } from "@/lib/chains";
import { config } from "@/wagmi";
import { useQuery } from "@tanstack/react-query";
import { Address } from "viem";
import { conditionalTokensAddress, readMarketViewGetMarket, realityAddress } from "./contracts/generated";

export interface Question {
  arbitrator: Address;
  opening_ts: number;
  timeout: number;
  finalize_ts: number;
  is_pending_arbitration: boolean;
  best_answer: `0x${string}`;
  bond: bigint;
  min_bond: bigint;
}

export interface Market {
  id: Address;
  marketName: string;
  outcomes: readonly string[];
  conditionId: `0x${string}`;
  questionId: `0x${string}`;
  templateId: bigint;
  questions: readonly Question[];
  lowerBound: bigint;
  upperBound: bigint;
  payoutReported: boolean;
}

export const useMarket = (marketId: Address, chainId: SupportedChain) => {
  return useQuery<Market | undefined, Error>({
    queryKey: ["useMarket", marketId, chainId],
    queryFn: async () => {
      return await readMarketViewGetMarket(config, {
        args: [conditionalTokensAddress[chainId], realityAddress[chainId], marketId],
        chainId,
      });
    },
  });
};
