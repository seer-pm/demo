import { Alert } from "@/components/Alert";
import { MarketsFilter } from "@/components/Market/MarketsFilter";
import MarketsPagination from "@/components/Market/MarketsPagination";
import { PreviewCard } from "@/components/Market/PreviewCard";
import { Spinner } from "@/components/Spinner";
import { MarketStatus } from "@/hooks/useMarketStatus";
import { useSortAndFilterMarkets } from "@/hooks/useMarkets";
import useMarketsPagination from "@/hooks/useMarketsPagination";
import useMarketsSearchParams from "@/hooks/useMarketsSearchParams";
import { defaultStatus, useVerificationStatusList } from "@/hooks/useVerificationStatus";
import { DEFAULT_CHAIN, SupportedChain } from "@/lib/chains";
import { shortenAddress } from "@/lib/utils";
import { useState } from "react";
import { useAccount } from "wagmi";

function ProfilePage() {
  const { chainId = DEFAULT_CHAIN, address } = useAccount();
  const [marketName, setMarketName] = useState("");
  const [marketStatus, setMarketStatus] = useState<MarketStatus | "">("");
  const { verificationStatus, orderBy, toggleOrderBy, toggleVerificationStatus } = useMarketsSearchParams();
  const { data: markets = [], isPending } = useSortAndFilterMarkets({
    chainId: chainId as SupportedChain,
    creator: address,
    marketName,
    marketStatus,
    orderBy,
    verificationStatus,
  });

  const { data: verificationStatusResultList } = useVerificationStatusList(chainId as SupportedChain);
  const { currentMarkets } = useMarketsPagination(markets);
  if (!address) {
    return (
      <div className="container-fluid py-[24px] lg:py-[65px]">
        <Alert type="warning" title="Account not found">
          Connect your wallet to see your markets.
        </Alert>
      </div>
    );
  }

  return (
    <div className="container-fluid py-[24px] lg:py-[65px] space-y-[24px] lg:space-y-[48px]">
      <div className="text-[24px] font-semibold">Markets created by {shortenAddress(address)}</div>

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
      <MarketsPagination markets={markets} />
    </div>
  );
}

export default ProfilePage;
