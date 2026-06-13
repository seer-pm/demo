import { formatFillToEstimateLegPreview } from "@/lib/fill-to-estimate-display";
import { CheckCircleIcon, CloseCircleOutlineIcon, ExclamationCircleIcon, LoadingIcon } from "@/lib/icons";
import { displayNumber } from "@/lib/utils";
import {
  FILL_TO_ESTIMATE_EPSILON,
  type FillToEstimateLegExecutionStatus,
  type FillToEstimatePlan,
  getMarketUnit,
} from "@seer-pm/sdk";
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
  legExecutionStatuses?: FillToEstimateLegExecutionStatus[] | null;
  onSubmit: () => Promise<void>;
}

function formatEstimate(value: number, market: Market): string {
  const unit = getMarketUnit(market);
  const formatted = Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 });
  return unit ? `${formatted} ${unit}` : formatted;
}

function LegExecutionStatusIcon({ status }: { status: FillToEstimateLegExecutionStatus }) {
  switch (status) {
    case "complete":
      return (
        <div className="text-success-primary">
          <CheckCircleIcon width={20} height={20} />
        </div>
      );
    case "awaiting_wallet":
      return (
        <div className="text-warning-primary">
          <ExclamationCircleIcon width={20} height={20} />
        </div>
      );
    case "confirming":
      return (
        <div className="text-purple-primary">
          <LoadingIcon />
        </div>
      );
    case "failed":
      return (
        <div className="text-error-primary">
          <CloseCircleOutlineIcon width={20} height={20} />
        </div>
      );
    default:
      return <div className="w-5 h-5 rounded-full border-2 border-base-300" />;
  }
}

function getLegStatusLabel(status: FillToEstimateLegExecutionStatus): string | undefined {
  switch (status) {
    case "awaiting_wallet":
      return "Approve in your wallet";
    case "confirming":
      return "Confirming on chain...";
    case "failed":
      return "Failed";
    default:
      return undefined;
  }
}

export function FillToEstimateConfirmation({
  closeModal,
  market,
  plan,
  collateral,
  isLoading,
  legExecutionStatuses,
  onSubmit,
}: FillToEstimateConfirmationProps) {
  const estimatedNetSpend = formatUnits(plan.estimatedNetSpend, collateral.decimals);
  const maxCollateralToUse = formatUnits(plan.userMaxCollateralToUse, collateral.decimals);
  const isExecuting = legExecutionStatuses !== null && legExecutionStatuses !== undefined;

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
          {isExecuting && (
            <p className="text-[13px] text-black-secondary">
              Each step runs one at a time. Wait for confirmation before approving the next transaction in your wallet.
            </p>
          )}
          {plan.legEstimates.map((legEstimate, index) => {
            const status = legExecutionStatuses?.[index];
            const statusLabel = status ? getLegStatusLabel(status) : undefined;

            if (isExecuting && status) {
              return (
                <div
                  key={`${legEstimate.leg.kind}-${legEstimate.leg.outcomeIndex}-${index}`}
                  className="flex items-start gap-3 p-2 rounded bg-gray-50"
                >
                  <div className="flex-shrink-0 mt-0.5">
                    <LegExecutionStatusIcon status={status} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">
                      {formatFillToEstimateLegPreview(legEstimate, index, market, collateral)}
                    </p>
                    {statusLabel && <p className="text-[12px] text-black-secondary mt-0.5">{statusLabel}</p>}
                  </div>
                </div>
              );
            }

            return (
              <div
                key={`${legEstimate.leg.kind}-${legEstimate.leg.outcomeIndex}-${index}`}
                className="flex items-start justify-between gap-2"
              >
                <span>{formatFillToEstimateLegPreview(legEstimate, index, market, collateral)}</span>
              </div>
            );
          })}
        </div>
      )}

      {Math.abs(plan.achievableEstimate - plan.targetEstimate) > FILL_TO_ESTIMATE_EPSILON &&
        plan.isBudgetConstrained && (
          <Alert type="info">
            The market estimate may not reach the exact target after execution due to pool curvature and slippage.
          </Alert>
        )}

      {!isExecuting && (
        <div className="flex gap-3 justify-end">
          <Button type="button" variant="secondary" text="Cancel" onClick={closeModal} disabled={isLoading} />
          <Button
            type="button"
            text={isLoading ? "Confirming..." : "Confirm"}
            disabled={isLoading || plan.legs.length === 0}
            isLoading={isLoading}
            onClick={() => onSubmit()}
          />
        </div>
      )}
    </div>
  );
}
