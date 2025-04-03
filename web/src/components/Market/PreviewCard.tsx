import { Market } from "@/hooks/useMarket";
import { MarketHeader } from "./Header/MarketHeader";

export function PreviewCard({ market }: { market: Market }) {
  return <MarketHeader market={market} type="preview" outcomesCount={3} images={market.images} />;
}
