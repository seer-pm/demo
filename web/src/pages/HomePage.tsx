import { Alert } from "@/components/Alert";
import { MarketsFilter } from "@/components/Market/MarketsFilter";
import MarketsPagination from "@/components/Market/MarketsPagination";
import { PreviewCard } from "@/components/Market/PreviewCard";
import { Spinner } from "@/components/Spinner";
import { MarketStatus } from "@/hooks/useMarketStatus";
import { useSortAndFilterMarkets } from "@/hooks/useMarkets";
import useMarketsSearchParams from "@/hooks/useMarketsSearchParams";
import { defaultStatus, useVerificationStatusList } from "@/hooks/useVerificationStatus";
import { DEFAULT_CHAIN, SupportedChain } from "@/lib/chains";
import { useState } from "react";
import { useAccount } from "wagmi";

function Home() {
  const { chainId = DEFAULT_CHAIN } = useAccount();
  const [marketName, setMarketName] = useState("");
  const [marketStatus, setMarketStatus] = useState<MarketStatus | "">("");
  const { verificationStatus, orderBy, toggleOrderBy, toggleVerificationStatus } = useMarketsSearchParams();
  const {
    data: markets = [],
    isPending,
    pagination: { currentMarkets, pageCount, handlePageClick, page },
  } = useSortAndFilterMarkets({
    chainId: chainId as SupportedChain,
    marketName,
    marketStatus,
    orderBy,
    verificationStatus,
  });
  const { data: verificationStatusResultList } = useVerificationStatusList(chainId as SupportedChain);

  return (
    <div className="container-fluid py-[24px] lg:py-[65px] space-y-[24px] lg:space-y-[48px]">
      <div className="text-[24px] font-semibold">Markets</div>
      <MarketsFilter
        setMarketName={setMarketName}
        setMarketStatus={setMarketStatus}
        orderBy={orderBy}
        setOrderBy={toggleOrderBy}
        verificationStatus={verificationStatus}
        setVerificationStatus={toggleVerificationStatus}
      />

      {isPending && (
        <div className="py-10 px-10">
          <Spinner />
        </div>
      )}

      {!isPending && markets.length === 0 && <Alert type="warning">No markets found.</Alert>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {currentMarkets.map((market) => (
          <PreviewCard
            key={market.id}
            market={market}
            chainId={chainId as SupportedChain}
            verificationStatusResult={verificationStatusResultList?.[market.id.toLowerCase()] ?? defaultStatus}
          />
        ))}
      </div>
      <MarketsPagination pageCount={pageCount} handlePageClick={handlePageClick} page={page} />
    </div>
  );
}

export default Home;
