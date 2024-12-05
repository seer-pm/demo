import { INVALID_RESULT_OUTCOME_TEXT } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Address } from "viem";
import { Market } from "./useMarket";
import { useMarketOdds } from "./useMarketOdds";
import { MarketStatus } from "./useMarketStatus";
import { useWinningOutcomes } from "./useWinningOutcomes";

type OutcomeWithOdds = {
  odd: number;
  i: number;
  isWinning?: boolean;
};

export function useSortedOutcomes(market: Market, marketStatus?: MarketStatus) {
  const { data: odds = [], isLoading: oddsPending } = useMarketOdds(market, true);
  const { data: winningOutcomes } = useWinningOutcomes(market.conditionId as Address, market.chainId, marketStatus);

  return useQuery({
    queryKey: ["sortedOutcomes", odds, winningOutcomes, market.outcomes, marketStatus],
    enabled: !oddsPending && odds.length > 0,
    queryFn: () => {
      const invalidIndex = market.outcomes.findIndex((outcome) => outcome === INVALID_RESULT_OUTCOME_TEXT);

      if (!winningOutcomes && marketStatus === MarketStatus.CLOSED) {
        const otherIndexes = odds
          .map((odd, i) => ({ odd, i }))
          .filter(({ i }) => i !== invalidIndex)
          .sort((a, b) => b.odd - a.odd)
          .map((obj) => obj.i);

        return [invalidIndex, ...otherIndexes];
      }

      const winningIndexes: OutcomeWithOdds[] = [];
      const nonWinningIndexes: OutcomeWithOdds[] = [];

      odds.forEach((odd, i) => {
        if (winningOutcomes?.[i] === true) {
          winningIndexes.push({ odd, i });
        } else {
          nonWinningIndexes.push({ odd, i });
        }
      });

      const sortedWinning = winningIndexes.sort((a, b) => b.odd - a.odd).map((obj) => obj.i);
      const sortedNonWinning = nonWinningIndexes.sort((a, b) => b.odd - a.odd).map((obj) => obj.i);

      return [...sortedWinning, ...sortedNonWinning];
    },
  });
}
