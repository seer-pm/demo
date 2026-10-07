import { useGetTradeInfo } from "@/hooks/trade/useGetTradeInfo";
import { useCheck7702Support } from "@/hooks/useCheck7702Support";
import { filterChain } from "@/lib/chains";
import { RightArrow } from "@/lib/icons";
import { getSplitStepMarketLabel } from "@/lib/split-steps";
import { displayBalance, displayNumber, isTwoStringsEqual } from "@/lib/utils";
import type { CompleteSetQuoteResult, Token } from "@seer-pm/sdk";
import {
  countCompleteSetBatches,
  getActiveCollateralProfile,
  getActiveCreditsSymbol,
  getSplitSteps,
} from "@seer-pm/sdk";
import { type AmmTrade } from "@seer-pm/sdk";
import clsx from "clsx";
import { type ReactNode, useEffect, useState } from "react";
import { formatUnits } from "viem";
import { Alert } from "../../Alert";
import Button from "../../Form/Button";
import { Spinner } from "../../Spinner";
import { LeftoverTokens } from "./components/LeftoverTokens";

interface SwapTokensConfirmationProps {
  closeModal: () => void;
  reset: () => void;
  trade: AmmTrade | undefined;
  quoteData?: CompleteSetQuoteResult;
  isLoading: boolean;
  onSubmit: (trade: AmmTrade) => Promise<void>;
  collateral: Token;
  originalAmount: string;
  isTradingCredits: boolean;
  outcomeToken: Token;
}

function isCompleteSetSummary(
  quoteData: CompleteSetQuoteResult | undefined,
): quoteData is CompleteSetQuoteResult & { route: "mintSell" | "buyMerge" | "mintToCover" } {
  return quoteData?.route === "mintSell" || quoteData?.route === "buyMerge" || quoteData?.route === "mintToCover";
}

