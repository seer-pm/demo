import type { Token } from "@seer-pm/sdk";
import clsx from "clsx";
import { getPotentialReturn } from "./utils";

interface PotentialReturnResultProps {
  quoteIsLoading: boolean;
  isFetching: boolean;
  isSecondaryCollateral: boolean;
  selectedCollateral: Token;
  receivedAmount: number;
  sharesToAssets: number;
  assetsToShares: number;
  returnPerToken: number;
  collateralPerShare: number;
  isOneOrNothingPotentialReturn: boolean;
}

export function PotentialReturnResult({
  quoteIsLoading,
  isFetching,
  isSecondaryCollateral,
  selectedCollateral,
  receivedAmount,
  sharesToAssets,
  assetsToShares,
  returnPerToken,
  collateralPerShare,
  isOneOrNothingPotentialReturn,
}: PotentialReturnResultProps) {
  if (quoteIsLoading || isFetching) {
    return <div className="shimmer-container ml-2 w-[100px]" />;
  }

  const { returnPercentage, potentialReturn } = getPotentialReturn(
    collateralPerShare,
    returnPerToken,
    isSecondaryCollateral,
    receivedAmount,
    sharesToAssets,
    assetsToShares,
    isOneOrNothingPotentialReturn,
  );

  return (
    <span className="shrink-0 whitespace-nowrap text-right tabular-nums">
      {potentialReturn.toFixed(2)} {selectedCollateral.symbol}{" "}
      <span className={clsx("font-semibold", returnPercentage >= 0 ? "text-signed-up" : "text-signed-down")}>
        ({returnPercentage >= 0 ? "+" : ""}
        {returnPercentage.toFixed(1)}%)
      </span>
    </span>
  );
}
