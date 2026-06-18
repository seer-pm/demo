import { getAppUrl } from "@/lib/utils";
import type { MarketEvent } from "@/types/market-events";
import type { Market } from "@seer-pm/sdk";
import { useQuery } from "@tanstack/react-query";

async function fetchMarketEvents(chainId: number, marketId: string): Promise<MarketEvent[]> {
  const url = new URL(`${getAppUrl()}/.netlify/functions/get-market-events`);
  url.searchParams.set("chainId", chainId.toString());
  url.searchParams.set("marketId", marketId);

  const response = await fetch(url.toString());
  const json = await response.json();

  if (!response.ok) {
    throw new Error(json?.error || "Failed to fetch market events");
  }

  return json.data ?? [];
}

export function useMarketEvents(market: Market | undefined) {
  return useQuery({
    queryKey: ["useMarketEvents", market?.chainId, market?.id],
    enabled: !!market,
    queryFn: () => fetchMarketEvents(market!.chainId, market!.id),
    staleTime: 60_000,
  });
}
