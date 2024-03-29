import { Market } from "@/hooks/useMarket";
import { useMarketOdds } from "@/hooks/useMarketOdds";
import { useWrappedAddresses } from "@/hooks/useWrappedAddresses";
import { SUPPORTED_CHAINS, SupportedChain } from "@/lib/chains";
import clsx from "clsx";
import { useState } from "react";
import { Address } from "viem";

interface PositionsProps {
  chainId: SupportedChain;
  router: Address;
  market: Market;
  tradeCallback: (poolIndex: number) => void;
}

export function Outcomes({ chainId, router, market, tradeCallback }: PositionsProps) {
  const [activeOutcome, setActiveOutcome] = useState(0);
  const { data: wrappedAddresses = [] } = useWrappedAddresses(
    chainId,
    router,
    market.conditionId,
    market.outcomes.length,
  );
  const { data: odds = [] } = useMarketOdds(chainId, router, market.conditionId, market.outcomes.length);

  if (wrappedAddresses.length === 0) {
    return null;
  }

  const blockExplorerUrl = SUPPORTED_CHAINS[chainId].blockExplorers?.default?.url;

  const outcomeClick = (i: number) => {
    return () => {
      setActiveOutcome(i);
      tradeCallback(i);
    };
  };

  return (
    <div>
      <div className="font-[16px] font-semibold mb-[24px]">Outcomes</div>
      <div className="space-y-3">
        {wrappedAddresses.map((wrappedAddress, i) => (
          <div
            key={wrappedAddress}
            onClick={outcomeClick(i)}
            className={clsx(
              "bg-white flex justify-between p-[24px] border rounded-[3px] drop-shadow-sm cursor-pointer",
              activeOutcome === i ? "border-[#9747FF]" : "border-[#E5E5E5]",
            )}
          >
            <div className="flex space-x-[12px]">
              <div>
                <div className="w-[48px] h-[48px] rounded-full bg-purple-primary"></div>
              </div>
              <div className="space-y-1">
                <div>
                  <a
                    href={blockExplorerUrl && `${blockExplorerUrl}/address/${wrappedAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[16px] hover:underline"
                  >
                    #{i + 1} {market.outcomes[i]}
                  </a>
                </div>
                <div className="text-[12px] text-[#999999]">xM DAI</div>
              </div>
            </div>
            <div className="flex space-x-10 items-center">
              <div className="text-[24px] font-semibold">{odds?.[i] || 0}%</div>

              <input
                type="radio"
                name="outcome"
                className="radio"
                onChange={outcomeClick(i)}
                checked={activeOutcome === i}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
