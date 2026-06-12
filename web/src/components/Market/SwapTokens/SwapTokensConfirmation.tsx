import { useGetTradeInfo } from "@/hooks/trade/useGetTradeInfo";
import { filterChain } from "@/lib/chains";
import { RightArrow } from "@/lib/icons";
import { displayBalance, displayNumber, isTwoStringsEqual } from "@/lib/utils";
import type { CompleteSetQuoteResult, Token } from "@seer-pm/sdk";
import { getActiveCollateralProfile } from "@seer-pm/sdk";
import { CoWTrade, SwaprV3Trade, UniswapTrade } from "@seer-pm/sdk";
import { useEffect, useState } from "react";
import { formatUnits } from "viem";
import { Alert } from "../../Alert";
import Button from "../../Form/Button";
import { Spinner } from "../../Spinner";

interface SwapTokensConfirmationProps {
  closeModal: () => void;
  reset: () => void;
  trade: CoWTrade | SwaprV3Trade | UniswapTrade | undefined;
  quoteData?: CompleteSetQuoteResult;
  isLoading: boolean;
  onSubmit: (trade: CoWTrade | SwaprV3Trade | UniswapTrade) => Promise<void>;
  collateral: Token;
  originalAmount: string;
  isBuyExactOutputNative: boolean;
  isSellToNative: boolean;
  isSeerCredits: boolean;
  outcomeToken: Token;
}

function isCompleteSetSummary(
  quoteData: CompleteSetQuoteResult | undefined,
): quoteData is CompleteSetQuoteResult & { route: "mintSell" | "buyMerge" } {
  return quoteData?.route === "mintSell" || quoteData?.route === "buyMerge";
}

function getRouteLabel(route: CompleteSetQuoteResult["route"] | undefined): string | undefined {
  if (route === "mintSell") {
    return "Strategy: mint + sell";
  }
  if (route === "buyMerge") {
    return "Strategy: buy + merge";
  }
  return undefined;
}

function formatCompositeAmount(value: string | number, decimals = 4): string {
  return displayNumber(Number(value), decimals);
}

function getSavingsMessage(quoteData: CompleteSetQuoteResult): string | undefined {
  if (!quoteData.savingsPercent || quoteData.savingsPercent <= 0) {
    return undefined;
  }

  const pct = formatCompositeAmount(quoteData.savingsPercent, 1);

  if (quoteData.route === "mintSell") {
    return `Using mint + sell gives you a quote ${pct}% better than buying directly.`;
  }

  if (quoteData.route === "buyMerge") {
    return `Using buy + merge gives you a quote ${pct}% better than selling directly.`;
  }

  return undefined;
}

function CompleteSetBreakdown({
  quoteData,
  collateral,
}: {
  quoteData: CompleteSetQuoteResult;
  collateral: Token;
}) {
  const leg = quoteData.completeSetLeg;
  const savingsMessage = getSavingsMessage(quoteData);

  if (!leg) {
    return null;
  }

  if (leg.route === "mintSell" && leg.splitAmount) {
    const splitAmount = formatCompositeAmount(formatUnits(leg.splitAmount, collateral.decimals));
    const sellAmount = formatCompositeAmount(formatUnits(leg.splitAmount, leg.oppositeOutcomeToken.decimals));
    const netCost = formatCompositeAmount(quoteData.sellAmount);

    return (
      <div className="space-y-2 text-[14px] pb-4">
        <p className="text-2xl break-words font-semibold text-purple-primary">{getRouteLabel(quoteData.route)}</p>
        {savingsMessage && <p className="text-[13px] text-black-secondary">{savingsMessage}</p>}
        <div className="flex items-center justify-between gap-2">
          <span>1. Split (mint)</span>
          <span className="text-right">
            {splitAmount} {collateral.symbol}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span>2. Receive</span>
          <span className="text-right">
            {splitAmount} {leg.targetOutcomeToken.symbol} + {splitAmount} {leg.oppositeOutcomeToken.symbol}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span>3. Sell {leg.oppositeOutcomeToken.symbol}</span>
          <span className="text-right">
            {sellAmount} {leg.oppositeOutcomeToken.symbol}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 font-semibold">
          <span>Net cost</span>
          <span className="text-right">
            {netCost} {collateral.symbol}
          </span>
        </div>
      </div>
    );
  }

  if (leg.route === "buyMerge" && leg.mergeAmount) {
    const mergeAmount = formatCompositeAmount(formatUnits(leg.mergeAmount, leg.targetOutcomeToken.decimals));
    const buyAmount = formatCompositeAmount(formatUnits(leg.mergeAmount, leg.oppositeOutcomeToken.decimals));
    const buyCost = formatCompositeAmount(formatUnits(quoteData.netCollateral, collateral.decimals));

    return (
      <div className="space-y-2 text-[14px] pb-4">
        <p className="text-2xl break-words font-semibold text-purple-primary">{getRouteLabel(quoteData.route)}</p>
        {savingsMessage && <p className="text-[13px] text-black-secondary">{savingsMessage}</p>}
        <div className="flex items-center justify-between gap-2">
          <span>1. Use {leg.targetOutcomeToken.symbol}</span>
          <span className="text-right">
            {mergeAmount} {leg.targetOutcomeToken.symbol}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span>2. Buy {leg.oppositeOutcomeToken.symbol}</span>
          <span className="text-right">
            {buyAmount} {leg.oppositeOutcomeToken.symbol} ({buyCost} {collateral.symbol})
          </span>
        </div>
        {leg.invalidOutcomeToken && (
          <div className="flex items-center justify-between gap-2">
            <span>3. Use {leg.invalidOutcomeToken.symbol}</span>
            <span className="text-right">
              {mergeAmount} {leg.invalidOutcomeToken.symbol}
            </span>
          </div>
        )}
        <div className="flex items-center justify-between gap-2">
          <span>{leg.invalidOutcomeToken ? "4. Merge sets" : "3. Merge sets"}</span>
          <span className="text-right">
            {mergeAmount} {collateral.symbol}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 font-semibold">
          <span>Net received</span>
          <span className="text-right">
            {displayBalance(quoteData.value, quoteData.decimals, false)} {collateral.symbol}
          </span>
        </div>
      </div>
    );
  }

  return null;
}

