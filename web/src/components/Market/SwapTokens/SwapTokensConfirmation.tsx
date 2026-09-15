import { useGetTradeInfo } from "@/hooks/trade/useGetTradeInfo";
import { useCheck7702Support } from "@/hooks/useCheck7702Support";
import { filterChain } from "@/lib/chains";
import { RightArrow } from "@/lib/icons";
import { summarizeLeftovers } from "@/lib/leftovers";
import { displayBalance, displayNumber, isTwoStringsEqual } from "@/lib/utils";
import type { CompleteSetLeg, CompleteSetQuoteResult, CompleteSetSwapLeg, Token } from "@seer-pm/sdk";
import { countCompleteSetBatches, getActiveCollateralProfile, getActiveCreditsSymbol } from "@seer-pm/sdk";
import { type AmmTrade } from "@seer-pm/sdk";
import { useEffect, useState } from "react";
import { formatUnits } from "viem";
import { useAccount } from "wagmi";
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
 * The AMM legs of a mint+sell / buy+merge leg. Quotes built before `swapLegs` existed carry one
 * leg in the opposite-outcome fields; both shapes render the same way.
 */
function getSwapLegs(leg: CompleteSetLeg, amount: bigint): CompleteSetSwapLeg[] {
  if (leg.swapLegs && leg.swapLegs.length > 0) {
    return leg.swapLegs;
  }
  if (leg.oppositeOutcomeToken && leg.oppositeOutcomeIndex !== undefined) {
    return [
      {
        outcomeIndex: leg.oppositeOutcomeIndex,
        outcomeToken: leg.oppositeOutcomeToken,
        trade: leg.secondaryTrade,
        amount,
      },
    ];
  }
  return [];
}

/** Tokens a buy+merge takes from the wallet besides the target: Invalid on a regular target, or what was already held. */
function getHeldOutcomeTokens(leg: CompleteSetLeg): { token: Token; amount: bigint }[] {
  if (leg.heldOutcomeTokens) {
    return leg.heldOutcomeTokens;
  }
  return leg.invalidOutcomeToken && leg.mergeAmount
    ? [{ token: leg.invalidOutcomeToken, amount: leg.mergeAmount }]
    : [];
}

/** "0.5 NO" for one leg, "0.5 of each of the 3 other outcomes" for many; every leg sells the same amount on mint+sell. */
function summarizeSwapLegs(legs: CompleteSetSwapLeg[]): string {
  const [first] = legs;
  if (!first) {
    return "";
  }
  const amount = formatCompositeAmount(formatUnits(first.amount, first.outcomeToken.decimals));
  if (legs.length === 1) {
    return `${amount} ${first.outcomeToken.symbol}`;
  }
  return `${amount} of each of the ${legs.length} other outcomes`;
}

