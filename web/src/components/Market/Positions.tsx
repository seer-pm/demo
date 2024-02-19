import { Card } from "@/components/Card";
import { Market } from "@/hooks/useMarket";
import { usePositions } from "@/hooks/usePositions";
import { WRAPPED_OUTCOME_TOKEN_DECIMALS } from "@/lib/tokens";
import { displayBalance } from "@/lib/utils";
import { Address } from "viem";

interface PositionsProps {
  address: Address;
  chainId: number;
  router: Address;
  market: Market;
}

export function Positions({ address, chainId, router, market }: PositionsProps) {
  const { data: positions = [] } = usePositions(address, chainId, router, market.conditionId, market.outcomes.length);

  if (positions.length === 0) {
    return null;
  }

  return (
    <Card title="Your Positions">
      <div className="grid grid-cols-2 gap-3">
        {positions.map((position, i) => (
          <div key={position.tokenId}>
            <div>{market.outcomes[i]}</div>
            {displayBalance(position.balance, WRAPPED_OUTCOME_TOKEN_DECIMALS)}
          </div>
        ))}
      </div>
    </Card>
  );
}
