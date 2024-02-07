import { Card } from "@/components/Card";
import { Market } from "@/hooks/useMarket";
import { MarketFactory } from "@/hooks/useMarketFactory";
import { usePositions } from "@/hooks/usePositions";
import { displayBalance } from "@/lib/utils";
import { Address } from "viem";

interface PositionsProps {
  address: Address;
  router: Address;
  market: Market;
  marketFactory: MarketFactory;
}

export function Positions({ address, router, market, marketFactory }: PositionsProps) {
  const { data: positions = [] } = usePositions(
    address,
    router,
    market.conditionId,
    marketFactory.conditionalTokens,
    marketFactory.collateralToken,
    market.outcomes.length,
  );

  if (positions.length === 0) {
    return null;
  }

  return (
    <Card title="Your Positions">
      <div className="grid grid-cols-2">
        {positions.map((position, i) => (
          <div key={position.tokenId}>
            <div>{market.outcomes[i]}</div>
            {displayBalance(position.balance, marketFactory?.collateralDecimals!)}
          </div>
        ))}
      </div>
    </Card>
  );
}
