import { Market } from "@/hooks/useMarket";
import { useMarketImages } from "@/hooks/useMarketImages";
import { useVerificationStatus } from "@/hooks/useVerificationStatus";
import { SupportedChain } from "@/lib/chains";
import { MarketHeader } from "./Header/MarketHeader";

export function PreviewCard({
  market,
  chainId,
}: {
  market: Market;
  chainId: SupportedChain;
}) {
  const { data, error } = useMarketImages(market.id, chainId);
  const images = error ? undefined : data;
  const { data: verificationStatusResult } = useVerificationStatus(market.id, chainId);
  return (
    <MarketHeader
      market={market}
      chainId={chainId}
      isPreview={true}
      outcomesCount={3}
      images={images}
      verificationStatusResult={verificationStatusResult}
    />
  );
}
