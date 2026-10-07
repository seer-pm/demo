import { Alert } from "@/components/Alert";
import { getSplitStepMarketLabel } from "@/lib/split-steps";
import { displayBalance } from "@/lib/utils";
import type { MintToCoverStatus, Token } from "@seer-pm/sdk";
import { getSplitSteps } from "@seer-pm/sdk";
import { LeftoverTokens } from "./LeftoverTokens";

/**
 * Discloses what a mint-to-cover sell actually does. The "You pay / You will get" panels only
 * describe the swap leg, so without this the split and the tokens it leaves behind are invisible.
 */
export function MintToCoverNotice({
  status,
  collateral,
  outcomeText,
}: {
  status: MintToCoverStatus;
  collateral: Token;
  outcomeText: string;
}) {
  if (status.kind === "insufficientCollateral") {
    const missing = status.splitAmount - status.collateralBalance;
    return (
      <Alert type="info">
        You don't hold enough {outcomeText} to sell that much. Add{" "}
        <span className="font-bold">
          {displayBalance(missing, collateral.decimals, false)} {collateral.symbol}
        </span>{" "}
        and we can mint the difference for you.
      </Alert>
    );
  }

  if (status.kind === "splitTooLarge") {
    return (
      <Alert type="info">
        You don't hold enough {outcomeText} to sell that much, and {status.isParent ? "a parent market" : "this market"}{" "}
        has {status.outcomeCount} outcomes, more than the {status.maxOutcomeCount} a single transaction can mint, so the
        difference cannot be minted for you. Sell what you hold, or buy {outcomeText} first.
      </Alert>
    );
  }

  if (status.kind !== "ready") {
    return null;
  }

  const leg = status.quote.completeSetLeg;
  if (leg?.route !== "mintToCover" || !leg.splitAmount || !leg.swapInputAmount) {
    return null;
  }

  const held = leg.existingBalance ?? 0n;
  const minted = displayBalance(leg.splitAmount, collateral.decimals, false);
  const leftovers = leg.leftoverTokens ?? [];
  // Past one step the ancestors are split first, root first, and the outcome each next market
  // hangs off is split again.
  const steps = getSplitSteps(leg);
  const parentSteps = steps.slice(1);

  return (
    <Alert type="info" title="You don't hold enough — we'll mint the rest">
      <div className="space-y-1">
        <p>
          {held > 0n ? (
            <>
              You hold{" "}
              <span className="font-bold">
                {displayBalance(held, leg.targetOutcomeToken.decimals, false)} {outcomeText}
              </span>
              .{" "}
            </>
          ) : null}
          <span className="font-bold">
            {minted} {collateral.symbol}
          </span>{" "}
          {parentSteps.length > 0 ? (
            <>
              will be minted into a full set of the {getSplitStepMarketLabel(steps, 0)}
              {parentSteps.map((step, index) => (
                <span key={step.market.id}>
                  {index === parentSteps.length - 1 ? ", and its " : ", its "}
                  <span className="font-bold">{step.spendOutcome?.symbol ?? "outcome"}</span> into a full set of the{" "}
                  {getSplitStepMarketLabel(steps, index + 1)}
                </span>
              ))}
              , so you can sell{" "}
            </>
          ) : (
            <>will be minted into a full set so you can sell </>
          )}
          <span className="font-bold">
            {displayBalance(leg.swapInputAmount, leg.targetOutcomeToken.decimals, false)} {outcomeText}
          </span>
          .
        </p>
        {leftovers.length > 0 && (
          <div>
            You'll also keep{" "}
            <LeftoverTokens leftovers={leftovers} marketId={leg.market.id} className="inline-block align-top" />
          </div>
        )}
      </div>
    </Alert>
  );
}
