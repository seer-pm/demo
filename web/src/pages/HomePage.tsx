import { MarketHeader } from "@/components/Market/MarketHeader";
import { Spinner } from "@/components/Spinner";
import { useMarkets } from "@/hooks/useMarkets";
import { DEFAULT_CHAIN, SupportedChain } from "@/lib/chains";
import { useAccount } from "wagmi";

function Home() {
  const { chainId = DEFAULT_CHAIN } = useAccount();
  const { data: markets = [], isPending } = useMarkets(chainId as SupportedChain);

  if (isPending) {
    return (
      <div className="py-10 px-10">
        <Spinner />
      </div>
    );
  }

  if (markets.length === 0) {
    return (
      <div className="p-10">
        <div className="alert alert-warning">No markets found.</div>
      </div>
    );
  }

  return (
    <div className="max-w-[1184px] mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 m-4">
        {markets.map((market) => (
          <MarketHeader market={market} chainId={chainId as SupportedChain} showOutcomes={true} key={market.id} />
        ))}
      </div>
    </div>
  );
}

export default Home;
