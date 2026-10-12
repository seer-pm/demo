import { getUseGraphMarketsKey, useGraphMarketsQueryFn } from "@seer-pm/react";
import type { FetchMarketParams, Market } from "@seer-pm/sdk";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";

/** Shortest query that gets sent. One character matches most of the catalogue and is noise. */
export const SUGGESTIONS_MIN_QUERY = 2;
export const SUGGESTIONS_LIMIT = 6;

/**
 * The handful of markets a header query should jump to, most liquid first.
 *
 * A header search is navigational: the row the reader wants is the market they can trade, so the
 * rows are ordered by liquidity rather than by the list's default order, which fills a popular
 * keyword with resolved and empty markets first. The filters are otherwise the list's own (Generic
 * markets, no status filter), so "See all results" never shows a different population. The fetched
 * markets are seeded into the per-market cache, so picking one renders its page without a second
 * request.
 */
export function useMarketSuggestions(query: string, enabled = true) {
  const queryClient = useQueryClient();
  const marketName = query.trim();
  const params: FetchMarketParams = {
    type: "Generic",
    marketName,
    orderBy: "liquidityUSD",
    orderDirection: "desc",
    limit: SUGGESTIONS_LIMIT,
    page: 1,
  };

  return useQuery<Market[], Error>({
    enabled: enabled && marketName.length >= SUGGESTIONS_MIN_QUERY,
    queryKey: [...getUseGraphMarketsKey(params), "suggestions"],
    queryFn: async () => (await useGraphMarketsQueryFn(queryClient, params)).markets,
    // Keep the last rows on screen while the next query loads, so the panel never blinks empty
    // between keystrokes.
    placeholderData: keepPreviousData,
    staleTime: 60_000,
    retry: false,
  });
}
