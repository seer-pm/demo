import { Alert } from "@/components/Alert";
import { MarketsFilter } from "@/components/Market/MarketsFilter";
import MarketsPagination from "@/components/Market/MarketsPagination";
import { PreviewCard } from "@/components/Market/PreviewCard";
import { UseMarketsProps, useMarkets } from "@/hooks/useMarkets";
import useMarketsSearchParams from "@/hooks/useMarketsSearchParams";
import { useSortAndFilterResults } from "@/hooks/useSortAndFilterResults";
import { useEffect } from "react";
import { usePageContext } from "vike-react/usePageContext";
import { navigate } from "vike/client/router";

function PageContent({ isFutarchyPage, params }: { isFutarchyPage: boolean; params: UseMarketsProps }) {
  params.type = isFutarchyPage ? "Futarchy" : "Generic";
  const results = useMarkets(params);
  const {
    data,
    isPending,
    pagination: { pageCount, handlePageClick, page },
  } = useSortAndFilterResults(results);

  return (
    <div>
      <div className="px-[24px] lg:px-[64px] py-[16px]">
        <MarketsFilter isFutarchyPage={isFutarchyPage} />
      </div>

      <div className="px-[24px] lg:px-[64px] py-[24px]">
        {isPending && (
          <div className="grid grid-cols-1 min-[700px]:grid-cols-2 min-[1000px]:grid-cols-3 min-[1350px]:grid-cols-4 gap-5">
            <div className="shimmer-container h-[225px]"></div>
            <div className="shimmer-container h-[225px]"></div>
            <div className="shimmer-container h-[225px]"></div>
            <div className="shimmer-container h-[225px]"></div>
          </div>
        )}

        {!isPending && data.markets.length === 0 && <Alert type="warning">No results found.</Alert>}

        <div className="mb-8 grid grid-cols-1 min-[700px]:grid-cols-2 min-[1000px]:grid-cols-3 min-[1350px]:grid-cols-4 gap-5">
          {data.markets.map((market) => (
            <PreviewCard key={market.id} market={market} />
          ))}
        </div>
        <MarketsPagination pageCount={pageCount} handlePageClick={handlePageClick} page={page} />
      </div>
    </div>
  );
}

function Home() {
  const { pageId } = usePageContext();
  const isFutarchyPage = pageId === "/src/pages/futarchy";
  const params = useMarketsSearchParams();
  useEffect(() => {
    if (/#\/markets\/(?<chainId>\d*)\/(?<marketId>0x[0-9a-fA-F]{40})/.test(window.location.hash)) {
      // redirect old client urls
      navigate(window.location.hash.slice(1));
    }
  }, []);

  return <PageContent isFutarchyPage={isFutarchyPage} params={params} />;
}

export default Home;
