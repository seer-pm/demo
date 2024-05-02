import { Market } from "@/hooks/useMarket";
import { useMarketImages } from "@/hooks/useMarketImages";
import { SupportedChain } from "@/lib/chains";
import { isUndefined } from "@/lib/utils";
import { MarketHeader } from "./MarketHeader";

export function PreviewCard({ market, chainId }: { market: Market; chainId: SupportedChain }) {
  const { data: images } = useMarketImages(market.id, chainId);
  return (
    <MarketHeader
      market={market}
      chainId={chainId}
      isPreview={true}
      images={images}
      isVerified={!isUndefined(images)}
    />
  );
}
