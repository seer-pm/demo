import { Market } from "@/lib/market";
import { MarketsResult } from "@/lib/markets-fetch";
import { UseQueryResult } from "@tanstack/react-query";
import { useAllCollectionsMarkets } from "./collections/useAllCollectionsMarkets";
import useMarketsSearchParams from "./useMarketsSearchParams";

export const useSortAndFilterResults = (result: UseQueryResult<MarketsResult | undefined, Error>) => {
  const { data: collectionsMarkets = [] } = useAllCollectionsMarkets();
  const { page, setPage } = useMarketsSearchParams();

  // favorite markets on top, we use reduce to keep the current sort order
  const [favoriteMarkets, nonFavoriteMarkets] = (result.data?.markets || []).reduce(
    (total, market) => {
      const isFavorite = collectionsMarkets.map((x) => x.marketId).includes(market.id);
      if (isFavorite) {
        total[0].push(market);
      } else {
        total[1].push(market);
      }
      return total;
    },
    [[], []] as Market[][],
  );
  const markets = favoriteMarkets.concat(nonFavoriteMarkets);

  const handlePageClick = ({ selected }: { selected: number }) => {
    setPage(selected + 1);
  };

  return {
    ...result,
    data: {
      ...result.data,
      markets,
    },
    pagination: { pageCount: result.data?.pages || 0, handlePageClick, page: Number(page ?? "") },
  };
};