/** One line per leg with the collateral it moves; folded when there are many. */
function SwapLegList({
  legs,
  collateral,
  amountField,
  className,
}: {
  legs: CompleteSetSwapLeg[];
  collateral: Token;
  /** Collateral out of a sell, or into a buy. */
  amountField: "amountOut" | "amountIn";
  className?: string;
}) {
  const lines = legs.map((leg) => (
    <span key={leg.outcomeToken.address} className="block">
      {formatCompositeAmount(formatUnits(leg.amount, leg.outcomeToken.decimals))} {leg.outcomeToken.symbol} (
      {formatCompositeAmount(formatUnits(leg.trade[amountField], collateral.decimals))} {collateral.symbol})
    </span>
  ));

  if (legs.length <= 2) {
    return <span className={className}>{lines}</span>;
  }

  const total = legs.reduce((sum, leg) => sum + leg.trade[amountField], 0n);
  return (
    <details className={className}>
      <summary className="cursor-pointer">
        {legs.length} swaps, {formatCompositeAmount(formatUnits(total, collateral.decimals))} {collateral.symbol}
      </summary>
      <div className="mt-1">{lines}</div>
    </details>
  );
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
    const legs = getSwapLegs(leg, leg.splitAmount);
    const splitAmount = formatCompositeAmount(formatUnits(leg.splitAmount, collateral.decimals));
    const proceeds = legs.reduce((sum, swapLeg) => sum + swapLeg.trade.amountOut, 0n);
    const netCost = formatCompositeAmount(quoteData.sellAmount);
    const invalidKept = leg.invalidOutcomeToken;

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
            {splitAmount} {leg.targetOutcomeToken.symbol} + {summarizeSwapLegs(legs)}
          </span>
        </div>
        <div className="flex items-start justify-between gap-2">
          <span>3. Sell {legs.length === 1 ? legs[0].outcomeToken.symbol : `${legs.length} outcomes`}</span>
          <SwapLegList legs={legs} collateral={collateral} amountField="amountOut" className="text-right" />
        </div>
        {invalidKept && (
          <div className="flex items-center justify-between gap-2">
            <span>You keep</span>
            <span className="text-right">
              {splitAmount} {invalidKept.symbol}
            </span>
          </div>
        )}
        <div className="flex items-center justify-between gap-2 font-semibold">
          <span>Net cost</span>
          <span className="text-right">
            {netCost} {collateral.symbol}
          </span>
        </div>
        <p className="text-[13px] text-black-secondary">
          The whole {splitAmount} {collateral.symbol} leaves your wallet for the split;{" "}
          {formatCompositeAmount(formatUnits(proceeds, collateral.decimals))} {collateral.symbol} comes back from the
          sells in the same trade.
        </p>
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

  if (leg.route === "buyMerge" && leg.mergeAmount) {
    const legs = getSwapLegs(leg, leg.mergeAmount);
    const mergeAmount = formatCompositeAmount(formatUnits(leg.mergeAmount, leg.targetOutcomeToken.decimals));
    const buyCost = formatCompositeAmount(formatUnits(quoteData.netCollateral, collateral.decimals));
    const held = getHeldOutcomeTokens(leg);
    let step = 1;

    return (
      <div className="space-y-2 text-[14px] pb-4">
        <p className="text-2xl break-words font-semibold text-purple-primary">{getRouteLabel(quoteData.route)}</p>
        {savingsMessage && <p className="text-[13px] text-black-secondary">{savingsMessage}</p>}
        <div className="flex items-center justify-between gap-2">
          <span>
            {step++}. Use {leg.targetOutcomeToken.symbol}
          </span>
          <span className="text-right">
            {mergeAmount} {leg.targetOutcomeToken.symbol}
          </span>
        </div>
        <div className="flex items-start justify-between gap-2">
          <span>
            {step++}. Buy {legs.length === 1 ? legs[0].outcomeToken.symbol : `${legs.length} outcomes`} ({buyCost}{" "}
            {collateral.symbol})
          </span>
          <SwapLegList legs={legs} collateral={collateral} amountField="amountIn" className="text-right" />
        </div>
        {held.length > 0 && (
          <div className="flex items-start justify-between gap-2">
            <span>{step++}. Use held tokens</span>
            <span className="text-right">
              {held.map((entry) => (
                <span key={entry.token.address} className="block">
                  {formatCompositeAmount(formatUnits(entry.amount, entry.token.decimals))} {entry.token.symbol}
                </span>
              ))}
            </span>
          </div>
        )}
        <div className="flex items-center justify-between gap-2">
          <span>{step++}. Merge sets</span>
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
  const { address: account } = useAccount();
  const leg = quoteData.completeSetLeg;
  const isSplitFirst = quoteData.route === "mintSell" || quoteData.route === "mintToCover";

  // With several legs the limits add up across all of them; one leg is the plain trade info.
  const legs = leg ? getSwapLegs(leg, (isSplitFirst ? leg.splitAmount : leg.mergeAmount) ?? 0n) : [];
  const limitAcrossLegs =
    legs.length > 1
      ? formatCompositeAmount(
          formatUnits(
            legs.reduce(
              (sum, swapLeg) =>
                sum + (isSplitFirst ? swapLeg.trade.minimumAmountOut() : swapLeg.trade.maximumAmountIn()),
              0n,
            ),
            collateral.decimals,
          ),
        )
      : undefined;
  const stepLabel = legs.length > 1 ? "The sells together" : "The sell step";
  const buyLabel = legs.length > 1 ? "The buys together" : "The buy step";

  const slippageAlert = isSplitFirst ? (
    <Alert type="warning">
      Current slippage tolerance is {maximumSlippage}%. {stepLabel} will return at least{" "}
      <span className="font-bold">
        {limitAcrossLegs ?? minimumReceive} {collateral.symbol}
      </span>{" "}
      or the transaction will revert.
    </Alert>
  ) : (
    <Alert type="warning">
      Current slippage tolerance is {maximumSlippage}%. {buyLabel} will spend at most{" "}
      <span className="font-bold">
        {limitAcrossLegs ?? maximumSent} {collateral.symbol}
      </span>{" "}
      or the transaction will revert.
    </Alert>
  );

  // Legs are packed into transactions under a gas budget; a market with many outcomes needs more than one.
  let batchCount = 1;
  if (supports7702 && leg && account) {
    try {
      batchCount = countCompleteSetBatches({ trade, account, isTradingCredits: false, completeSetLeg: leg });
    } catch {
      batchCount = 1;
    }
  }
  const keptOnFailure = isSplitFirst
    ? `you keep the minted tokens — you can merge them back into ${collateral.symbol} from the Merge tab`
    : "you keep the outcome tokens already bought — you can merge them from the Merge tab once you hold the full set";

  return (
    <>
      <div className="min-w-[400px] min-h-[150px]">
        <CompleteSetBreakdown quoteData={quoteData} collateral={collateral} />
      </div>
      {!supports7702 && (
        <Alert type="warning" className="mt-2">
          This runs as separate transactions. If a later step fails {keptOnFailure}.
        </Alert>
      )}
      {supports7702 && batchCount > 1 && (
        <Alert type="warning" className="mt-2">
          This trade has too many swaps for one transaction, so it is sent as {batchCount} transactions, each confirmed
          in your wallet. If a later one fails {keptOnFailure}.
        </Alert>
      )}
      {slippageAlert}
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
      <div className="min-w-[400px] min-h-[150px]">
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
