import { Market } from "@/hooks/useMarket";
import { useMarketOdds } from "@/hooks/useMarketOdds";
import { useTokenBalances } from "@/hooks/useTokenBalance";
import { useTokensInfo } from "@/hooks/useTokenInfo";
import { useWrappedAddresses } from "@/hooks/useWrappedAddresses";
import { SUPPORTED_CHAINS, SupportedChain } from "@/lib/chains";
import { EtherscanIcon } from "@/lib/icons";
import { displayBalance } from "@/lib/utils";
import { config } from "@/wagmi";
import { getConnectorClient } from "@wagmi/core";
import clsx from "clsx";
import { useState } from "react";
import { Address } from "viem";
import { watchAsset } from "viem/actions";
import { useAccount } from "wagmi";

interface PositionsProps {
  chainId: SupportedChain;
  router: Address;
  market: Market;
  images?: string[];
  tradeCallback: (poolIndex: number) => void;
}

export function Outcomes({ chainId, router, market, images, tradeCallback }: PositionsProps) {
  const { address } = useAccount();
  const [activeOutcome, setActiveOutcome] = useState(0);
  const { data: wrappedAddresses = [] } = useWrappedAddresses(
    chainId,
    router,
    market.conditionId,
    market.outcomes.length,
  );
  const { data: tokensInfo = [] } = useTokensInfo(wrappedAddresses);
  const { data: balances } = useTokenBalances(address, wrappedAddresses);
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

  const addToWallet = (i: number) => {
    return async () => {
      const walletClient = await getConnectorClient(config);
      await watchAsset(walletClient, {
        type: "ERC20",
        options: {
          address: wrappedAddresses[i],
          decimals: 18,
          symbol: market.outcomes[i],
        },
      });
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
            <div className="flex items-center space-x-[12px]">
              <div>
                {images?.[i] ? (
                  <img src={images?.[i]} alt={market.outcomes[i]} className="w-[48px] h-[48px] rounded-full mx-auto" />
                ) : (
                  <div className="w-[48px] h-[48px] rounded-full bg-purple-primary"></div>
                )}
              </div>
              <div className="space-y-1">
                <div className="text-[16px]">
                  #{i + 1} {market.outcomes[i]}
                </div>
                <div className="text-[12px] text-[#999999] flex items-center space-x-[16px]">
                  {balances && balances[i] > 0n && (
                    <>
                      <div>
                        {displayBalance(balances[i], 18, true)} {tokensInfo[i].symbol}
                      </div>
                      <button className="text-purple-primary" type="button" onClick={addToWallet(i)}>
                        Add token to wallet
                      </button>
                    </>
                  )}

                  <a
                    href={blockExplorerUrl && `${blockExplorerUrl}/address/${wrappedAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-primary"
                  >
                    <EtherscanIcon width="12" height="12" />
                  </a>
                </div>
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
