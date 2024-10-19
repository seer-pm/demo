import { Market } from "@/hooks/useMarket";
import { useRelatedMarkets } from "@/hooks/useRelatedMarkets";
import { MarketHeader } from "./Header/MarketHeader";

interface RelatedMarketsProps {
  market: Market;
}

export function RelatedMarkets({ market }: RelatedMarketsProps) {
  const { data: markets = [] } = useRelatedMarkets(market.chainId, market.id);

  if (markets.length === 0) {
    return null;
  }

  return (
    <div>
      <div className="font-[16px] font-semibold mb-[24px]">Related Conditional Markets</div>
      <div className="space-y-3">
        {markets.map((market) => (
          <MarketHeader market={market} type="small" key={market.id} />
        ))}
      </div>
    </div>
  );
}
