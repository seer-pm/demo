import { Market, MarketsResult } from "@seer-pm/sdk";
import { UseQueryResult } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useAllCollectionsMarkets } from "./collections/useAllCollectionsMarkets";
import useMarketsSearchParams from "./useMarketsSearchParams";

export const useSortAndFilterResults = (result: UseQueryResult<MarketsResult | undefined, Error>) => {
  const { data: collectionsMarkets = [] } = useAllCollectionsMarkets();
  const { page, limit, getPageHref } = useMarketsSearchParams();
  // Each page is its own query, so `data` is empty while the next one loads. Holding the last known
  // totals keeps the pager in place instead of unmounting it under the user's pointer or focus.
  const loadedTotals = result.data && {
    pages: result.data.pages,
    count: result.data.count ?? result.data.markets.length,
  };
  const [lastTotals, setLastTotals] = useState({ pages: 0, count: 0 });
  useEffect(() => {
    if (loadedTotals) setLastTotals(loadedTotals);
  }, [loadedTotals?.pages, loadedTotals?.count]);
  const totals = loadedTotals ?? (result.isFetching ? lastTotals : { pages: 0, count: 0 });

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

  return {
    ...result,
    data: {
      ...result.data,
      markets,
    },
    pagination: { page, pageCount: totals.pages, itemCount: totals.count, pageSize: limit, getPageHref },
  };
};
