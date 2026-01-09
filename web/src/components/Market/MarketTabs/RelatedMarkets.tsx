import { Alert } from "@/components/Alert";
import MarketsPagination from "@/components/Market/MarketsPagination";
import { useMarket } from "@/hooks/useMarket";
import { getUseGraphMarketKey, useGraphMarketQueryFn } from "@/hooks/useMarket";
import { useRelatedMarkets } from "@/hooks/useRelatedMarkets";
import { Market } from "@/lib/market";
import { useQueries } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { zeroAddress } from "viem";
import { MarketHeader } from "../Header/MarketHeader";

interface RelatedMarketsProps {
  market: Market;
}

function RelatedMarket({ market }: RelatedMarketsProps) {
  return <MarketHeader market={market} type="small" images={market?.images} />;
}

interface UseFilterRelatedMarketsParams {
  markets: Market[];
  currentMarket: Market;
  searchTerm: string;
}

function useFilterRelatedMarkets({ markets, currentMarket, searchTerm }: UseFilterRelatedMarketsParams) {
  // Fetch parent market if current market has a parent
  const hasParent = currentMarket.parentMarket.id !== zeroAddress;
  const { data: parentMarket } = useMarket(
    hasParent ? currentMarket.parentMarket.id : zeroAddress,
    currentMarket.chainId,
  );

  // Get unique parent market IDs from related markets
  const uniqueParentMarketIds = useMemo(() => {
    const parentIds = new Set<string>();
    for (const m of markets) {
      if (m.parentMarket.id !== zeroAddress) {
        parentIds.add(m.parentMarket.id.toLowerCase());
      }
    }
    return Array.from(parentIds);
  }, [markets]);

  // Fetch all unique parent markets in parallel
  const parentMarketQueries = useQueries({
    queries: uniqueParentMarketIds.map((parentId) => ({
      queryKey: getUseGraphMarketKey(parentId, currentMarket.chainId),
      queryFn: () => useGraphMarketQueryFn(parentId, currentMarket.chainId),
      enabled: parentId !== zeroAddress.toLowerCase(),
    })),
  });

  // Create a map of parent market ID to market data for quick lookup
  const parentMarketsMap = useMemo(() => {
    const map = new Map<string, Market>();
    for (let index = 0; index < parentMarketQueries.length; index++) {
      const query = parentMarketQueries[index];
      if (query.data) {
        map.set(uniqueParentMarketIds[index].toLowerCase(), query.data);
      }
    }
    // Also add the current market's parent if it exists
    if (parentMarket) {
      map.set(currentMarket.parentMarket.id.toLowerCase(), parentMarket);
    }
    // Add the current market itself (in case related markets are its children)
    map.set(currentMarket.id.toLowerCase(), currentMarket);
    return map;
  }, [parentMarketQueries, uniqueParentMarketIds, parentMarket, currentMarket]);

  // Filter markets by outcome search term (case insensitive)
  const filteredMarkets = useMemo(() => {
    return markets.filter((m) => {
      if (!searchTerm.trim()) {
        return true;
      }

      // Get the outcome text for this market
      let outcomeText = "";

      if (m.parentMarket.id !== zeroAddress) {
        // This is a child market, get the outcome from its parent
        const parentMarketData = parentMarketsMap.get(m.parentMarket.id.toLowerCase());
        if (parentMarketData) {
          const parentOutcomeIndex = Number(m.parentOutcome);
          outcomeText = parentMarketData.outcomes[parentOutcomeIndex] || "";
        }
      }

      // Case insensitive search
      return outcomeText.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [markets, searchTerm, parentMarketsMap]);

  return {
    filteredMarkets,
  };
}

export function RelatedMarkets({ market }: RelatedMarketsProps) {
  const { data: markets = [], isPending } = useRelatedMarkets(market);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const ITEMS_PER_PAGE = 5;

  const { filteredMarkets } = useFilterRelatedMarkets({
    markets,
    currentMarket: market,
    searchTerm,
  });

  const pageCount = Math.ceil(filteredMarkets.length / ITEMS_PER_PAGE);
  const start = (page - 1) * ITEMS_PER_PAGE;
  const end = start + ITEMS_PER_PAGE;
  const pagedMarkets = filteredMarkets.slice(start, end);

  useEffect(() => {
    // Reset or clamp page when markets list changes
    if (page > pageCount) {
      setPage(1);
    }
  }, [filteredMarkets, page, pageCount]);

  useEffect(() => {
    // Reset to first page when search term changes
    setPage(1);
  }, [searchTerm]);

  if (isPending) {
    return <div className="shimmer-container w-full h-40"></div>;
  }

  if (markets.length === 0) {
    return <Alert type="warning">No markets found.</Alert>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 mb-4">
        <label htmlFor="outcome-search" className="text-sm font-medium text-content-base">
          Search by outcome:
        </label>
        <input
          id="outcome-search"
          type="text"
          placeholder="Type outcome name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input input-bordered bg-base-100 focus:outline-purple-primary flex-1 max-w-md"
        />
      </div>

      {filteredMarkets.length === 0 ? (
        <Alert type="warning">No markets found for the searched outcome.</Alert>
      ) : (
        <>
          {pagedMarkets.map((market) => (
            <RelatedMarket market={market} key={market.id} />
          ))}

          {filteredMarkets.length > ITEMS_PER_PAGE && (
            <MarketsPagination
              pageCount={pageCount}
              page={page}
              handlePageClick={({ selected }) => setPage(selected + 1)}
            />
          )}
        </>
      )}
    </div>
  );
}
