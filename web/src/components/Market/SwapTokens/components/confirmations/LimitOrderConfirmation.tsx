import { RightArrow } from "@/lib/icons";
import { UnsignedOrder } from "@cowprotocol/cow-sdk";
import { format } from "date-fns";
import { useState } from "react";
import { formatUnits } from "viem";
import Button from "../../../../Form/Button";

interface LimitOrderConfirmation {
  closeModal: () => void;
  reset: () => void;
  onSubmit: (order: UnsignedOrder) => Promise<void>;
  order: UnsignedOrder;
  buyTokenSymbol: string;
  sellTokenSymbol: string;
  limitPrice: number;
  isLoading: boolean;
}

export function LimitOrderConfirmation({
  closeModal,
  onSubmit,
  order,
  buyTokenSymbol,
  sellTokenSymbol,
  limitPrice,
  isLoading,
}: LimitOrderConfirmation) {
  const [isInvertedPrice, toggleInvertedPrice] = useState(false);
  const { buyAmount: buyAmountBigInt, sellAmount: sellAmountBigInt, validTo, partiallyFillable } = order;
  const buyAmount = Number(formatUnits(BigInt(buyAmountBigInt), 18)).toFixed(2);
  const sellAmount = Number(formatUnits(BigInt(sellAmountBigInt), 18)).toFixed(2);
  const invertedLimitPrice = 1 / limitPrice;
  return (
    <div className="flex flex-col justify-center items-center">
      <div className="min-w-[400px] min-h-[150px]">
        <div className="flex items-center justify-between mb-5 gap-2">
          <p className="text-2xl break-words">
            {sellAmount} {sellTokenSymbol}
          </p>
          <RightArrow />
          <p className="text-2xl break-words">
            {buyAmount} {buyTokenSymbol}
          </p>
        </div>
        <div className="flex items-center justify-between">
          <p>Price</p>
          <p>
            {isInvertedPrice ? (
              <>
                {invertedLimitPrice.toFixed(2)} {buyTokenSymbol}/{sellTokenSymbol}{" "}
              </>
            ) : (
              <>
                {limitPrice.toFixed(2)} {sellTokenSymbol}/{buyTokenSymbol}{" "}
              </>
            )}
            <span className="cursor-pointer" onClick={() => toggleInvertedPrice((state) => !state)}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="size-6 inline"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
                />
              </svg>
            </span>
          </p>
        </div>

        <div className="flex items-center justify-between">
          <p>Order expires</p>
          <p>{format(new Date(validTo * 1000), "yyyy-MM-dd HH:mm")}</p>
        </div>
        <div className="flex items-center justify-between">
          <p>Order type</p>
          <p>{partiallyFillable ? "Partially fillable" : "Fill or kill"}</p>
        </div>
      </div>

      <div className="flex justify-center space-x-[24px] text-center mt-[32px]">
        <Button type="button" variant="secondary" text="Return" onClick={closeModal} />
        <Button variant="primary" type="submit" text="Continue" onClick={() => onSubmit(order)} isLoading={isLoading} />
      </div>
    </div>
  );
}
