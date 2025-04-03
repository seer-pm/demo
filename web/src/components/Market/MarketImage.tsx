import { useMarket } from "@/hooks/useMarket";
import { SupportedChain } from "@/lib/chains";
import { Address } from "viem";

export function MarketImage({ marketAddress, chainId }: { marketAddress: Address; chainId: SupportedChain }) {
  const { data: market } = useMarket(marketAddress, chainId);
  return (
    <div>
      {market?.images ? (
        <img
          src={market?.images.market}
          alt={market.marketName}
          className="w-[40px] h-[40px] min-w-[40px] min-h-[40px] rounded-full"
        />
      ) : (
        <div className="w-[40px] h-[40px] rounded-full bg-purple-primary"></div>
      )}
    </div>
  );
}
