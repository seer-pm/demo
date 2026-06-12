import { FillToEstimateConfirmation } from "@/components/Market/SwapTokens/FillToEstimateConfirmation";
import {
  getOutcomeTokenForIndex,
  useFillToEstimateCollateralToken,
  useFillToEstimatePlan,
} from "@/hooks/fill-to-estimate/useFillToEstimatePlan";
import { useFillToEstimateTrade } from "@/hooks/fill-to-estimate/useFillToEstimateTrade";
import { useGlobalState } from "@/hooks/useGlobalState";
import { useModal } from "@/hooks/useModal";
import { formatCurrentEstimate, formatFillToEstimateLegPreview } from "@/lib/fill-to-estimate-display";
import { Parameter, QuestionIcon } from "@/lib/icons";
import { displayBalance, displayNumber } from "@/lib/utils";
import { useMarketOdds, useTokenBalance } from "@seer-pm/react";
import {
  type FillToEstimateLegTrade,
  Market,
  fetchAmmQuote,
  fetchPsm3UniswapQuote,
  getMarketEstimate,
  getMarketUnit,
  isFillToEstimateEnabled,
  isPsm3SwapToken,
  isSeerCredits,
} from "@seer-pm/sdk";
import type { Token } from "@seer-pm/sdk";
import { SwaprV3Trade, TradeType, UniswapTrade } from "@seer-pm/sdk";
import { getPublicClient } from "@wagmi/core";
import clsx from "clsx";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { formatUnits, parseUnits } from "viem";
import { useAccount, useConfig } from "wagmi";
import { Alert } from "../../Alert";
import Button from "../../Form/Button";
import Input from "../../Form/Input";

interface SwapFormValues {
  targetEstimate: string;
  maxCollateralToUse: string;
}

interface SwapTokensFillToEstimateProps {
  market: Market;
  fixedCollateral: Token | undefined;
  setShowMaxSlippage: (isShow: boolean) => void;
}

