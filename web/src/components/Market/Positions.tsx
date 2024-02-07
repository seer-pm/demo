import { Card } from "@/components/Card";
import { Market } from "@/hooks/useMarket";
import { MarketFactory } from "@/hooks/useMarketFactory";
import { Position } from "@/hooks/usePositions";
import { displayBalance } from "@/lib/utils";

interface PositionsProps {
  market: Market;
  marketFactory: MarketFactory;
  positions: Position[];
}

export function Positions({ market, marketFactory, positions = [] }: PositionsProps) {
  if (positions.length === 0) {
    return null;
  }

  return (
    <Card title="Your Positions">
      <div className="grid grid-cols-2">
        {positions.map((position, i) => (
          <div key={position.positionId}>
            <div>{market.outcomes[i]}</div>
            {displayBalance(position.balance, marketFactory?.collateralDecimals!)}
          </div>
        ))}
      </div>
    </Card>
  );
}
