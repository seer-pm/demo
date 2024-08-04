import { Alert } from "@/components/Alert";
import { MarketsFilter } from "@/components/Market/MarketsFilter";
import { PreviewCard } from "@/components/Market/PreviewCard";
import { Spinner } from "@/components/Spinner";
import { Market_OrderBy } from "@/hooks/queries/generated";
import { MarketStatus } from "@/hooks/useMarketStatus";
import { useSortedMarkets } from "@/hooks/useMarkets";
import { defaultStatus, useVerificationStatusList } from "@/hooks/useVerificationStatus";
import { DEFAULT_CHAIN, SupportedChain } from "@/lib/chains";
import { useState } from "react";
import { useAccount } from "wagmi";

function Home() {
  const { chainId = DEFAULT_CHAIN } = useAccount();
  const [marketName, setMarketName] = useState("");
  const [marketStatus, setMarketStatus] = useState<MarketStatus | "">("");
  const [orderBy, setOrderBy] = useState<Market_OrderBy>();
  const { data: markets = [], isPending } = useSortedMarkets({
    chainId: chainId as SupportedChain,
    marketName,
    marketStatus,
    orderBy,
  });
  const { data: verificationStatusResultList } = useVerificationStatusList(chainId as SupportedChain);

  const toggleOrderBy = (newOrderBy: Market_OrderBy) => {
    setOrderBy(newOrderBy === orderBy ? undefined : newOrderBy);
  };
  return (
    <div className="container-fluid py-[24px] lg:py-[65px] space-y-[24px] lg:space-y-[48px]">
      <div className="text-[24px] font-semibold">Markets</div>
      <MarketsFilter
        setMarketName={setMarketName}
        setMarketStatus={setMarketStatus}
        orderBy={orderBy}
        setOrderBy={toggleOrderBy}
      />

      {isPending && (
        <div className="py-10 px-10">
          <Spinner />
        </div>
      )}

      {!isPending && markets.length === 0 && <Alert type="warning">No markets found.</Alert>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {markets.map((market) => (
          <PreviewCard
            key={market.id}
            market={market}
            chainId={chainId as SupportedChain}
            verificationStatusResult={verificationStatusResultList?.[market.id.toLowerCase()] ?? defaultStatus}
          />
        ))}
      </div>
    </div>
  );
}

export default Home;
