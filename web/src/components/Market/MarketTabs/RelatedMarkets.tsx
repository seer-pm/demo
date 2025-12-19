import { Alert } from "@/components/Alert";
import MarketsPagination from "@/components/Market/MarketsPagination";
import { useRelatedMarkets } from "@/hooks/useRelatedMarkets";
import { Market } from "@/lib/market";
import { useEffect, useState } from "react";
import { MarketHeader } from "../Header/MarketHeader";

interface RelatedMarketsProps {
  market: Market;
}

function RelatedMarket({ market }: RelatedMarketsProps) {
  return <MarketHeader market={market} type="small" images={market?.images} />;
}

export function RelatedMarkets({ market }: RelatedMarketsProps) {
  const { data: markets = [], isPending } = useRelatedMarkets(market);
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  const pageCount = Math.ceil(markets.length / ITEMS_PER_PAGE);
  const start = (page - 1) * ITEMS_PER_PAGE;
  const end = start + ITEMS_PER_PAGE;
  const pagedMarkets = markets.slice(start, end);

  useEffect(() => {
    // Reset or clamp page when markets list changes
    if (page > pageCount) {
      setPage(1);
    }
  }, [markets, page, pageCount]);

  if (isPending) {
    return <div className="shimmer-container w-full h-40"></div>;
  }

  if (markets.length === 0) {
    return <Alert type="warning">No markets found.</Alert>;
  }

  return (
    <div className="space-y-3">
      {pagedMarkets.map((market) => (
        <RelatedMarket market={market} key={market.id} />
      ))}

      {markets.length > ITEMS_PER_PAGE && (
        <MarketsPagination
          pageCount={pageCount}
          page={page}
          handlePageClick={({ selected }) => setPage(selected + 1)}
        />
      )}
    </div>
  );
}
