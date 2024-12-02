import { Alert } from "@/components/Alert";
import { MarketsFilter } from "@/components/Market/MarketsFilter";
import MarketsPagination from "@/components/Market/MarketsPagination";
import { PreviewCard } from "@/components/Market/PreviewCard";
import { Market } from "@/hooks/useMarket";
import { UseMarketsProps, useMarkets } from "@/hooks/useMarkets";
import useMarketsSearchParams from "@/hooks/useMarketsSearchParams";
import { useProposals } from "@/hooks/useProposals";
import { useSortAndFilterResults } from "@/hooks/useSortAndFilterResults";
import { UseQueryResult } from "@tanstack/react-query";
import { useEffect } from "react";
import { usePageContext } from "vike-react/usePageContext";
import { navigate } from "vike/client/router";

function FutarchyContent({ params }: { params: UseMarketsProps }) {
  const results = useProposals(params);
  return <PageContent isFutarchyPage={true} params={params} results={results} />;
}

function MarketsContent({ params }: { params: UseMarketsProps }) {
  const results = useMarkets(params);
  return <PageContent isFutarchyPage={false} params={params} results={results} />;
}

function PageContent({
  isFutarchyPage,
  params,
  results,
}: { isFutarchyPage: boolean; params: UseMarketsProps; results: UseQueryResult<Market[] | undefined, Error> }) {
  const {
    data: markets = [],
    isPending,
    pagination: { pageCount, handlePageClick, page },
  } = useSortAndFilterResults(params, results);

  return (
    <div className="container-fluid py-[24px] lg:py-[65px] space-y-[24px] lg:space-y-[48px]">
      <div className="text-[24px] font-semibold">{isFutarchyPage ? "Proposals" : "Markets"}</div>
      <MarketsFilter isFutarchyPage={isFutarchyPage} />

      {isPending && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="shimmer-container h-[450px]"></div>
          <div className="shimmer-container h-[450px]"></div>
        </div>
      )}

      {!isPending && markets.length === 0 && <Alert type="warning">No results found.</Alert>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {markets.map((market) => (
          <PreviewCard key={market.id} market={market} />
        ))}
      </div>
      <MarketsPagination pageCount={pageCount} handlePageClick={handlePageClick} page={page} />
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

  return isFutarchyPage ? <FutarchyContent params={params} /> : <MarketsContent params={params} />;
}

export default Home;
