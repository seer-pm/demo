import { Alert } from "@/components/Alert";
import { MarketsFilter } from "@/components/Market/MarketsFilter";
import MarketsPagination from "@/components/Market/MarketsPagination";
import { PreviewCard } from "@/components/Market/PreviewCard";
import { getUsePoolHourDataSetsKey } from "@/hooks/chart/useChartData";
import { PoolHourDatasSets } from "@/hooks/chart/utils";
import { UseMarketsProps, useMarkets } from "@/hooks/useMarkets";
import useMarketsSearchParams from "@/hooks/useMarketsSearchParams";
import { useSortAndFilterResults } from "@/hooks/useSortAndFilterResults";
import { Market } from "@/lib/market";
import { getAppUrl } from "@/lib/utils";
import { QueryClient, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Address } from "viem";
import { navigate } from "vike/client/router";

async function fetchCharts(markets: Market[]): Promise<Record<Address, PoolHourDatasSets>> {
  const response = await fetch(
    `${getAppUrl()}/.netlify/functions/markets-charts?ids=${markets.map((m) => m.id).join(",")}`,
  );
  if (!response.ok) {
    console.log(`Failed to fetch charts: ${response.status} ${response.statusText}`);
    return {};
  }
  return await response.json();
}

async function preLoadMarkets(markets: Market[], queryClient: QueryClient) {
  if (markets.length > 0) {
    try {
      // Filter markets that don't have data in cache
      const marketsToFetch = markets.filter((market) => {
        const queryKey = getUsePoolHourDataSetsKey(market.chainId, market.id);
        const cachedData = queryClient.getQueryData(queryKey);
        return !cachedData;
      });

      // Only fetch if there are markets without cached data
      if (marketsToFetch.length > 0) {
        const chartsData = await fetchCharts(marketsToFetch);
        // Update queryClient for each individual market
        for (const market of marketsToFetch) {
          const marketChartData = chartsData[market.id];
          if (marketChartData) {
            queryClient.setQueryData(getUsePoolHourDataSetsKey(market.chainId, market.id), marketChartData);
          }
        }
      }
    } catch (error) {
      console.error(error);
    }
  }
}

function PageContent({ params }: { params: UseMarketsProps }) {
  const results = useMarkets(params);
  const {
    data,
    isPending,
    pagination: { pageCount, handlePageClick, page },
  } = useSortAndFilterResults(results);

  const queryClient = useQueryClient();

  useEffect(() => {
    preLoadMarkets(data.markets, queryClient);
  }, [data.markets, queryClient]);

  return (
    <div>
      <div className="px-[24px] lg:px-[64px] py-[16px]">
        <MarketsFilter />
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
  const params = useMarketsSearchParams();

  useEffect(() => {
    if (/#\/markets\/(?<chainId>\d*)\/(?<marketId>0x[0-9a-fA-F]{40})/.test(window.location.hash)) {
      // redirect old client urls
      navigate(window.location.hash.slice(1));
    }
  }, []);

  return <PageContent params={params} />;
}

export default Home;
