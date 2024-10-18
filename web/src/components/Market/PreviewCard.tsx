import { Market } from "@/hooks/useMarket";
import { useMarketImages } from "@/hooks/useMarketImages";
import { VerificationStatusResult } from "@/hooks/useVerificationStatus";
import { SupportedChain } from "@/lib/chains";
import { MarketHeader } from "./Header/MarketHeader";

export function PreviewCard({
  market,
  chainId,
  verificationStatusResult,
}: {
  market: Market;
  chainId: SupportedChain;
  verificationStatusResult: VerificationStatusResult;
}) {
  const { data: images } = useMarketImages(market.id, chainId);

  return (
    <MarketHeader
      market={market}
      type="preview"
      outcomesCount={3}
      images={images}
      verificationStatusResult={verificationStatusResult}
    />
  );
}
