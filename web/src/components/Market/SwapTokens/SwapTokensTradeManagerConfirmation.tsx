import { useGlobalState } from "@/hooks/useGlobalState";
import { RightArrow } from "@/lib/icons";
import { useState } from "react";
import { Alert } from "../../Alert";
import Button from "../../Form/Button";

interface SwapTokensConfirmationProps {
  closeModal: () => void;
  quoteData: { buyToken: { symbol: string }; sellToken: { symbol: string }; amountIn: number; amountOut: number };
  isLoading: boolean;
  onSubmit: () => Promise<void>;
}

export function SwapTokensTradeManagerConfirmation({
  closeModal,
  quoteData,
  isLoading,
  onSubmit,
}: SwapTokensConfirmationProps) {
  const [isInvertedPrice, toggleInvertedPrice] = useState(false);
  const { buyToken, sellToken, amountIn, amountOut } = quoteData;
  const price = (amountOut / amountIn).toFixed(6);
  const invertedPrice = (1 / Number(price)).toFixed(6);
  const maxSlippage = useGlobalState((state) => state.maxSlippage);
  const minimumReceive = (amountOut * (1 - Number(maxSlippage) / 100)).toFixed(6);
  return (
    <div className="flex flex-col justify-center items-center">
      <div className="min-w-[400px] min-h-[150px]">
        <div className="flex items-center justify-between mb-5 gap-2">
          <p className="text-2xl break-words">
            {amountIn.toFixed(6)} {sellToken.symbol}
          </p>
          <RightArrow />
          <p className="text-2xl break-words">
            {amountOut.toFixed(6)} {buyToken.symbol}
          </p>
        </div>
        <div className="flex items-center justify-between">
          <p>Price</p>
          <p>
            {isInvertedPrice ? (
              <>
                {invertedPrice} {sellToken.symbol}/{buyToken.symbol}{" "}
              </>
            ) : (
              <>
                {price} {buyToken.symbol}/{sellToken.symbol}{" "}
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
          <p>Minimum received</p>
          <p>
            {minimumReceive} {buyToken.symbol}
          </p>
        </div>
      </div>
      <Alert type="warning">
        Current slippage tolerance is {maxSlippage}%. You will receive at least{" "}
        <span className="font-bold">
          {minimumReceive} {buyToken.symbol}
        </span>{" "}
        or the transaction will revert.
      </Alert>

      <div className="flex justify-center space-x-[24px] text-center mt-[32px]">
        <Button type="button" variant="secondary" text="Return" onClick={closeModal} />
        <Button variant="primary" type="submit" isLoading={isLoading} text="Continue" onClick={() => onSubmit()} />
      </div>
    </div>
  );
}
