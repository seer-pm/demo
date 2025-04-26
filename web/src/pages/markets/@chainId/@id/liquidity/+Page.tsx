import { Alert } from "@/components/Alert";
import Breadcrumb from "@/components/Breadcrumb";
import { ConditionalMarketAlert } from "@/components/Market/ConditionalMarketAlert";
import { MarketHeader } from "@/components/Market/Header/MarketHeader";
import { Liquidity } from "@/components/Market/Liquidity";
import { useMarket } from "@/hooks/useMarket";
import { SupportedChain } from "@/lib/chains";
import { Address } from "viem";
import { usePageContext } from "vike-react/usePageContext";

function MarketLiquidityPage() {
  const { routeParams } = usePageContext();
  const id = routeParams.id as Address;
  const chainId = Number(routeParams.chainId) as SupportedChain;
  const { data: market, isError: isMarketError, isPending: isMarketPending } = useMarket(id as Address, chainId);

  if (isMarketError) {
    return (
      <div className="container py-10">
        <Alert type="error" className="mb-5">
          Market not found
        </Alert>
      </div>
    );
  }

  if (isMarketPending) {
    return (
      <div className="container-fluid py-10 space-y-5">
        <Breadcrumb links={[{ title: "Market" }, { title: "Liquidity" }]} />
        <div className="shimmer-container w-full h-[200px]"></div>
        <div className="shimmer-container w-full h-[390px]"></div>
      </div>
    );
  }

  if (!market) {
    return null; // Should be covered by isMarketPending, but added for safety
  }

  return (
    <div className="container-fluid py-10 space-y-5">
      <Breadcrumb links={[{ title: "Market", url: `/markets/${chainId}/${id}` }, { title: "Liquidity" }]} />
      <ConditionalMarketAlert
        parentMarket={market.parentMarket.id}
        parentOutcome={market.parentOutcome}
        chainId={chainId}
      />
      <MarketHeader market={market} images={market.images} />
      <Liquidity market={market} />
    </div>
  );
}

export default MarketLiquidityPage;
