import { formatFillToEstimateLegPreview } from "@/lib/fill-to-estimate-display";
import { displayNumber } from "@/lib/utils";
import { FILL_TO_ESTIMATE_EPSILON, type FillToEstimatePlan, getMarketUnit } from "@seer-pm/sdk";
import type { Market, Token } from "@seer-pm/sdk";
import { formatUnits } from "viem";
import { Alert } from "../../Alert";
import Button from "../../Form/Button";

interface FillToEstimateConfirmationProps {
  closeModal: () => void;
  market: Market;
  plan: FillToEstimatePlan;
  collateral: Token;
  isLoading: boolean;
  onSubmit: () => Promise<void>;
}

function formatEstimate(value: number, market: Market): string {
  const unit = getMarketUnit(market);
  const formatted = Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 });
  return unit ? `${formatted} ${unit}` : formatted;
}

export function FillToEstimateConfirmation({
  closeModal,
  market,
  plan,
  collateral,
  isLoading,
  onSubmit,
}: FillToEstimateConfirmationProps) {
  const estimatedNetSpend = formatUnits(plan.estimatedNetSpend, collateral.decimals);
  const maxCollateralToUse = formatUnits(plan.userMaxCollateralToUse, collateral.decimals);

  return (
    <div className="space-y-5 min-w-[400px]">
      <div className="space-y-2">
        <h3 className="text-2xl font-semibold">Fill-to-estimate</h3>
        <div className="flex items-center justify-between gap-2 text-[14px]">
          <span>Current estimate</span>
          <span>{formatEstimate(plan.currentEstimate, market)}</span>
        </div>
        <div className="flex items-center justify-between gap-2 text-[14px]">
          <span>Target estimate</span>
          <span>{formatEstimate(plan.targetEstimate, market)}</span>
        </div>
        <div className="flex items-center justify-between gap-2 text-[14px] font-semibold">
          <span>Achievable estimate</span>
          <span>{formatEstimate(plan.achievableEstimate, market)}</span>
        </div>
        <div className="flex items-center justify-between gap-2 text-[14px] font-semibold">
          <span>Estimated net spend</span>
          <span>
            {displayNumber(Number(estimatedNetSpend), 2)} {collateral.symbol}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 text-[14px] text-black-secondary">
          <span>Max collateral to use</span>
          <span>
            {displayNumber(Number(maxCollateralToUse), 2)} {collateral.symbol}
          </span>
        </div>
      </div>

      {plan.isBudgetConstrained && (
        <Alert type="warning">
          Plan scaled to fit your max collateral limit. Increase it to reach your target estimate exactly.
        </Alert>
      )}

      {plan.isTargetConstrained && !plan.isBudgetConstrained && (
        <Alert type="info">
          Your max collateral limit is sufficient, but this plan may not reach the exact target estimate due to pool
          liquidity and price impact.
        </Alert>
      )}

      {plan.legEstimates.length > 0 && (
        <div className="space-y-2 text-[14px]">
          {plan.legEstimates.map((legEstimate, index) => (
            <div
              key={`${legEstimate.leg.kind}-${legEstimate.leg.outcomeIndex}-${index}`}
              className="flex items-start justify-between gap-2"
            >
              <span>{formatFillToEstimateLegPreview(legEstimate, index, market, collateral)}</span>
            </div>
          ))}
        </div>
      )}

      {Math.abs(plan.achievableEstimate - plan.targetEstimate) > FILL_TO_ESTIMATE_EPSILON &&
        plan.isBudgetConstrained && (
          <Alert type="info">
            The market estimate may not reach the exact target after execution due to pool curvature and slippage.
          </Alert>
        )}

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="secondary" text="Cancel" onClick={closeModal} />
        <Button
          type="button"
          text={isLoading ? "Confirming..." : "Confirm"}
          disabled={isLoading || plan.legs.length === 0}
          isLoading={isLoading}
          onClick={() => onSubmit()}
        />
      </div>
    </div>
  );
}
