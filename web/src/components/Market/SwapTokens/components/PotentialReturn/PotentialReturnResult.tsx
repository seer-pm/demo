import { Token } from "@/lib/tokens";
import clsx from "clsx";
import { getPotentialReturn } from "./utils";

interface PotentialReturnResultProps {
  quoteIsLoading: boolean;
  isFetching: boolean;
  isCollateralNative: boolean;
  selectedCollateral: Token;
  receivedAmount: number;
  sDaiToDai: number;
  daiToSDai: number;
  returnPerToken: number;
  collateralPerShare: number;
  isOneOrNothingPotentialReturn: boolean;
}

export function PotentialReturnResult({
  quoteIsLoading,
  isFetching,
  isCollateralNative,
  selectedCollateral,
  receivedAmount,
  sDaiToDai,
  daiToSDai,
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
    isCollateralNative,
    receivedAmount,
    sDaiToDai,
    daiToSDai,
    isOneOrNothingPotentialReturn,
  );

  return (
    <span className={clsx(returnPercentage >= 0 ? "text-success-primary" : "text-error-primary", "text-right")}>
      {potentialReturn.toFixed(3)} {selectedCollateral.symbol} ({returnPercentage.toFixed(2)}
      %)
    </span>
  );
}
