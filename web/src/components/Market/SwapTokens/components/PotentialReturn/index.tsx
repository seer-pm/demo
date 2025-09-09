import { QuestionIcon } from "@/lib/icons";
import { Market, MarketTypes, getMarketType } from "@/lib/market";
import { Token } from "@/lib/tokens";
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
    <div className="flex justify-between text-[#828282] text-[14px]">
      <div className="flex items-center gap-2 relative">
        Potential return{" "}
        <span className="tooltip">
          <p className="tooltiptext !whitespace-break-spaces !w-[300px]">
            Each token can be redeemed for 1 {isSecondaryCollateral ? "sDAI" : selectedCollateral.symbol}
            {isSecondaryCollateral ? ` (or ${sharesToAssets.toFixed(3)} ${selectedCollateral.symbol})` : ""} if the
            market resolves to {outcomeText}.
          </p>
          <QuestionIcon fill="#9747FF" />
        </span>
      </div>
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
