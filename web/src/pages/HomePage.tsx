import { Alert } from "@/components/Alert";
import { MarketsFilter } from "@/components/Market/MarketsFilter";
import MarketsPagination from "@/components/Market/MarketsPagination";
import { PreviewCard } from "@/components/Market/PreviewCard";
import { useSortAndFilterMarkets } from "@/hooks/useMarkets";
import useMarketsSearchParams from "@/hooks/useMarketsSearchParams";

function Home() {
  const { marketName, verificationStatusList, orderBy, marketStatusList, isShowMyMarkets } = useMarketsSearchParams();
  const {
    data: markets = [],
    isPending,
    pagination: { pageCount, handlePageClick, page },
  } = useSortAndFilterMarkets({
    chainId: "all",
    marketName,
    marketStatusList,
    orderBy,
    verificationStatusList,
    isShowMyMarkets,
  });

  return (
    <div className="container-fluid py-[24px] lg:py-[65px] space-y-[24px] lg:space-y-[48px]">
      <div className="text-[24px] font-semibold">Markets</div>
      <MarketsFilter />

      {isPending && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="shimmer-container h-[450px]"></div>
          <div className="shimmer-container h-[450px]"></div>
        </div>
      )}

      {!isPending && markets.length === 0 && <Alert type="warning">No markets found.</Alert>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {markets.map((market) => (
          <PreviewCard key={market.id} market={market} />
        ))}
      </div>
      <MarketsPagination pageCount={pageCount} handlePageClick={handlePageClick} page={page} />
    </div>
  );
}

export default Home;
