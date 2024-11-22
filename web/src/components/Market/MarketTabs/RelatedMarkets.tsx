import { Alert } from "@/components/Alert";
import { Market } from "@/hooks/useMarket";
import { useRelatedMarkets } from "@/hooks/useRelatedMarkets";
import { MarketHeader } from "../Header/MarketHeader";

interface RelatedMarketsProps {
  market: Market;
}

export function RelatedMarkets({ market }: RelatedMarketsProps) {
  const { data: markets = [], isPending } = useRelatedMarkets(market.chainId, market.id);

  if (isPending) {
    return <div className="shimmer-container w-full h-40"></div>;
  }

  if (markets.length === 0) {
    return <Alert type="warning">No markets found.</Alert>;
  }

  return (
    <div className="space-y-3">
      {markets.map((market) => (
        <MarketHeader market={market} type="small" key={market.id} />
      ))}
    </div>
  );
}
