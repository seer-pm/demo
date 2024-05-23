import { Market } from "@/hooks/useMarket";
import { useMarketImages } from "@/hooks/useMarketImages";
import { useVerificationStatus } from "@/hooks/useVerificationStatus";
import { SupportedChain } from "@/lib/chains";
import { MarketHeader } from "./MarketHeader";

export function PreviewCard({ market, chainId }: { market: Market; chainId: SupportedChain }) {
  const { data: images } = useMarketImages(market.id, chainId);
  const { data: verificationStatusResult } = useVerificationStatus(market.id, chainId);

  return (
    <MarketHeader
      market={market}
      chainId={chainId}
      isPreview={true}
      images={images}
      verificationStatusResult={verificationStatusResult}
    />
  );
}
