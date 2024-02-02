import { useParams } from "react-router-dom";
import { Address } from "viem";
import { useAccount } from "wagmi";
import { Card } from "../components/Card";
import { MergeForm } from "../components/Market/MergeForm";
import { Positions } from "../components/Market/Positions";
import { SplitForm } from "../components/Market/SplitForm";
import { useMarket } from "../hooks/useMarket";
import { useMarketFactory } from "../hooks/useMarketFactory";
import { usePositions } from "../hooks/usePositions";

function Market() {
  const { chainId, address } = useAccount();
  const { id } = useParams();
  const { data: market, isError: isMarketError, isPending: isMarketPending } = useMarket(id as Address);
  const { data: marketFactory, isError: isFactoryError, isPending: isFactoryPending } = useMarketFactory(chainId);
  const {
    data: positions = [],
    isError: isPositionsError,
    isPending: isPositionsPending,
  } = usePositions(
    address,
    market?.conditionId,
    marketFactory?.conditionalTokens,
    marketFactory?.collateralToken,
    market?.outcomes?.length,
  );

  return (
    <div className="py-10 px-10">
      {isMarketError && <div className="alert alert-error mb-5">Market not found</div>}

      {(isMarketPending || isFactoryPending) && <span className="loading loading-spinner"></span>}

      {!isMarketError && !isFactoryError && market && marketFactory && (
        <div>
          <div className="text-4xl font-bold mb-5">{market.marketName}</div>

          <div className="grid grid-cols-12 gap-10">
            <div className="col-span-8">
              {market && marketFactory && (
                <Positions market={market} marketFactory={marketFactory} positions={positions} />
              )}
            </div>
            <div className="col-span-4 space-y-5">
              <Card>
                <SplitForm
                  account={address}
                  conditionalTokens={marketFactory.conditionalTokens}
                  collateralToken={marketFactory.collateralToken}
                  collateralDecimals={marketFactory.collateralDecimals}
                  conditionId={market.conditionId}
                  outcomeSlotCount={market.outcomes.length}
                />
              </Card>

              <Card>
                <MergeForm
                  account={address}
                  conditionalTokens={marketFactory.conditionalTokens}
                  collateralToken={marketFactory.collateralToken}
                  collateralDecimals={marketFactory.collateralDecimals}
                  conditionId={market.conditionId}
                  outcomeSlotCount={market.outcomes.length}
                  positions={positions}
                />
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Market;