export function SwapTokensFillToEstimate({
  market,
  fixedCollateral,
  setShowMaxSlippage,
}: SwapTokensFillToEstimateProps) {
  const { address: account } = useAccount();
  const wagmiConfig = useConfig();
  const maxSlippage = useGlobalState((state) => state.maxSlippage);
  const selectedCollateral = useFillToEstimateCollateralToken(market, fixedCollateral);
  const { data: odds = [] } = useMarketOdds(market, isFillToEstimateEnabled(market));
  const { data: collateralBalance = 0n, isFetching: isFetchingBalance } = useTokenBalance(
    account,
    selectedCollateral.address,
    market.chainId,
  );

  const {
    register,
    watch,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<SwapFormValues>({
    mode: "all",
    defaultValues: {
      targetEstimate: "",
      maxCollateralToUse: "",
    },
  });

  const [targetEstimateInput, maxCollateralInput] = watch(["targetEstimate", "maxCollateralToUse"]);
  const parsedTargetEstimate = targetEstimateInput ? Number(targetEstimateInput.replace(/,/g, "")) : undefined;
  const parsedMaxCollateralToUse = maxCollateralInput
    ? parseUnits(maxCollateralInput, selectedCollateral.decimals)
    : undefined;

  const plan = useFillToEstimatePlan({
    market,
    targetEstimate: parsedTargetEstimate,
    maxCollateralToUse: parsedMaxCollateralToUse,
    collateralToken: selectedCollateral,
    enabled: isFillToEstimateEnabled(market),
  });

  const necessaryMaxCollateral = useMemo(() => {
    if (!plan || plan.error || plan.legs.length === 0) {
      return undefined;
    }
    if (plan.missingCollateralForInventory !== undefined && plan.missingCollateralForInventory > 0n) {
      return plan.userMaxCollateralToUse + plan.missingCollateralForInventory;
    }
    return plan.idealPeakCollateralUse > 0n ? plan.idealPeakCollateralUse : undefined;
  }, [plan]);

  const collateralToReachTarget = useMemo(() => {
    if (
      necessaryMaxCollateral === undefined ||
      parsedMaxCollateralToUse === undefined ||
      parsedMaxCollateralToUse >= necessaryMaxCollateral
    ) {
      return undefined;
    }
    return necessaryMaxCollateral;
  }, [necessaryMaxCollateral, parsedMaxCollateralToUse]);

  const prevTargetEstimateRef = useRef<number | undefined>(undefined);
  const autoAdjustMaxCollateralForTargetRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (parsedTargetEstimate === undefined) {
      prevTargetEstimateRef.current = undefined;
      autoAdjustMaxCollateralForTargetRef.current = undefined;
      return;
    }

    if (prevTargetEstimateRef.current !== undefined && prevTargetEstimateRef.current !== parsedTargetEstimate) {
      autoAdjustMaxCollateralForTargetRef.current = parsedTargetEstimate;
    }
    prevTargetEstimateRef.current = parsedTargetEstimate;

    if (autoAdjustMaxCollateralForTargetRef.current !== parsedTargetEstimate) {
      return;
    }
    if (necessaryMaxCollateral === undefined || parsedMaxCollateralToUse === undefined) {
      return;
    }

    if (parsedMaxCollateralToUse > necessaryMaxCollateral) {
      setValue("maxCollateralToUse", formatUnits(necessaryMaxCollateral, selectedCollateral.decimals), {
        shouldValidate: true,
      });
    }
    autoAdjustMaxCollateralForTargetRef.current = undefined;
  }, [parsedTargetEstimate, necessaryMaxCollateral, parsedMaxCollateralToUse, selectedCollateral.decimals, setValue]);

  const currentEstimateLabel = useMemo(() => formatCurrentEstimate(odds, market), [odds, market]);
  const marketUnit = getMarketUnit(market);

  const {
    Modal: ConfirmModal,
    openModal: openConfirmModal,
    closeModal: closeConfirmModal,
  } = useModal("fill-to-estimate-confirm");

  const [isQuoting, setIsQuoting] = useState(false);

  const fillToEstimateTrade = useFillToEstimateTrade(() => {
    closeConfirmModal();
    reset();
  });

  const isSeerCreditsCollateral = isSeerCredits(market.chainId, selectedCollateral.address);
  const isPsm3Collateral = isPsm3SwapToken(market.chainId, selectedCollateral.address);

  const quoteLegTrades = async (): Promise<FillToEstimateLegTrade[]> => {
    if (!plan || !account) {
      return [];
    }

    const legTrades: FillToEstimateLegTrade[] = [];
    const publicClient = isPsm3Collateral ? getPublicClient(wagmiConfig, { chainId: market.chainId }) : undefined;

    for (const leg of plan.legs) {
      if (leg.kind === "split") {
        continue;
      }

      const outcomeToken = getOutcomeTokenForIndex(market, leg.outcomeIndex);
      const amount = formatUnits(leg.amount, 18);
      const tradeType = leg.kind === "buy" ? TradeType.EXACT_OUTPUT : TradeType.EXACT_INPUT;

      const quote = isPsm3Collateral
        ? await fetchPsm3UniswapQuote(
            publicClient!,
            tradeType,
            market.chainId,
            account,
            amount,
            outcomeToken,
            selectedCollateral,
            leg.kind,
            maxSlippage,
          )
        : await fetchAmmQuote(
            tradeType,
            market.chainId,
            account,
            amount,
            outcomeToken,
            selectedCollateral,
            leg.kind,
            maxSlippage,
          );

      if (!quote?.trade || !(quote.trade instanceof SwaprV3Trade || quote.trade instanceof UniswapTrade)) {
        throw new Error(`Unable to quote ${leg.kind} leg for ${market.outcomes[leg.outcomeIndex]}`);
      }

      legTrades.push({
        kind: leg.kind,
        outcomeIndex: leg.outcomeIndex,
        trade: quote.trade,
      });
    }

    return legTrades;
  };

  const onConfirm = async () => {
    if (!plan || !account || plan.error) {
      return;
    }

    setIsQuoting(true);
    try {
      const legTrades = await quoteLegTrades();
      await fillToEstimateTrade.mutateAsync({
        plan,
        market,
        account,
        collateralToken: selectedCollateral,
        legTrades,
        isBuyExactOutputNative: false,
        isSellToNative: false,
        isSeerCredits: isSeerCreditsCollateral,
      });
    } finally {
      setIsQuoting(false);
    }
  };

  const handleOpenConfirm = handleSubmit(() => {
    if (!plan || plan.error || plan.legs.length === 0) {
      return;
    }
    openConfirmModal();
  });

  if (!isFillToEstimateEnabled(market)) {
    return <Alert type="info">Fill-to-estimate is available only for Generic scalar markets.</Alert>;
  }

  if (isSeerCreditsCollateral) {
    return <Alert type="info">Fill-to-estimate is not supported with Seer Credits collateral.</Alert>;
  }

  return (
    <div className="space-y-5">
      <div className="text-[14px] text-black-secondary">
        Current market estimate: <span className="font-semibold text-base-content">{currentEstimateLabel}</span>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-2">
          <label htmlFor="targetEstimate" className="text-[14px]">
            Target estimate{marketUnit ? ` (${marketUnit})` : ""}
          </label>
          <div className="tooltip">
            <QuestionIcon fill="#9747FF" />
            <p className="tooltiptext">Same unit as the market estimate shown in the header.</p>
          </div>
        </div>
        <Input
          id="targetEstimate"
          placeholder={currentEstimateLabel.replace(/[^\d.,-]/g, "").trim() || "0"}
          {...register("targetEstimate", {
            required: "Target estimate is required",
            validate: (value) => {
              const parsed = Number(value.replace(/,/g, ""));
              if (Number.isNaN(parsed)) {
                return "Enter a valid number";
              }
              const estimate = getMarketEstimate(odds, market);
              if (typeof estimate === "number" && Math.abs(parsed - estimate) < 0.01) {
                return "Target must differ from current estimate";
              }
              return true;
            },
          })}
        />
        {errors.targetEstimate && <p className="text-error text-[12px] mt-1">{errors.targetEstimate.message}</p>}
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <label htmlFor="maxCollateralToUse" className="text-[14px]">
              Max collateral to use
            </label>
            <div className="tooltip">
              <QuestionIcon fill="#9747FF" />
              <p className="tooltiptext">
                Maximum {selectedCollateral.symbol} from your wallet for this plan (e.g. split lock). Estimated net
                spend below may be lower after sell proceeds.
              </p>
            </div>
          </div>
          <span className="text-[13px] text-black-secondary">{selectedCollateral.symbol}</span>
        </div>
        <Input
          id="maxCollateralToUse"
          placeholder="0"
          {...register("maxCollateralToUse", {
            required: "Amount is required",
            validate: (value) => {
              try {
                const parsed = parseUnits(value || "0", selectedCollateral.decimals);
                if (parsed <= 0n) {
                  return "Amount must be greater than zero";
                }
                if (parsed > collateralBalance) {
                  return "Not enough balance.";
                }
              } catch {
                return "Enter a valid amount";
              }
              return true;
            },
          })}
        />
        <div className="flex items-center justify-between text-[12px] mt-1 text-black-secondary">
          <span>
            Balance: {isFetchingBalance ? "..." : displayBalance(collateralBalance, selectedCollateral.decimals)}{" "}
            {selectedCollateral.symbol}
          </span>
          <button
            type="button"
            className="text-purple-primary"
            onClick={() => {
              const current = watch("maxCollateralToUse");
              if (!current && collateralBalance > 0n) {
                reset({
                  targetEstimate: targetEstimateInput,
                  maxCollateralToUse: formatUnits(collateralBalance, selectedCollateral.decimals),
                });
              }
            }}
          >
            Max
          </button>
        </div>
        {errors.maxCollateralToUse && (
          <p className="text-error text-[12px] mt-1">{errors.maxCollateralToUse.message}</p>
        )}
        {collateralToReachTarget !== undefined && (
          <button
            type="button"
            className="text-[12px] text-purple-primary text-left mt-1"
            onClick={() => {
              const value = collateralToReachTarget > collateralBalance ? collateralBalance : collateralToReachTarget;
              setValue("maxCollateralToUse", formatUnits(value, selectedCollateral.decimals), {
                shouldValidate: true,
              });
            }}
          >
            Set collateral to{" "}
            {displayNumber(Number(formatUnits(collateralToReachTarget, selectedCollateral.decimals)), 2)}{" "}
            {selectedCollateral.symbol} to reach your target estimate
          </button>
        )}
      </div>

      {plan?.error && <Alert type="warning">{plan.error}</Alert>}

      {plan && !plan.error && parsedTargetEstimate !== undefined && (
        <div className="rounded-md border border-base-300 p-4 space-y-2 text-[14px]">
          <div className="flex items-center justify-between">
            <span>Target estimate</span>
            <span>
              {displayNumber(plan.targetEstimate, 2)}
              {marketUnit ? ` ${marketUnit}` : ""}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Achievable estimate</span>
            <span className="font-semibold">
              {displayNumber(plan.achievableEstimate, 2)}
              {marketUnit ? ` ${marketUnit}` : ""}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Estimated net spend</span>
            <span className="font-semibold">
              {displayNumber(Number(formatUnits(plan.estimatedNetSpend, selectedCollateral.decimals)), 2)}{" "}
              {selectedCollateral.symbol}
            </span>
          </div>

          {plan.isBudgetConstrained && (
            <p className="text-[13px] text-black-secondary">
              Plan scaled to fit your max collateral limit. Increase it to reach your target estimate exactly.
            </p>
          )}
          {plan.isTargetConstrained && !plan.isBudgetConstrained && (
            <p className="text-[13px] text-black-secondary">
              This plan may not reach the exact target estimate due to pool liquidity and price impact.
            </p>
          )}
          {plan.legs.length > 0 && (
            <div className="pt-2 space-y-1">
              <p className="font-semibold">Plan preview</p>
              {plan.legEstimates.map((legEstimate, index) => (
                <p key={`${legEstimate.leg.kind}-${legEstimate.leg.outcomeIndex}-${index}`} className="text-[13px]">
                  {formatFillToEstimateLegPreview(legEstimate, index, market, selectedCollateral)}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between">
        <button
          type="button"
          className="flex items-center gap-2 text-[14px] text-purple-primary"
          onClick={() => setShowMaxSlippage(true)}
        >
          <Parameter width="16px" height="16px" />
          Max slippage: {maxSlippage}%
        </button>
      </div>

      <Button
        type="button"
        className={clsx("w-full")}
        text={plan?.isPartial ? "Partial Fill-to-estimate" : "Fill-to-estimate"}
        disabled={!plan || !!plan.error || plan.legs.length === 0 || fillToEstimateTrade.isPending || isQuoting}
        isLoading={fillToEstimateTrade.isPending || isQuoting}
        onClick={handleOpenConfirm}
      />

      <ConfirmModal
        title="Confirm Fill-to-estimate"
        content={
          plan ? (
            <FillToEstimateConfirmation
              closeModal={closeConfirmModal}
              market={market}
              plan={plan}
              collateral={selectedCollateral}
              isLoading={fillToEstimateTrade.isPending || isQuoting}
              onSubmit={onConfirm}
            />
          ) : null
        }
      />
    </div>
  );
}
