import { useGetTradeInfo } from "@/hooks/trade/useGetTradeInfo";
import { useCheck7702Support } from "@/hooks/useCheck7702Support";
import { filterChain } from "@/lib/chains";
import { RightArrow } from "@/lib/icons";
import { summarizeLeftovers } from "@/lib/leftovers";
import { displayBalance, displayNumber, isTwoStringsEqual } from "@/lib/utils";
import type { CompleteSetQuoteResult, Token } from "@seer-pm/sdk";
import { getActiveCollateralProfile, getActiveCreditsSymbol } from "@seer-pm/sdk";
import { type AmmTrade } from "@seer-pm/sdk";
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
  /** Primary button label, naming the action (e.g. "Buy Yashar"). */
  confirmText?: string;
  /** What the position pays if the outcome wins, when a single figure exists. */
  payoutLine?: string;
}

// Below this the default tolerance is in play and the minimum is a plain fact, not a risk.
const HIGH_SLIPPAGE_PERCENT = 3;

function SlippageNotice({ maximumSlippage, children }: { maximumSlippage: string | number; children: ReactNode }) {
  if (Number(maximumSlippage) < HIGH_SLIPPAGE_PERCENT) {
    return null;
  }
  return (
    <Alert type="warning" className="mt-4">
      Max slippage is {maximumSlippage}%. {children}
    </Alert>
  );
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

  if (leg.route === "mintSell" && leg.splitAmount && leg.oppositeOutcomeToken) {
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

  if (leg.route === "mintToCover" && leg.splitAmount && leg.swapInputAmount) {
    const splitAmount = formatCompositeAmount(formatUnits(leg.splitAmount, collateral.decimals));
    const sellAmount = formatCompositeAmount(formatUnits(leg.swapInputAmount, leg.targetOutcomeToken.decimals));
    const held = leg.existingBalance ?? 0n;
    const proceeds = quoteData.value;
    const netCollateral = proceeds - leg.splitAmount;
    const leftovers = leg.leftoverTokens ?? [];

    return (
      <div className="space-y-2 text-[14px] pb-4">
        <p className="text-2xl break-words font-semibold text-purple-primary">{getRouteLabel(quoteData.route)}</p>
        <div className="flex items-center justify-between gap-2">
          <span>1. Mint (split)</span>
          <span className="text-right">
            {splitAmount} {collateral.symbol}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span>2. Receive</span>
          <span className="text-right">
            {splitAmount} {leg.targetOutcomeToken.symbol}
            {leftovers.length > 0 ? ` + ${summarizeLeftovers(leftovers)}` : ""}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span>3. Sell {leg.targetOutcomeToken.symbol}</span>
          <span className="text-right">
            {sellAmount} {leg.targetOutcomeToken.symbol}
            {held > 0n
              ? ` (${formatCompositeAmount(formatUnits(held, leg.targetOutcomeToken.decimals))} held + ${splitAmount} minted)`
              : ""}
          </span>
        </div>
        {leftovers.length > 0 && (
          <div className="flex items-start justify-between gap-2 font-semibold">
            <span>You keep</span>
            <LeftoverTokens leftovers={leftovers} className="text-right" />
          </div>
        )}
        <div className="flex items-center justify-between gap-2 font-semibold">
          <span>{netCollateral < 0n ? "Net cost" : "Net received"}</span>
          <span className="text-right">
            {formatCompositeAmount(
              formatUnits(netCollateral < 0n ? -netCollateral : netCollateral, collateral.decimals),
            )}{" "}
            {collateral.symbol}
          </span>
        </div>
        <p className="text-[13px] text-black-secondary">
          You end up short {sellAmount} {leg.targetOutcomeToken.symbol} and long {splitAmount} of every other outcome
          {held > 0n ? `, having sold the ${leg.targetOutcomeToken.symbol} you already held` : ""}.
        </p>
      </div>
    );
  }

  if (leg.route === "buyMerge" && leg.mergeAmount && leg.oppositeOutcomeToken) {
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
  trade: AmmTrade;
  quoteData: CompleteSetQuoteResult;
  collateral: Token;
}) {
  const { maximumSlippage, minimumReceive, maximumSent } = useGetTradeInfo(trade)!;
  const supports7702 = useCheck7702Support();

  const isSellStep = quoteData.route === "mintSell" || quoteData.route === "mintToCover";
  const boundLabel = isSellStep ? "Sell step returns at least" : "Buy step spends at most";
  const boundValue = isSellStep ? minimumReceive : maximumSent;

  return (
    <>
      <div className="w-full sm:min-w-[400px] min-h-[150px]">
        <CompleteSetBreakdown quoteData={quoteData} collateral={collateral} />
        <div className="flex items-center justify-between gap-2 border-t border-[var(--seer-border)] pt-3 text-[14px]">
          <span className="text-[var(--seer-muted)]">{boundLabel}</span>
          <span className="text-right tabular-nums">
            {boundValue} {collateral.symbol}
          </span>
        </div>
      </div>
      {!supports7702 && (
        <Alert type="warning" className="mt-4">
          This runs as separate transactions. If the sell fails after the mint, you keep the minted tokens and can merge
          them back into {collateral.symbol} from the Merge tab.
        </Alert>
      )}
      <SlippageNotice maximumSlippage={maximumSlippage}>
        If the price moves that far before the trade confirms, it reverts.
      </SlippageNotice>
    </>
  );
}

function ShowSwapSummary({
  trade,
  collateral,
  isTradingCredits,
  outcomeToken,
  payoutLine,
}: {
  trade: AmmTrade;
  collateral: Token;
  isTradingCredits: boolean;
  outcomeToken: Token;
  payoutLine?: string;
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
      <div className="w-full sm:min-w-[400px] space-y-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-2xl break-words tabular-nums">
            {inputAmount} {isTradingCredits ? getActiveCreditsSymbol() : inputToken}
          </p>
          <RightArrow />
          <p className="text-2xl break-words text-right tabular-nums">
            {outputAmount} {outputToken}
          </p>
        </div>
        {payoutLine && (
          <p className="rounded-control bg-[var(--seer-accent-soft)] px-3 py-2 text-[14px] font-semibold text-[var(--seer-accent-text)]">
            {payoutLine}
          </p>
        )}
        <div className="space-y-2 text-[14px]">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[var(--seer-muted)]">Price</p>
            <p className="flex items-center gap-1 tabular-nums">
              {isInvertedPrice ? (
                <>
                  {Number.isNaN(Number(invertedPrice)) ? "≈0" : invertedPrice} {inputToken}/{outputToken}
                </>
              ) : (
                <>
                  {price} {outputToken}/{inputToken}
                </>
              )}
              <button
                type="button"
                aria-label="Invert price"
                className="rounded-control p-1 hover:bg-[var(--seer-surface-raised)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--seer-brand-purple)]"
                onClick={() => toggleInvertedPrice((state) => !state)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="size-5"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
                  />
                </svg>
              </button>
            </p>
          </div>
          <div className="flex items-center justify-between gap-2">
            <p className="text-[var(--seer-muted)]">{isExactInput ? "Minimum received" : "Maximum sent"}</p>
            <p className="text-right tabular-nums">
              {isExactInput ? minimumReceive : maximumSent} {isExactInput ? outputToken : inputToken}
            </p>
          </div>
          <div className="flex items-center justify-between gap-2">
            <p className="text-[var(--seer-muted)]">Max slippage</p>
            <p className="tabular-nums">{maximumSlippage}%</p>
          </div>
        </div>
      </div>
      <SlippageNotice maximumSlippage={maximumSlippage}>
        You could {isExactInput ? "receive" : "spend"} as {isExactInput ? "little" : "much"} as{" "}
        <span className="font-bold">
          {isExactInput ? minimumReceive : maximumSent} {isExactInput ? outputToken : inputToken}
        </span>
        .
      </SlippageNotice>
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
  confirmText = "Confirm",
  payoutLine,
}: SwapTokensConfirmationProps) {
  if (!trade) {
    return (
      <div className="flex flex-col justify-center items-center">
        <div className="w-full sm:w-[400px] h-[150px] flex items-center justify-center">
          <Spinner />
        </div>

        <div className="flex w-full justify-center mt-6">
          <Button type="button" variant="secondary" text="Back" onClick={closeModal} />
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
          payoutLine={payoutLine}
        />
      )}

      <div className="grid w-full grid-cols-2 gap-3 mt-6">
        <Button type="button" variant="secondary" text="Back" onClick={closeModal} className="w-full" />
        <Button
          variant="primary"
          type="submit"
          isLoading={isLoading}
          text={confirmText}
          onClick={() => onSubmit(trade)}
          className="w-full"
        />
      </div>
    </div>
  );
}
