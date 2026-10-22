import { Alert } from "@/components/Alert";

/**
 * Turns a failed quote into something the trader can act on. The raw reason (router reverts,
 * RPC errors) is useful for support but not as the headline, so it sits behind "Details".
 */
function describeQuoteError(error: Error, swapType: "buy" | "sell", outcomeText: string): string {
  if (error.message === "No route found") {
    return swapType === "sell"
      ? `Not enough liquidity to sell ${outcomeText} right now.`
      : "Not enough liquidity for this amount. Try a smaller one.";
  }
  if (error.name === "InsufficientLiquidityError") {
    return "The pool is too thin for this amount. Try a smaller one.";
  }
  if (error.name === "SwapRevertsError" || /revert/i.test(error.message)) {
    return "This trade would fail at the current price. Try a smaller amount or a higher max slippage.";
  }
  return "We couldn't price this trade. Try again in a moment.";
}

export function QuoteErrorAlert({
  error,
  swapType,
  outcomeText,
}: {
  error: Error;
  swapType: "buy" | "sell";
  outcomeText: string;
}) {
  const message = describeQuoteError(error, swapType, outcomeText);
  const showDetails = Boolean(error.message) && error.message !== "No route found";

  return (
    <Alert type="error">
      <p>{message}</p>
      {showDetails && (
        <details className="mt-1 text-[12px]">
          <summary className="cursor-pointer underline underline-offset-2">Details</summary>
          <p className="mt-1 break-words opacity-80">{error.message}</p>
        </details>
      )}
    </Alert>
  );
}
