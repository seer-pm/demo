import { Alert } from "@/components/Alert";
import { useRelatedMarkets } from "@/hooks/useRelatedMarkets";
import { Market } from "@/lib/market";
import { MarketHeader } from "../Header/MarketHeader";

interface RelatedMarketsProps {
  market: Market;
}

function RelatedMarket({ market }: RelatedMarketsProps) {
  return <MarketHeader market={market} type="small" images={market?.images} />;
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
        <RelatedMarket market={market} key={market.id} />
      ))}
    </div>
  );
}
