import { useGetTradeInfo } from "@/hooks/trade/useGetTradeInfo";
import { RightArrow } from "@/lib/icons";
import { Trade } from "@swapr/sdk";
import { useState } from "react";
import { Alert } from "../Alert";
import Button from "../Form/Button";
import { Spinner } from "../Spinner";

interface SwapTokensConfirmationProps {
  closeConfirmSwapModel: () => void;
  trade: Trade | undefined;
  isLoading: boolean;
  onSubmit: () => Promise<void>;
}

export function SwapTokensConfirmation({
  closeConfirmSwapModel,
  trade,
  isLoading,
  onSubmit,
}: SwapTokensConfirmationProps) {
  const [isInvertedPrice, toggleInvertedPrice] = useState(false);
  const tradeInfo = useGetTradeInfo(trade);
  if (!tradeInfo) {
    return (
      <div className="flex flex-col justify-center items-center">
        <div className="w-[400px] h-[150px] flex items-center justify-center">
          <Spinner />
        </div>

        <div className="flex justify-center space-x-[24px] text-center mt-[32px]">
          <Button type="button" variant="secondary" text="Return" onClick={closeConfirmSwapModel} />
        </div>
      </div>
    );
  }
  const {
    inputToken,
    outputToken,
    inputAmount,
    outputAmount,
    price,
    minimumReceive,
    fee,
    maximumSlippage,
    invertedPrice,
  } = tradeInfo;
  return (
    <div className="flex flex-col justify-center items-center">
      <div className="w-[400px] h-[150px]">
        <div className="flex items-center justify-between mb-5">
          <p className="text-2xl">
            {inputAmount} {inputToken}
          </p>
          <RightArrow />
          <p className="text-2xl">
            {outputAmount} {outputToken}
          </p>
        </div>
        <div className="flex items-center justify-between">
          <p>Price</p>
          <p>
            {isInvertedPrice ? (
              <>
                {invertedPrice} {inputToken}/{outputToken}{" "}
              </>
            ) : (
              <>
                {price} {outputToken}/{inputToken}{" "}
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
            {minimumReceive} {outputToken}
          </p>
        </div>
        <div className="flex items-center justify-between mb-5">
          <p>Fee</p>
          <p>{fee}%</p>
        </div>
      </div>
      <Alert type="warning">
        Current slippage tolerance is {maximumSlippage}%. You will receive at least{" "}
        <span className="font-bold">
          {minimumReceive} {outputToken}
        </span>{" "}
        or the transaction will revert.
      </Alert>
      <div className="flex justify-center space-x-[24px] text-center mt-[32px]">
        <Button type="button" variant="secondary" text="Return" onClick={closeConfirmSwapModel} />
        <Button variant="primary" type="submit" isLoading={isLoading} text="Continue" onClick={onSubmit} />
      </div>
    </div>
  );
}
