import { RightArrow } from "@/lib/icons";
import { displayNumber } from "@/lib/utils";
import Button from "../../Form/Button";

interface V4LimitOrderConfirmationProps {
  closeModal: () => void;
  onSubmit: () => Promise<void>;
  swapType: "buy" | "sell";
  shareAmount: string;
  shareSymbol: string;
  collateralAmount: string;
  collateralSymbol: string;
  limitPrice: number;
  nearestPrice?: number;
  isLoading: boolean;
}

export function V4LimitOrderConfirmation({
  closeModal,
  onSubmit,
  swapType,
  shareAmount,
  shareSymbol,
  collateralAmount,
  collateralSymbol,
  limitPrice,
  nearestPrice,
  isLoading,
}: V4LimitOrderConfirmationProps) {
  const showNearestPrice = nearestPrice !== undefined && Math.abs(nearestPrice - limitPrice) > 0.0001;

  const leftLabel = swapType === "buy" ? collateralAmount : shareAmount;
  const leftSymbol = swapType === "buy" ? collateralSymbol : shareSymbol;
  const rightLabel = swapType === "buy" ? shareAmount : collateralAmount;
  const rightSymbol = swapType === "buy" ? shareSymbol : collateralSymbol;

  return (
    <div className="flex flex-col justify-center items-center">
      <div className="min-w-[400px] min-h-[150px]">
        <div className="flex items-center justify-between mb-5 gap-2">
          <p className="text-2xl break-words">
            {leftLabel} {leftSymbol}
          </p>
          <RightArrow />
          <p className="text-2xl break-words">
            {rightLabel} {rightSymbol}
          </p>
        </div>
        <div className="flex items-center justify-between">
          <p>Limit price</p>
          <p>
            {displayNumber(limitPrice, 3)} {collateralSymbol}
          </p>
        </div>
        {showNearestPrice && (
          <div className="flex items-center justify-between">
            <p>Nearest available price</p>
            <p>
              {displayNumber(nearestPrice!, 3)} {collateralSymbol}
            </p>
          </div>
        )}
        <div className="flex items-center justify-between">
          <p>Order type</p>
          <p>Limit order (V4)</p>
        </div>
      </div>

      <div className="flex justify-center space-x-[24px] text-center mt-[32px]">
        <Button type="button" variant="secondary" text="Return" onClick={closeModal} />
        <Button variant="primary" type="button" text="Place order" onClick={() => onSubmit()} isLoading={isLoading} />
      </div>
    </div>
  );
}
