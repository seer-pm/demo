import { QuestionIcon } from "@/lib/icons";
import { Market } from "@/lib/market";
import { MarketTypes, getMarketType } from "@/lib/market";
import { Token, getPotentialReturn } from "@/lib/tokens";
import clsx from "clsx";
import PotentialReturnConfig from "./PotentialReturnConfig";

interface PotentialReturnProps {
  swapType: "buy" | "sell";
  isCollateralDai: boolean;
  selectedCollateral: Token;
  sDaiToDai: number;
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
  isCollateralDai,
  selectedCollateral,
  sDaiToDai,
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
        isCollateralDai={isCollateralDai}
        quoteIsLoading={quoteIsLoading}
        isFetching={isFetching}
        amount={amount}
        receivedAmount={receivedAmount}
        collateralPerShare={collateralPerShare}
      />
    );
  }

  return (
    <div className="flex justify-between text-[#828282] text-[14px]">
      <div className="flex items-center gap-2 relative">
        Potential return{" "}
        <span className="tooltip">
          <p className="tooltiptext !whitespace-break-spaces !w-[300px]">
            Each token can be redeemed for 1 {isCollateralDai ? "sDAI" : selectedCollateral.symbol}
            {isCollateralDai ? ` (or ${sDaiToDai.toFixed(3)} ${selectedCollateral.symbol})` : ""} if the market resolves
            to {outcomeText}.
          </p>
          <QuestionIcon fill="#9747FF" />
        </span>
      </div>
      <PotentialReturnResult
        quoteIsLoading={quoteIsLoading}
        isFetching={isFetching}
        isCollateralDai={isCollateralDai}
        selectedCollateral={selectedCollateral}
        receivedAmount={receivedAmount}
        sDaiToDai={sDaiToDai}
        returnPerToken={1}
        collateralPerShare={collateralPerShare}
        isOneOrNothingPotentialReturn={isOneOrNothingPotentialReturn}
      />
    </div>
  );
}

interface PotentialReturnResultProps {
  quoteIsLoading: boolean;
  isFetching: boolean;
  isCollateralDai: boolean;
  selectedCollateral: Token;
  receivedAmount: number;
  sDaiToDai: number;
  returnPerToken: number;
  collateralPerShare: number;
  isOneOrNothingPotentialReturn: boolean;
}

export function PotentialReturnResult({
  quoteIsLoading,
  isFetching,
  isCollateralDai,
  selectedCollateral,
  receivedAmount,
  sDaiToDai,
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
    isCollateralDai,
    receivedAmount,
    sDaiToDai,
    isOneOrNothingPotentialReturn,
  );

  return (
    <span className={clsx(returnPercentage >= 0 ? "text-success-primary" : "text-error-primary", "text-right")}>
      {potentialReturn.toFixed(3)} {selectedCollateral.symbol} ({returnPercentage.toFixed(2)}
      %)
    </span>
  );
}
