import { useGetTradeInfo } from "@/hooks/trade/useGetTradeInfo";
import { filterChain } from "@/lib/chains";
import { COLLATERAL_TOKENS } from "@/lib/config";
import { RightArrow } from "@/lib/icons";
import { Token } from "@/lib/tokens";
import { isTwoStringsEqual } from "@/lib/utils";
import { CoWTrade, SwaprV3Trade, UniswapTrade } from "@swapr/sdk";
import { useEffect, useState } from "react";
import { Alert } from "../../Alert";
import Button from "../../Form/Button";
import { Spinner } from "../../Spinner";

interface SwapTokensConfirmationProps {
  closeModal: () => void;
  reset: () => void;
  trade: CoWTrade | SwaprV3Trade | UniswapTrade | undefined;
  isLoading: boolean;
  onSubmit: (trade: CoWTrade | SwaprV3Trade | UniswapTrade) => Promise<void>;
  collateral: Token;
  originalAmount: string;
  isBuyExactOutputNative: boolean;
  isSellToNative: boolean;
  outcomeToken: Token;
}

export function SwapTokensConfirmation({
  closeModal,
  trade,
  isLoading,
  onSubmit,
  collateral,
  isBuyExactOutputNative,
  isSellToNative,
  outcomeToken,
}: SwapTokensConfirmationProps) {
  const [isInvertedPrice, toggleInvertedPrice] = useState(false);
  const tradeInfo = useGetTradeInfo(trade);
  useEffect(() => {
    if (!tradeInfo) return;
    const isOutcomeInputToken = isTwoStringsEqual(tradeInfo.inputAddress, outcomeToken.address);
    toggleInvertedPrice(!isOutcomeInputToken);
  }, []);

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
  let {
    inputToken,
    outputToken,
    inputAmount,
    outputAmount,
    price,
    minimumReceive,
    maximumSent,
    maximumSlippage,
    invertedPrice,
  } = tradeInfo;

  const primaryCollateral = COLLATERAL_TOKENS[filterChain(trade!.chainId)].primary.address;
  const isExactInput = trade!.tradeType === 0;
  inputToken = isBuyExactOutputNative ? "xDAI" : inputToken;
  outputToken = isSellToNative ? "xDAI" : outputToken?.slice(0, 31);

  price = !isTwoStringsEqual(collateral.address, primaryCollateral)
    ? (Number(outputAmount) / Number(inputAmount)).toFixed(2)
    : price;
  invertedPrice = !isTwoStringsEqual(collateral.address, primaryCollateral)
    ? (1 / Number(price)).toFixed(2)
    : invertedPrice;

  return (
    <div className="flex flex-col justify-center items-center">
      <div className="min-w-[400px] min-h-[150px]">
        <div className="flex items-center justify-between mb-5 gap-2">
          <p className="text-2xl break-words">
            {inputAmount} {inputToken}
          </p>
          <RightArrow />
          <p className="text-2xl break-words">
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
          <p>{isExactInput ? "Minimum received" : "Maximum sent"}</p>
          <p>
            {isExactInput ? minimumReceive : maximumSent} {isExactInput ? outputToken : inputToken}
          </p>
        </div>
      </div>
      <Alert type="warning">
        Current slippage tolerance is {maximumSlippage}%. You will {isExactInput ? "receive" : "sell"} at{" "}
        {isExactInput ? "least" : "most"}{" "}
        <span className="font-bold">
          {isExactInput ? minimumReceive : maximumSent} {isExactInput ? outputToken : inputToken}
        </span>{" "}
        or the transaction will revert.
      </Alert>

      <div className="flex justify-center space-x-[24px] text-center mt-[32px]">
        <Button type="button" variant="secondary" text="Return" onClick={closeModal} />
        <Button
          variant="primary"
          type="submit"
          isLoading={isLoading}
          text="Continue"
          onClick={() => onSubmit(trade!)}
        />
      </div>
    </div>
  );
}
