import { iswxsDAI } from "@/hooks/trade";
import { useGetTradeInfo } from "@/hooks/trade/useGetTradeInfo";
import { COLLATERAL_TOKENS } from "@/lib/config";
import { Token } from "@/lib/tokens";
import { isTwoStringsEqual } from "@/lib/utils";
import { Trade } from "@swapr/sdk";
import { useMemo, useState } from "react";
import Button from "../../Form/Button";
import { Spinner } from "../../Spinner";
import { SwapTokensConfirmationInSteps } from "./SwapTokensConfirmationInSteps";
import { SwapTokensConfirmationInfo } from "./SwapTokensConfirmationInfo";

interface SwapTokensConfirmationProps {
  closeModal: () => void;
  trade: Trade | undefined;
  isLoading: boolean;
  onSubmit: () => Promise<void>;
  collateral: Token;
  originalAmount: string;
}

export function SwapTokensConfirmation({
  closeModal,
  trade: initialTrade,
  isLoading,
  onSubmit,
  collateral: initialCollateral,
  originalAmount: initialOriginalAmount,
}: SwapTokensConfirmationProps) {
  const trade = useMemo(() => initialTrade, []);
  const collateral = useMemo(() => initialCollateral, []);
  const originalAmount = useMemo(() => initialOriginalAmount, []);
  const tradeInfo = useGetTradeInfo(trade);
  const [isShowSteps, setShowSteps] = useState(false);
  const [hasSell, setHasSell] = useState(false);

  if (!tradeInfo) {
    return (
      <div className="flex flex-col justify-center items-center">
        <div className="w-[400px] h-[150px] flex items-center justify-center">
          <Spinner />
        </div>

        <div className="flex justify-center space-x-[24px] text-center mt-[32px]">
          <Button type="button" variant="secondary" text="Return" onClick={closeModal} />
        </div>
      </div>
    );
  }
  const { inputAddress, outputAddress } = tradeInfo;
  const sDAI = trade ? COLLATERAL_TOKENS[trade.chainId].primary.address : undefined;

  const needsToConvertCollateralToShares = iswxsDAI(collateral, trade?.chainId || 0);
  const isBuyWithDAI =
    isTwoStringsEqual(inputAddress, sDAI) &&
    !isTwoStringsEqual(collateral.address, sDAI) &&
    needsToConvertCollateralToShares;
  const isSellWithDAI =
    isTwoStringsEqual(outputAddress, sDAI) &&
    !isTwoStringsEqual(collateral.address, sDAI) &&
    needsToConvertCollateralToShares;
  if (isShowSteps) {
    return (
      <SwapTokensConfirmationInSteps
        back={() => setShowSteps(false)}
        closeModal={closeModal}
        trade={trade!}
        isLoading={isLoading}
        collateral={collateral}
        originalAmount={originalAmount}
        onSubmit={onSubmit}
        swapType={isBuyWithDAI ? "buy" : "sell"}
        hasSell={hasSell}
        setHasSell={(hasSell) => setHasSell(hasSell)}
      />
    );
  }

  return (
    <SwapTokensConfirmationInfo
      closeModal={closeModal}
      trade={trade!}
      isLoading={isLoading}
      collateral={collateral}
      originalAmount={originalAmount}
      onSubmit={async () => {
        if (isBuyWithDAI || isSellWithDAI) {
          setShowSteps(true);
        } else {
          await onSubmit();
          closeModal();
        }
      }}
    />
  );
}
