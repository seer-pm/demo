import { PreviewCard } from "@/components/Market/PreviewCard";
import { useMarket } from "@/hooks/useMarket";
import { SupportedChain } from "@/lib/chains";
import { Address } from "viem";
import { usePageContext } from "vike-react/usePageContext";

export default function MarketCard() {
  const { routeParams } = usePageContext();

  const id = routeParams.id as Address;
  const chainId = Number(routeParams.chainId) as SupportedChain;

  const { data: market } = useMarket(id as Address, chainId);
  if (!market) return null;
  return (
    <div className="market-card">
      <PreviewCard market={market} />
    </div>
  );
}
