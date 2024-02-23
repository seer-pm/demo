import { Card } from "@/components/Card";
import { Market } from "@/hooks/useMarket";
import { useMarketPositions } from "@/hooks/useMarketPositions";
import { usePositions } from "@/hooks/usePositions";
import { SUPPORTED_CHAINS } from "@/lib/config";
import { WRAPPED_OUTCOME_TOKEN_DECIMALS } from "@/lib/tokens";
import { displayBalance } from "@/lib/utils";
import { Address } from "viem";
import Button from "../Form/Button";

interface PositionsProps {
  account: Address | undefined;
  chainId: number;
  router: Address;
  market: Market;
  tradeCallback: (action: "buy" | "sell", poolIndex: number) => void;
}

export function Positions({ account, chainId, router, market, tradeCallback }: PositionsProps) {
  const { data: positions = [] } = usePositions(account, chainId, router, market.conditionId, market.outcomes.length);

  const { data: marketPositions = [] } = useMarketPositions(
    account,
    chainId,
    router,
    market.conditionId,
    market.outcomes.length,
    market.pools,
  );

  if (positions.length === 0 || marketPositions.length === 0) {
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
        {positions.map((position, i) => (
          <div key={position.tokenId} className="flex border-b pb-2">
            <div className="w-1/2 space-y-1">
              <div>
                <a
                  href={`${blockExplorerUrl}/address/${position.tokenId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {market.outcomes[i]}
                </a>
              </div>
              <div className="text-xs">
                Your balance: {displayBalance(position.balance, WRAPPED_OUTCOME_TOKEN_DECIMALS)}
              </div>
              <div className="space-x-2 text-xs">
                <a
                  href={`https://${chainId === 5 ? "testnet" : "app"}.mav.xyz/boosted-positions/${
                    market.pools[i]
                  }?chain=${chainId}`}
                  className="text-primary hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Add liquidity
                </a>

                <span>
                  {displayBalance(marketPositions[i].tokenABalance, 18)} {marketPositions[i].tokenASymbol},{" "}
                  {displayBalance(marketPositions[i].tokenBBalance, 18)} {marketPositions[i].tokenBSymbol}
                </span>
              </div>
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