function getRouteLabel(route: CompleteSetQuoteResult["route"] | undefined): string | undefined {
  if (route === "mintSell") {
    return "Strategy: mint + sell";
  }
  if (route === "buyMerge") {
    return "Strategy: buy + merge";
  }
  if (route === "mintToCover") {
    return "Strategy: mint to cover + sell";
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

/**
 * One line of the breakdown. The label keeps its natural width and the value takes the rest of
 * the row, so a value made of outcome names (full outcome text, not tickers) wraps on the right
 * instead of squeezing the label into a column of single words.
 */
function BreakdownRow({
  label,
  value,
  detail,
  emphasis,
}: {
  label: ReactNode;
  value: ReactNode;
  /** A second, quieter line under the value, for how the amount is made up. */
  detail?: ReactNode;
  emphasis?: boolean;
}) {
  return (
    <div className={clsx("grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 items-baseline", emphasis && "font-semibold")}>
      <span>{label}</span>
      <span className="text-right tabular-nums">{value}</span>
      {detail && (
        <span className="col-start-2 text-right tabular-nums text-[12px] font-normal text-black-secondary-fg">
          {detail}
        </span>
      )}
    </div>
  );
}

function CompleteSetBreakdown({ quoteData, collateral }: { quoteData: CompleteSetQuoteResult; collateral: Token }) {
  const leg = quoteData.completeSetLeg;
  const savingsMessage = getSavingsMessage(quoteData);

  if (!leg) {
    return null;
  }

  if (leg.route === "mintSell" && leg.splitAmount && leg.oppositeOutcomeToken) {
    const splitAmount = formatCompositeAmount(formatUnits(leg.splitAmount, collateral.decimals));
    const sellAmount = formatCompositeAmount(formatUnits(leg.splitAmount, leg.oppositeOutcomeToken.decimals));
    const netCost = formatCompositeAmount(quoteData.sellAmount);

    return (
      <div className="text-[14px] pb-4">
        <p className="text-2xl break-words font-semibold text-purple-primary">{getRouteLabel(quoteData.route)}</p>
        {savingsMessage && <p className="mt-1 text-[13px] text-black-secondary-fg">{savingsMessage}</p>}
        <div className="mt-3 space-y-2">
          <BreakdownRow label="1. Split (mint)" value={`${splitAmount} ${collateral.symbol}`} />
          <BreakdownRow
            label="2. Receive"
            value={`${splitAmount} ${leg.targetOutcomeToken.symbol} + ${splitAmount} ${leg.oppositeOutcomeToken.symbol}`}
          />
          <BreakdownRow
            label={`3. Sell ${leg.oppositeOutcomeToken.symbol}`}
            value={`${sellAmount} ${leg.oppositeOutcomeToken.symbol}`}
          />
        </div>
        <div className="mt-3 pt-3 border-t border-separator-100">
          <BreakdownRow emphasis label="Net cost" value={`${netCost} ${collateral.symbol}`} />
        </div>
      </div>
    );
  }

  if (leg.route === "mintToCover" && leg.splitAmount && leg.swapInputAmount) {
    const splitAmount = formatCompositeAmount(formatUnits(leg.splitAmount, collateral.decimals));
    const sellAmount = formatCompositeAmount(formatUnits(leg.swapInputAmount, leg.targetOutcomeToken.decimals));
    const held = leg.existingBalance ?? 0n;
    const proceeds = quoteData.value;
    const netCollateral = proceeds - leg.splitAmount;
    const leftovers = leg.leftoverTokens ?? [];
    // On a child market paid in the base collateral every ancestor's full set is minted first, root
    // first, and the outcome this market hangs off is split again. One row per split names what it spends.
    const steps = getSplitSteps(leg);
    const target = leg.targetOutcomeToken.symbol;

    return (
      <div className="text-[14px] pb-4">
        <p className="text-2xl break-words font-semibold text-purple-primary">{getRouteLabel(quoteData.route)}</p>
        <div className="mt-3 space-y-2">
          {steps.map((step, index) => (
            <BreakdownRow
              key={step.market.id}
              label={`${index + 1}. Mint (split ${getSplitStepMarketLabel(steps, index)})`}
              value={`${splitAmount} ${step.spendOutcome?.symbol ?? collateral.symbol}`}
            />
          ))}
          <BreakdownRow
            label={`${steps.length + 1}. Sell ${target}`}
            value={`${sellAmount} ${target}`}
            detail={
              held > 0n
                ? `${formatCompositeAmount(formatUnits(held, leg.targetOutcomeToken.decimals))} held + ${splitAmount} minted`
                : undefined
            }
          />
        </div>
        <div className="mt-3 pt-3 border-t border-separator-100 space-y-3">
          <BreakdownRow
            emphasis
            label={netCollateral < 0n ? "Net cost" : "Net received"}
            value={`${formatCompositeAmount(
              formatUnits(netCollateral < 0n ? -netCollateral : netCollateral, collateral.decimals),
            )} ${collateral.symbol}`}
          />
          {leftovers.length > 0 && (
            <div>
              <p className="font-semibold">You keep</p>
              <LeftoverTokens leftovers={leftovers} marketId={leg.market.id} layout="block" />
            </div>
          )}
        </div>
      </div>
    );
  }

  if (leg.route === "buyMerge" && leg.mergeAmount && leg.oppositeOutcomeToken) {
    const mergeAmount = formatCompositeAmount(formatUnits(leg.mergeAmount, leg.targetOutcomeToken.decimals));
    const buyAmount = formatCompositeAmount(formatUnits(leg.mergeAmount, leg.oppositeOutcomeToken.decimals));
    const buyCost = formatCompositeAmount(formatUnits(quoteData.netCollateral, collateral.decimals));

    return (
      <div className="text-[14px] pb-4">
        <p className="text-2xl break-words font-semibold text-purple-primary">{getRouteLabel(quoteData.route)}</p>
        {savingsMessage && <p className="mt-1 text-[13px] text-black-secondary-fg">{savingsMessage}</p>}
        <div className="mt-3 space-y-2">
          <BreakdownRow
            label={`1. Use ${leg.targetOutcomeToken.symbol}`}
            value={`${mergeAmount} ${leg.targetOutcomeToken.symbol}`}
          />
          <BreakdownRow
            label={`2. Buy ${leg.oppositeOutcomeToken.symbol}`}
            value={`${buyAmount} ${leg.oppositeOutcomeToken.symbol} (${buyCost} ${collateral.symbol})`}
          />
          {leg.invalidOutcomeToken && (
            <BreakdownRow
              label={`3. Use ${leg.invalidOutcomeToken.symbol}`}
              value={`${mergeAmount} ${leg.invalidOutcomeToken.symbol}`}
            />
          )}
          <BreakdownRow
            label={leg.invalidOutcomeToken ? "4. Merge sets" : "3. Merge sets"}
            value={`${mergeAmount} ${collateral.symbol}`}
          />
        </div>
        <div className="mt-3 pt-3 border-t border-separator-100">
          <BreakdownRow
            emphasis
            label="Net received"
            value={`${displayBalance(quoteData.value, quoteData.decimals, false)} ${collateral.symbol}`}
          />
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
  trade: AmmTrade;
  quoteData: CompleteSetQuoteResult;
  collateral: Token;
}) {
  const { maximumSlippage, minimumReceive, maximumSent } = useGetTradeInfo(trade)!;
  const supports7702 = useCheck7702Support();
  const batchCount = quoteData.completeSetLeg ? countCompleteSetBatches(quoteData.completeSetLeg) : 1;

  const slippageAlert =
    quoteData.route === "mintSell" || quoteData.route === "mintToCover" ? (
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
      <div className="w-full min-h-[150px]">
        <CompleteSetBreakdown quoteData={quoteData} collateral={collateral} />
      </div>
      <div className="mt-2 space-y-2">
        {!supports7702 && (
          <Alert type="warning">
            This runs as separate transactions. If the sell fails after the mint you keep the minted tokens. You can
            merge them back into {collateral.symbol} from the Merge tab.
          </Alert>
        )}
        {supports7702 && batchCount > 1 && (
          <Alert type="warning">
            The sets to mint are too large for one transaction, so this runs as {batchCount} transactions, each
            confirmed in your wallet. If one fails after the first you keep the full sets already minted and can merge
            them back from the Merge tab.
          </Alert>
        )}
        {slippageAlert}
      </div>
    </>
  );
}

function ShowSwapSummary({
  trade,
  collateral,
  isTradingCredits,
  outcomeToken,
}: {
  trade: AmmTrade;
  collateral: Token;
  isTradingCredits: boolean;
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
  outputToken = outputToken?.slice(0, 31);

  price = !isTwoStringsEqual(collateral.address, primaryCollateral)
    ? (Number(outputAmount) / Number(inputAmount)).toFixed(2)
    : price;
  invertedPrice = !isTwoStringsEqual(collateral.address, primaryCollateral)
    ? (1 / Number(price)).toFixed(2)
    : invertedPrice;

  return (
    <>
      <div className="w-full min-h-[150px]">
        <div className="flex items-center justify-between mb-5 gap-2">
          <p className="text-2xl break-words">
            {inputAmount} {isTradingCredits ? getActiveCreditsSymbol() : inputToken}
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
  isTradingCredits,
  outcomeToken,
}: SwapTokensConfirmationProps) {
  if (!trade) {
    return (
      <div className="flex flex-col justify-center items-center">
        <div className="w-full h-[150px] flex items-center justify-center">
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
          isTradingCredits={isTradingCredits}
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