function ShowCompleteSetSummary({
  trade,
  quoteData,
  collateral,
}: {
  trade: CoWTrade | SwaprV3Trade | UniswapTrade;
  quoteData: CompleteSetQuoteResult;
  collateral: Token;
}) {
  const { maximumSlippage, minimumReceive, maximumSent } = useGetTradeInfo(trade)!;

  const slippageAlert =
    quoteData.route === "mintSell" ? (
      <Alert type="warning">
        Current slippage tolerance is {maximumSlippage}%. The sell step will return at least{" "}
        <span className="font-bold">
          {minimumReceive} {collateral.symbol}
        </span>{" "}
        or the transaction will revert.
      </Alert>
    ) : (
      <Alert type="warning">
        Current slippage tolerance is {maximumSlippage}%. The buy step will spend at most{" "}
        <span className="font-bold">
          {maximumSent} {collateral.symbol}
        </span>{" "}
        or the transaction will revert.
      </Alert>
    );

  return (
    <>
      <div className="min-w-[400px] min-h-[150px]">
        <CompleteSetBreakdown quoteData={quoteData} collateral={collateral} />
      </div>
      {slippageAlert}
    </>
  );
}

function ShowSwapSummary({
  trade,
  collateral,
  isBuyExactOutputNative,
  isSellToNative,
  isSeerCredits,
  outcomeToken,
}: {
  trade: CoWTrade | SwaprV3Trade | UniswapTrade;
  collateral: Token;
  isBuyExactOutputNative: boolean;
  isSellToNative: boolean;
  isSeerCredits: boolean;
  outcomeToken: Token;
}) {
  const [isInvertedPrice, toggleInvertedPrice] = useState(false);
  const tradeInfo = useGetTradeInfo(trade)!;

  useEffect(() => {
    const isOutcomeInputToken = isTwoStringsEqual(tradeInfo.inputAddress, outcomeToken.address);
    toggleInvertedPrice(!isOutcomeInputToken);
  }, [tradeInfo.inputAddress, outcomeToken.address]);

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

  const primaryCollateral = getActiveCollateralProfile(filterChain(trade.chainId)).primary.address;
  const isExactInput = trade.tradeType === 0;
  inputToken = isBuyExactOutputNative ? "xDAI" : inputToken;
  outputToken = isSellToNative ? "xDAI" : outputToken?.slice(0, 31);

  price = !isTwoStringsEqual(collateral.address, primaryCollateral)
    ? (Number(outputAmount) / Number(inputAmount)).toFixed(2)
    : price;
  invertedPrice = !isTwoStringsEqual(collateral.address, primaryCollateral)
    ? (1 / Number(price)).toFixed(2)
    : invertedPrice;

  return (
    <>
      <div className="min-w-[400px] min-h-[150px]">
        <div className="flex items-center justify-between mb-5 gap-2">
          <p className="text-2xl break-words">
            {inputAmount} {isSeerCredits ? "SEER_CREDITS" : inputToken}
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
                {Number.isNaN(Number(invertedPrice)) ? "≈0" : invertedPrice} {inputToken}/{outputToken}{" "}
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
    </>
  );
}

export function SwapTokensConfirmation({
  closeModal,
  trade,
  quoteData,
  isLoading,
  onSubmit,
  collateral,
  isBuyExactOutputNative,
  isSellToNative,
  isSeerCredits,
  outcomeToken,
}: SwapTokensConfirmationProps) {
  if (!trade) {
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

  return (
    <div className="flex flex-col justify-center items-center">
      {isCompleteSetSummary(quoteData) ? (
        <ShowCompleteSetSummary trade={trade} quoteData={quoteData} collateral={collateral} />
      ) : (
        <ShowSwapSummary
          trade={trade}
          collateral={collateral}
          isBuyExactOutputNative={isBuyExactOutputNative}
          isSellToNative={isSellToNative}
          isSeerCredits={isSeerCredits}
          outcomeToken={outcomeToken}
        />
      )}

      <div className="flex justify-center space-x-[24px] text-center mt-[32px]">
        <Button type="button" variant="secondary" text="Return" onClick={closeModal} />
        <Button variant="primary" type="submit" isLoading={isLoading} text="Continue" onClick={() => onSubmit(trade)} />
      </div>
    </div>
  );
}
