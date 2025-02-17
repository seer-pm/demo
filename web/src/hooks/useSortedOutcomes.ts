import { INVALID_RESULT_OUTCOME_TEXT } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Market } from "./useMarket";
import { useMarketOdds } from "./useMarketOdds";
import { MarketStatus } from "./useMarketStatus";
import { useWinningOutcomes } from "./useWinningOutcomes";

type OutcomeWithOdds = {
  odd: number;
  i: number;
  isWinning?: boolean;
};

function sortOdds(
  a: {
    odd: number;
    i: number;
  },
  b: {
    odd: number;
    i: number;
  },
) {
  if (Number.isNaN(a.odd) && Number.isNaN(b.odd)) return 0;
  if (Number.isNaN(a.odd)) return 1;
  if (Number.isNaN(b.odd)) return -1;
  return b.odd - a.odd;
}

export function useSortedOutcomes(market: Market, marketStatus?: MarketStatus) {
  const { data: odds = [] } = useMarketOdds(market, true);
  const { data: winningOutcomes } = useWinningOutcomes(market, marketStatus);

  return useQuery({
    queryKey: ["sortedOutcomes", odds, winningOutcomes, market.outcomes, marketStatus],
    enabled: odds.length > 0 && market.type === "Generic",
    queryFn: () => {
      const invalidIndex = market.outcomes.findIndex((outcome) => outcome === INVALID_RESULT_OUTCOME_TEXT);

      if (!winningOutcomes && marketStatus === MarketStatus.CLOSED) {
        const otherIndexes = odds
          .map((odd, i) => ({ odd, i }))
          .filter(({ i }) => i !== invalidIndex)
          .sort(sortOdds)
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

      const sortedWinning = winningIndexes.sort(sortOdds).map((obj) => obj.i);
      const sortedNonWinning = nonWinningIndexes.sort(sortOdds).map((obj) => obj.i);
      return [...sortedWinning, ...sortedNonWinning];
    },
  });
}
