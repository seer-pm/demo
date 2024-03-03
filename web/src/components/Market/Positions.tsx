import { Card } from "@/components/Card";
import { Market } from "@/hooks/useMarket";
import { useMarketPositions } from "@/hooks/useMarketPositions";
import { useUserPositions } from "@/hooks/useUserPositions";
import { SUPPORTED_CHAINS, SupportedChain } from "@/lib/chains";
import { WRAPPED_OUTCOME_TOKEN_DECIMALS } from "@/lib/tokens";
import { displayBalance } from "@/lib/utils";
import { Address } from "viem";
import Button from "../Form/Button";

interface PositionsProps {
  account: Address | undefined;
  chainId: SupportedChain;
  router: Address;
  market: Market;
  tradeCallback: (action: "buy" | "sell", poolIndex: number) => void;
}

export function Positions({ account, chainId, router, market, tradeCallback }: PositionsProps) {
  const { data: userPositions = [] } = useUserPositions(
    account,
    chainId,
    router,
    market.conditionId,
    market.outcomes.length,
  );

  const { data: marketPositions = [] } = useMarketPositions(
    chainId,
    router,
    market.conditionId,
    market.outcomes.length,
  );

  if (marketPositions.length === 0) {
    return null;
  }

  const blockExplorerUrl = SUPPORTED_CHAINS[chainId].blockExplorers?.default?.url;

  return (
    <Card title="Positions">
      <div className="space-y-3">
        <div className="flex border-b pb-2">
          <div className="w-1/2">Outcome</div>
          <div>Actions</div>
        </div>
        {marketPositions.map((position, i) => (
          <div key={position.tokenId} className="flex border-b pb-2">
            <div className="w-1/2 space-y-1">
              <div>
                <a
                  href={blockExplorerUrl && `${blockExplorerUrl}/address/${position.tokenId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {market.outcomes[i]}
                </a>
              </div>
              {userPositions[i] && (
                <div className="text-xs">
                  Your balance: {displayBalance(userPositions[i].balance, WRAPPED_OUTCOME_TOKEN_DECIMALS)}
                </div>
              )}
            </div>
            <div className="space-x-3">
              <Button text="Buy" onClick={() => tradeCallback("buy", i)} className="bg-[green] text-white" />
              <Button text="Sell" onClick={() => tradeCallback("sell", i)} className="bg-[red] text-white" />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
