import { Alert } from "@/components/Alert";
import { PreviewCard } from "@/components/Market/PreviewCard";
import { Spinner } from "@/components/Spinner";
import { useMarkets } from "@/hooks/useMarkets";
import { DEFAULT_CHAIN, SupportedChain } from "@/lib/chains";
import { shortenAddress } from "@/lib/utils";
import { useAccount } from "wagmi";

function ProfilePage() {
  const { chainId = DEFAULT_CHAIN, address } = useAccount();
  const { data: markets = [], isPending } = useMarkets({ chainId: chainId as SupportedChain, creator: address });

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

      {isPending && (
        <div className="py-10 px-10">
          <Spinner />
        </div>
      )}

      {!isPending && markets.length === 0 && <Alert type="warning">No markets found.</Alert>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {markets.map((market) => (
          <PreviewCard key={market.id} market={market} chainId={chainId as SupportedChain} />
        ))}
      </div>
    </div>
  );
}

export default ProfilePage;
