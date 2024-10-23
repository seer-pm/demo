import { Token } from "@/lib/tokens";
import { CoWTrade, SwaprV3Trade, Trade, UniswapTrade } from "@swapr/sdk";
import BuyInStepsButton from "./components/BuyInStepsButton";
import SellInStepsButton from "./components/SellInStepsButton";

interface SwapTokensConfirmationInStepsProps {
  trade: Trade;
  isLoading: boolean;
  onSubmit: (trade: CoWTrade | SwaprV3Trade | UniswapTrade) => Promise<void>;
  closeModalAndReset: () => void;
  collateral: Token;
  originalAmount: string;
  swapType: "buy" | "sell";
}

export function SwapTokensConfirmationInSteps({
  trade,
  isLoading,
  onSubmit,
  collateral,
  originalAmount,
  swapType,
  closeModalAndReset,
}: SwapTokensConfirmationInStepsProps) {
  if (swapType === "buy") {
    return (
      <BuyInStepsButton
        trade={trade}
        collateral={collateral}
        originalAmount={originalAmount}
        isLoading={isLoading}
        onSubmit={onSubmit}
      />
    );
  }
  return (
    <SellInStepsButton
      trade={trade}
      collateral={collateral}
      isLoading={isLoading}
      closeModalAndReset={closeModalAndReset}
    />
  );
}
