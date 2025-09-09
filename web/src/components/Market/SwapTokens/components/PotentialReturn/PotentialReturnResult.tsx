import { Token } from "@/lib/tokens";
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
    <span className={clsx(returnPercentage >= 0 ? "text-success-primary" : "text-error-primary", "text-right")}>
      {potentialReturn.toFixed(3)} {selectedCollateral.symbol} ({returnPercentage.toFixed(2)}
      %)
    </span>
  );
}
