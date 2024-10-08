import { Market } from "@/hooks/useMarket";
import { useRelatedMarkets } from "@/hooks/useRelatedMarkets";
import { SupportedChain } from "@/lib/chains";
import { MarketHeader } from "./Header/MarketHeader";

interface RelatedMarketsProps {
  chainId: SupportedChain;
  market: Market;
}

export function RelatedMarkets({ chainId, market }: RelatedMarketsProps) {
  const { data: markets = [] } = useRelatedMarkets(chainId, market.id);

  if (markets.length === 0) {
    return null;
  }

  return (
    <div>
      <div className="font-[16px] font-semibold mb-[24px]">Related Conditional Markets</div>
      <div className="space-y-3">
        {markets.map((market) => (
          <MarketHeader market={market} chainId={chainId} type="small" key={market.id} />
        ))}
      </div>
    </div>
  );
}
