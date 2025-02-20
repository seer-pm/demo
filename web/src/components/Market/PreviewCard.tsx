import { Market } from "@/hooks/useMarket";
import { useMarketImages } from "@/hooks/useMarketImages";
import { MarketHeader } from "./Header/MarketHeader";

export function PreviewCard({
  market,
  isHideFavorite,
}: {
  market: Market;
  isHideFavorite?: boolean;
}) {
  const { data: images } = useMarketImages(market.id, market.chainId);

  return (
    <MarketHeader market={market} type="preview" outcomesCount={3} images={images} isHideFavorite={isHideFavorite} />
  );
}
