import type { Token } from "@seer-pm/sdk";
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
    <span className="font-mono tabular-nums font-semibold text-ink text-right text-[13px]">
      {potentialReturn.toFixed(3)} {selectedCollateral.symbol}
      <span className="font-sans font-medium text-ink-4 ml-1 text-[12px]">({returnPercentage.toFixed(2)}%)</span>
    </span>
  );
}
