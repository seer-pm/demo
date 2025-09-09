import { useShareAssetRatio } from "@/hooks/trade/useShareAssetRatio";
import { useMarketOdds } from "@/hooks/useMarketOdds";
import { useModal } from "@/hooks/useModal";
import { COLLATERAL_TOKENS } from "@/lib/config";
import { CloseIcon } from "@/lib/icons";
import { Market, MarketTypes, getMarketType } from "@/lib/market";
import { Token } from "@/lib/tokens";
import { useState } from "react";
import PotentialReturnInput from "./PotentialReturnInput";
import { PotentialReturnResult } from "./PotentialReturnResult";
import ScalarForecastChecker from "./ScalarForecastChecker";
import { PotentialReturnInputType } from "./interfaces";
import { getDefaultInput, getReturnPerToken } from "./utils";

function PotentialReturnConfig({
  market,
  selectedCollateral,
  outcomeToken,
  outcomeText,
  isSecondaryCollateral,
  quoteIsLoading = false,
  isFetching = false,
  amount,
  receivedAmount,
  collateralPerShare,
}: {
  market: Market;
  selectedCollateral: Token;
  outcomeToken: Token;
  outcomeText: string;
  isSecondaryCollateral: boolean;
  quoteIsLoading: boolean;
  isFetching: boolean;
  amount: string;
  receivedAmount: number;
  collateralPerShare: number;
}) {
  const primaryCollateral = COLLATERAL_TOKENS[market.chainId].primary;
  const { data: odds = [] } = useMarketOdds(market, true);
  const [input, setInput] = useState<PotentialReturnInputType>(
    getDefaultInput(market, outcomeToken, outcomeText, odds),
  );
  const { Modal, openModal, closeModal } = useModal("potential-return-config", false);

  const returnPerToken = getReturnPerToken(market, outcomeToken, outcomeText, input);

  const { sharesToAssets, assetsToShares } = useShareAssetRatio(market.chainId);
  const returnPerTokenDai = returnPerToken * (sharesToAssets ?? 0);

  const potentialReturnContent = (
    <div>
      <p>
        Return per token:{" "}
        <span className="font-semibold text-purple-primary">
          {returnPerToken.toFixed(3)} {isSecondaryCollateral ? primaryCollateral.symbol : selectedCollateral.symbol}
          {isSecondaryCollateral ? ` (${returnPerTokenDai.toFixed(3)} ${selectedCollateral.symbol})` : ""}
        </span>
      </p>
      {Number(amount) === 0 && (
        <p className="text-purple-primary text-[14px]">
          You need to buy more than 0 shares to calculate your potential return.
        </p>
      )}
      {Number(amount) > 0 && (
        <div>
          Potential return:{" "}
          <PotentialReturnResult
            quoteIsLoading={quoteIsLoading}
            isFetching={isFetching}
            isSecondaryCollateral={isSecondaryCollateral}
            selectedCollateral={selectedCollateral}
            receivedAmount={receivedAmount}
            sharesToAssets={sharesToAssets ?? 0}
            assetsToShares={assetsToShares ?? 0}
            returnPerToken={returnPerToken}
            collateralPerShare={collateralPerShare}
            isOneOrNothingPotentialReturn={false}
          />
        </div>
      )}
    </div>
  );

  const scalarPotentialReturnContent = (
    <ScalarForecastChecker
      market={market}
      outcomeToken={outcomeToken}
      selectedCollateral={selectedCollateral}
      forecast={input.scalar ?? 0}
      amount={amount}
      receivedAmount={receivedAmount}
      collateralPerShare={collateralPerShare}
      isSecondaryCollateral={isSecondaryCollateral}
      assetsToShares={assetsToShares ?? 0}
      sharesToAssets={sharesToAssets ?? 0}
    />
  );

  const modalContent = (
    <div className=" space-y-2 w-full -mt-[20px] ">
      <div>
        <button
          type="button"
          className="absolute right-[20px] top-[20px] hover:text-purple-primary"
          onClick={closeModal}
          aria-label="Close modal"
        >
          <CloseIcon fill="black" />
        </button>
        <p>Enter a possible market resolution to see your potential return.</p>
        <p className="font-semibold text-purple-primary py-1.5">Current Outcome: {outcomeText}</p>
        <div className="max-h-[200px] overflow-auto">
          <PotentialReturnInput market={market} input={input} setInput={setInput} />
        </div>

        <div>
          {getMarketType(market) === MarketTypes.SCALAR ? scalarPotentialReturnContent : potentialReturnContent}
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <button
        type="button"
        className="hover:opacity-80 text-purple-primary font-medium text-center w-full text-[15px]"
        onClick={openModal}
      >
        Calculate your potential return
      </button>
      <Modal title="Potential return calculator" content={modalContent} />
    </div>
  );
}

export default PotentialReturnConfig;
