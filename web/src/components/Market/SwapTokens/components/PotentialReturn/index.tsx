import { Market, MarketTypes, getMarketType } from "@seer-pm/sdk";
import type { Token } from "@seer-pm/sdk";
import PotentialReturnConfig from "./PotentialReturnConfig";
import { PotentialReturnResult } from "./PotentialReturnResult";

interface PotentialReturnProps {
  swapType: "buy" | "sell";
  isSecondaryCollateral: boolean;
  selectedCollateral: Token;
  sharesToAssets: number;
  assetsToShares: number;
  outcomeText: string;
  outcomeToken: Token;
  market: Market;
  quoteIsLoading: boolean;
  isFetching: boolean;
  amount: string;
  receivedAmount: number;
  collateralPerShare: number;
}

export function PotentialReturn({
  swapType,
  isSecondaryCollateral,
  selectedCollateral,
  sharesToAssets,
  assetsToShares,
  outcomeText,
  outcomeToken,
  market,
  quoteIsLoading,
  isFetching,
  amount,
  receivedAmount,
  collateralPerShare,
}: PotentialReturnProps) {
  if (swapType !== "buy" || market.type === "Futarchy") {
    return null;
  }

  const isOneOrNothingPotentialReturn =
    getMarketType(market) === MarketTypes.CATEGORICAL || outcomeToken.symbol === "SER-INVALID";

  if (!isOneOrNothingPotentialReturn) {
    return (
      <PotentialReturnConfig
        key={outcomeToken.address}
        market={market}
        selectedCollateral={selectedCollateral}
        outcomeToken={outcomeToken}
        outcomeText={outcomeText}
        isSecondaryCollateral={isSecondaryCollateral}
        quoteIsLoading={quoteIsLoading}
        isFetching={isFetching}
        amount={amount}
        receivedAmount={receivedAmount}
        collateralPerShare={collateralPerShare}
      />
    );
  }

  return (
    <div className="flex justify-between items-baseline text-[13px]">
      <span className="text-ink-4 font-medium">Potential return</span>
      <PotentialReturnResult
        quoteIsLoading={quoteIsLoading}
        isFetching={isFetching}
        isSecondaryCollateral={isSecondaryCollateral}
        selectedCollateral={selectedCollateral}
        receivedAmount={receivedAmount}
        sharesToAssets={sharesToAssets}
        assetsToShares={assetsToShares}
        returnPerToken={1}
        collateralPerShare={collateralPerShare}
        isOneOrNothingPotentialReturn={isOneOrNothingPotentialReturn}
      />
    </div>
  );
}
