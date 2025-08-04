import {
  SLIPPAGE_TOLERANCE,
  USE_FULL_PRECISION,
  buildPrice,
  useExecuteLiquidityMint,
  usePoolsData,
  usePrepareLiquidityMint,
} from "@/hooks/useSwaprProvideLiquidity";
import { COLLATERAL_TOKENS } from "@/lib/config";
import { MinusIcon, PlusIcon } from "@/lib/icons";
import {
  LiquidityFormData,
  OutcomeLiquidityConfigProps,
  PRESETS,
  PresetName,
  calculateRange,
  isValidLiquidityOutcome,
} from "@/lib/liquidity";
import { Market } from "@/lib/market";
import { isTwoStringsEqual } from "@/lib/utils";
import { displayBalance } from "@/lib/utils";
import {
  FeeAmount,
  MintCallParams,
  PoolDataResult,
  V3_CONTRACTS,
  calculateMintAmountsFromInput,
  getCurrentPriceAsNumber,
  getPoolFromPoolData,
} from "@algebra/sdk";
import ReactECharts from "echarts-for-react";
import { BaseSyntheticEvent } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { Address, parseUnits } from "viem";
import { useAccount } from "wagmi";
import { ApproveButton } from "../Form/ApproveButton";
import Button from "../Form/Button";
import { SwitchChainButtonWrapper } from "../Form/SwitchChainButtonWrapper";

const sDaiAddress = COLLATERAL_TOKENS[100]?.primary?.address;

// --- Liquidity Chart Component ---
interface LiquidityChartProps {
  minPrice: number;
  maxPrice: number;
  centerPrice: number;
}

const LiquidityChart = ({ minPrice, maxPrice, centerPrice }: LiquidityChartProps) => {
  const option = {
    grid: {
      left: 10,
      right: 10,
      top: 10,
      bottom: 20,
    },
    tooltip: {
      trigger: "axis",
      // biome-ignore lint/suspicious/noExplicitAny:
      formatter: (params: any) => {
        if (params.length > 0 && params[0].componentType === "markLine") {
          const data = params[0].data;
          let label = "";
          if (data.xAxis === minPrice) label = "Min Price";
          else if (data.xAxis === maxPrice) label = "Max Price";
          else if (data.xAxis === centerPrice) label = "Center Price";
          return `${label}: ${data.xAxis.toFixed(4)}`;
        }
        return "";
      },
      axisPointer: {
        type: "none",
      },
    },
    xAxis: {
      min: 0,
      max: 1,
      interval: 0.1,
      axisLabel: {
        formatter: (value: number) => value.toFixed(1),
      },
      splitLine: { show: false },
    },
    yAxis: {
      show: false,
      min: 0,
      max: 1,
    },
    series: [
      {
        type: "line",
        data: [],
        markLine: {
          animation: false,
          silent: false,
          symbol: ["none", "none"],
          label: {
            show: false,
          },
          data: [
            {
              xAxis: minPrice,
              lineStyle: {
                color: "#9ca3af",
                type: "solid",
                width: 2,
              },
            },
            {
              xAxis: maxPrice,
              lineStyle: {
                color: "#9ca3af",
                type: "solid",
                width: 2,
              },
            },
            {
              xAxis: centerPrice,
              lineStyle: {
                color: "#60a5fa",
                type: "dashed",
                width: 2,
              },
            },
          ],
        },
      },
    ],
  };
  return <ReactECharts option={option} style={{ height: "100px", width: "100%" }} notMerge={true} lazyUpdate={true} />;
};

const OutcomeLiquidityConfig = ({
  index,
  outcomeName,
  control,
  register,
  errors,
  watch,
  setValue,
  poolData,
}: OutcomeLiquidityConfigProps) => {
  const isEnabled = watch(`outcomes.${index}.enabled`);
  const centerPrice = watch(`outcomes.${index}.centerPrice`);
  const minPrice = watch(`outcomes.${index}.minPrice`);
  const maxPrice = watch(`outcomes.${index}.maxPrice`);

  const outcomeErrors = errors.outcomes?.[index];

  // Helper function for increment/decrement buttons
  const adjustPrice = (field: `outcomes.${number}.minPrice` | `outcomes.${number}.maxPrice`, delta: number) => {
    const currentMin = watch(`outcomes.${index}.minPrice`);
    const currentMax = watch(`outcomes.${index}.maxPrice`);
    const currentVal = field === `outcomes.${index}.minPrice` ? currentMin : currentMax;
    let newVal = Number.parseFloat((currentVal + delta).toFixed(4)); // Use 4 decimal places precision for adjustments

    // Clamp between 0 and 1
    newVal = Math.max(0, Math.min(1, newVal));

    // Ensure min < max
    if (field === `outcomes.${index}.minPrice`) {
      newVal = Math.min(newVal, currentMax - 0.0001);
    } else {
      newVal = Math.max(newVal, currentMin + 0.0001);
    }

    newVal = Math.max(0, Math.min(1, newVal));
    setValue(field, Number(newVal.toFixed(4)), { shouldValidate: true, shouldDirty: true });
  };

  function handleIndependentChange(
    outcomeIndex: number,
    inputAmountIsh: number,
    currentIndependentToken: "quote" | "base",
  ) {
    const isToken0sDAI = isTwoStringsEqual(poolData.token0.address, sDaiAddress);
    const inputToken = currentIndependentToken === "quote" && isToken0sDAI ? poolData.token0 : poolData.token1;
    const inputAmount = parseUnits(String(inputAmountIsh), inputToken.decimals).toString();

    const { amount0Min, amount1Min } = calculateMintAmountsFromInput(
      getPoolFromPoolData(poolData, FeeAmount.LOW, buildPrice(poolData.token0, poolData.token1, centerPrice)),
      buildPrice(poolData.token0, poolData.token1, minPrice),
      buildPrice(poolData.token0, poolData.token1, maxPrice),
      inputToken,
      inputAmount,
      USE_FULL_PRECISION,
      SLIPPAGE_TOLERANCE,
    );

    setValue(`outcomes.${outcomeIndex}.independentToken`, currentIndependentToken, {
      shouldValidate: false,
      shouldDirty: true,
    });

    // Only update the dependent field, keep the independent field unchanged
    if (currentIndependentToken === "quote") {
      // User entered sDAI amount, update outcome amount
      const outcomeAmount = isToken0sDAI ? amount1Min : amount0Min;
      setValue(`outcomes.${outcomeIndex}.baseAmount`, Number(outcomeAmount) / 10 ** 18, {
        shouldValidate: false,
        shouldDirty: true,
      });
    } else if (currentIndependentToken === "base") {
      // User entered outcome amount, update sDAI amount
      const sDaiAmount = isToken0sDAI ? amount0Min : amount1Min;
      setValue(`outcomes.${outcomeIndex}.quoteAmount`, Number(sDaiAmount) / 10 ** 18, {
        shouldValidate: false,
        shouldDirty: true,
      });
    }
  }

  return (
    <div className={`space-y-3 bg-white py-[12px] px-[24px] border rounded-[3px] shadow-sm cursor-pointer border-black-medium`}>
      <div className="flex justify-between items-center">
        <h3 className="text-[16px] font-medium text-black">{outcomeName}</h3>
        <Controller
          name={`outcomes.${index}.enabled`}
          control={control}
          render={({ field }) => (
            <input
              type="checkbox"
              onChange={(e) => field.onChange(e.target.checked)}
              checked={field.value}
              className="toggle toggle-sm"
              aria-label={`Enable/disable liquidity for ${outcomeName}`}
            />
          )}
        />
      </div>

      {isEnabled && (
        <>
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[150px] p-[12px ]border rounded-[12px] border-black-medium">
              <label htmlFor={`outcomes.${index}.minPrice`} className="block text-sm font-medium text-gray-700">
                Min Price
              </label>
              <div className="flex items-center mt-1">
                <button
                  type="button"
                  onClick={() => adjustPrice(`outcomes.${index}.minPrice`, -0.001)}
                  className="btn btn-square btn-sm btn-ghost"
                  aria-label="Decrease min price"
                  disabled={minPrice <= 0}
                >
                  <MinusIcon className="h-4 w-4" />
                </button>
                <input
                  id={`outcomes.${index}.minPrice`}
                  type="number"
                  placeholder="e.g., 0.10"
                  step="0.0001"
                  min="0"
                  max="1"
                  className={`input input-bordered w-full text-center mx-1 ${outcomeErrors?.minPrice ? "input-error" : ""}`}
                  {...register(`outcomes.${index}.minPrice`, {
                    required: "Min price is required",
                    valueAsNumber: true,
                    validate: {
                      min: (v: number) => v >= 0 || "Min price cannot be negative",
                      max: (v: number) => v < 1 || "Min price must be less than 1",
                      lessThanMax: (v: number) => {
                        const maxP = watch(`outcomes.${index}.maxPrice`);
                        return Number.isNaN(maxP) || v < maxP || "Min price must be less than Max price";
                      },
                    },
                  })}
                />
                <button
                  type="button"
                  onClick={() => adjustPrice(`outcomes.${index}.minPrice`, 0.001)}
                  className="btn btn-square btn-sm btn-ghost"
                  aria-label="Increase min price"
                  disabled={minPrice >= maxPrice - 0.0001}
                >
                  <PlusIcon className="h-4 w-4" />
                </button>
              </div>
              {outcomeErrors?.minPrice && <p className="text-red-500 text-xs mt-1">{outcomeErrors.minPrice.message}</p>}
            </div>

            <div className="flex-1 min-w-[100px] p-[12px ]border rounded-[12px] border-black-medium">
              <label htmlFor={poolData.poolExists ? `outcomes.${index}.centerPrice` : undefined} className="block text-sm font-medium text-gray-700">
                {poolData.poolExists ? "Current Pool Price" : "Center Price"}
              </label>
              {poolData.poolExists ? (
                <div className="mt-1 p-2 border rounded bg-gray-100 text-center text-gray-700">{centerPrice}</div>
              ) : (
                <input
                  id={`outcomes.${index}.centerPrice`}
                  type="number"
                  placeholder="e.g., 0.50"
                  step="0.01"
                  min="0"
                  max="1"
                  className={`mt-1 input input-bordered w-full text-center ${outcomeErrors?.centerPrice ? "input-error" : ""}`}
                  {...register(`outcomes.${index}.centerPrice`, {
                    required: "Center price is required",
                    valueAsNumber: true,
                    validate: {
                      min: (v: number) => v >= 0 || "Price cannot be negative",
                      max: (v: number) => v <= 1 || "Price cannot exceed 1",
                    },
                  })}
                />
              )}
              {outcomeErrors?.centerPrice && (
                <p className="text-red-500 text-xs mt-1">{outcomeErrors.centerPrice.message}</p>
              )}
            </div>

            <div className="flex-1 min-w-[150px] p-[12px ]border rounded-[12px] border-black-medium">
              <label htmlFor={`outcomes.${index}.maxPrice`} className="block text-sm font-medium text-gray-700">
                Max Price
              </label>
              <div className="flex items-center mt-1">
                <button
                  type="button"
                  onClick={() => adjustPrice(`outcomes.${index}.maxPrice`, -0.001)}
                  className="btn btn-square btn-sm btn-ghost"
                  aria-label="Decrease max price"
                  disabled={maxPrice <= minPrice + 0.0001}
                >
                  <MinusIcon className="h-4 w-4" />
                </button>
                <input
                  id={`outcomes.${index}.maxPrice`}
                  type="number"
                  placeholder="e.g., 0.90"
                  step="0.0001"
                  min="0"
                  max="1"
                  className={`input input-bordered w-full text-center mx-1 ${outcomeErrors?.maxPrice ? "input-error" : ""}`}
                  {...register(`outcomes.${index}.maxPrice`, {
                    required: "Max price is required",
                    valueAsNumber: true,
                    validate: {
                      min: (v: number) => v > 0 || "Max price must be greater than 0",
                      max: (v: number) => v <= 1 || "Max price cannot exceed 1",
                      greaterThanMin: (v: number) => {
                        const minP = watch(`outcomes.${index}.minPrice`);
                        return Number.isNaN(minP) || v > minP || "Max price must be greater than Min price";
                      },
                    },
                  })}
                />
                <button
                  type="button"
                  onClick={() => adjustPrice(`outcomes.${index}.maxPrice`, 0.001)}
                  className="btn btn-square btn-sm btn-ghost"
                  aria-label="Increase max price"
                  disabled={maxPrice >= 1}
                >
                  <PlusIcon className="h-4 w-4" />
                </button>
              </div>
              {outcomeErrors?.maxPrice && <p className="text-red-500 text-xs mt-1">{outcomeErrors.maxPrice.message}</p>}
            </div>

            <div className="flex items-center space-x-2 pt-6">
              {(Object.keys(PRESETS) as PresetName[]).map((presetName) => (
                <button
                  key={presetName}
                  type="button"
                  onClick={() => {
                    if (!Number.isNaN(centerPrice)) {
                      const { minPrice: newMin, maxPrice: newMax } = calculateRange(centerPrice, presetName);
                      setValue(`outcomes.${index}.minPrice`, Number(newMin.toFixed(4)), {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                      setValue(`outcomes.${index}.maxPrice`, Number(newMax.toFixed(4)), {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                    }
                  }}
                  className="btn btn-sm btn-outline"
                  disabled={Number.isNaN(centerPrice)}
                >
                  {presetName}
                </button>
              ))}
              <button
                key="full-range"
                type="button"
                onClick={() => {
                  setValue(`outcomes.${index}.minPrice`, 0.01, { shouldValidate: true, shouldDirty: true });
                  setValue(`outcomes.${index}.maxPrice`, 0.99, { shouldValidate: true, shouldDirty: true });
                }}
                className="btn btn-sm btn-outline"
              >
                Full
              </button>
            </div>
          </div>

          {!Number.isNaN(minPrice) && !Number.isNaN(maxPrice) && !Number.isNaN(centerPrice) && minPrice < maxPrice && (
            <div className="mt-3">
              <LiquidityChart minPrice={minPrice} maxPrice={maxPrice} centerPrice={centerPrice} />
            </div>
          )}

          <div className="flex items-start space-x-4 pt-4">
            <div className="flex-grow">
              <label htmlFor={`outcomes.${index}.quoteAmount`} className="block text-sm font-medium text-gray-700">
                sDAI Amount
              </label>
              <input
                id={`outcomes.${index}.quoteAmount`}
                type="number"
                placeholder="e.g., 100"
                className={`mt-1 input input-bordered w-full ${outcomeErrors?.quoteAmount ? "input-error" : ""}`}
                {...register(`outcomes.${index}.quoteAmount`, {
                  required: "sDAI amount required",
                  valueAsNumber: true,
                  validate: (value: number) => value >= 0 || "Amount must be non-negative",
                  onChange: (e: BaseSyntheticEvent) => {
                    handleIndependentChange(index, e.target.value, "quote");
                  },
                })}
                min="0"
                step="any"
              />
              {outcomeErrors?.quoteAmount && (
                <p className="text-red-500 text-xs mt-1">{outcomeErrors.quoteAmount.message}</p>
              )}
            </div>

            <div className="flex-grow">
              <label htmlFor={`outcomes.${index}.baseAmount`} className="block text-sm font-medium text-gray-700">
                Outcome Amount
              </label>
              <input
                id={`outcomes.${index}.baseAmount`}
                type="number"
                placeholder="e.g., 50"
                className={`mt-1 input input-bordered w-full ${outcomeErrors?.baseAmount ? "input-error" : ""}`}
                {...register(`outcomes.${index}.baseAmount`, {
                  required: "Outcome amount required",
                  valueAsNumber: true,
                  validate: (value: number) => value >= 0 || "Amount must be non-negative",
                  onChange: (e: BaseSyntheticEvent) => {
                    handleIndependentChange(index, e.target.value, "base");
                  },
                })}
                min="0"
                step="any"
              />
              {outcomeErrors?.baseAmount && (
                <p className="text-red-500 text-xs mt-1">{outcomeErrors.baseAmount.message}</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

/**
 * Generates approval addresses and amounts from mint arguments
 * @param mintArgs Array of MintCallParams from the prepared liquidity data
 * @returns Object containing approveAddresses and approveAmounts arrays
 */
function generateApprovalData(mintArgs: MintCallParams[] | undefined): {
  approveAddresses: Address[];
  approveAmounts: bigint[];
} {
  const approveAddresses: Address[] = [];
  const approveAmounts: bigint[] = [];

  if (!mintArgs || mintArgs.length === 0) {
    return { approveAddresses, approveAmounts };
  }

  // Create a map to track total amounts needed for each token
  const tokenAmounts = new Map<Address, bigint>();

  mintArgs.forEach((mintArg) => {
    // Add amount0Desired for token0
    const token0 = mintArg.token0 as Address;
    const currentAmount0 = tokenAmounts.get(token0) || 0n;
    tokenAmounts.set(token0, currentAmount0 + mintArg.amount0Desired);

    // Add amount1Desired for token1
    const token1 = mintArg.token1 as Address;
    const currentAmount1 = tokenAmounts.get(token1) || 0n;
    tokenAmounts.set(token1, currentAmount1 + mintArg.amount1Desired);
  });

  // Convert map to arrays
  tokenAmounts.forEach((amount, tokenAddress) => {
    approveAddresses.push(tokenAddress);
    approveAmounts.push(amount);
  });

  return { approveAddresses, approveAmounts };
}

// --- Liquidity Form Component ---
function LiquidityForm({ market, poolsData }: { market: Market; poolsData: PoolDataResult[] }) {
  const { address } = useAccount();

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<LiquidityFormData>({
    mode: "onChange",
    defaultValues: {
      outcomes: market.outcomes.map((_, index) => {
        const existingPool = poolsData[index].poolExists;

        let defaultCenterPrice = 0;
        if (existingPool) {
          defaultCenterPrice = Number.parseFloat(
            getCurrentPriceAsNumber(
              poolsData[index],
              COLLATERAL_TOKENS[market.chainId]?.primary?.address,
            )?.toSignificant(5) || "0",
          );
        }

        return {
          independentToken: "quote" as const,
          quoteAmount: 0,
          centerPrice: defaultCenterPrice,
          minPrice: 0,
          maxPrice: 0,
          baseAmount: 0,
          enabled: false,
        };
      }),
    },
  });

  const watchedOutcomes = watch("outcomes");
  const enabledFormData: LiquidityFormData = { outcomes: watchedOutcomes.filter((o) => isValidLiquidityOutcome(o)) };

  const {
    data: preparedData,
    isLoading: isPreparing,
    isError: isPrepareError,
    error: prepareError,
    isSuccess: isPrepareSuccess,
  } = usePrepareLiquidityMint({ formData: watchedOutcomes, market }, enabledFormData.outcomes.length > 0);

  // Generate approval addresses and amounts from preparedData.mintArgs
  const { approveAddresses, approveAmounts } = generateApprovalData(preparedData?.mintArgs);

  const {
    executeLiquidityMint,
    approvals: { data: missingApprovals = [], isLoading: isLoadingApprovals },
  } = useExecuteLiquidityMint(
    {
      tokensAddresses: approveAddresses,
      account: address,
      spender: V3_CONTRACTS.NONFUNGIBLE_POSITION_MANAGER_ADDRESS as Address,
      amounts: approveAmounts,
      chainId: market.chainId,
    },
    () => {
      console.log("Liquidity added successfully!");
    },
  );

  const onSubmit: SubmitHandler<LiquidityFormData> = () => {
    if (isPrepareSuccess && preparedData) {
      executeLiquidityMint.mutate(preparedData);
    } else {
      console.error("Attempted to submit liquidity without successful preparation or prepared data.");
    }
  };

  // TODO: check this (including disabled ones for display)
  // Calculate total sDAI from the original watched outcomes (including disabled ones for display)
  let calculatedTotal = 0;
  if (Array.isArray(watchedOutcomes)) {
    calculatedTotal = watchedOutcomes.reduce((sum, config) => {
      if (!config || !config.enabled || config.quoteAmount <= 0) {
        return sum;
      }

      return sum + config.quoteAmount;
    }, 0);
  }
  const totalSDaiLiquidity = calculatedTotal;

  // Determine button state and text
  const isButtonDisabled =
    !address ||
    isPreparing ||
    executeLiquidityMint.isPending ||
    !isPrepareSuccess ||
    !preparedData ||
    preparedData.calldatas.length === 0;

  let buttonText = "Add Liquidity for Configured Outcomes";
  if (!address) {
    buttonText = "Connect Wallet";
  } else if (isPreparing) {
    buttonText = "Preparing...";
  } else if (executeLiquidityMint.isPending) {
    buttonText = "Adding Liquidity...";
  } else if (isPrepareError) {
    buttonText = "Preparation Error";
  } else if (enabledFormData.outcomes.length === 0) {
    buttonText = "Enable and configure at least one outcome";
  } else if (!isPrepareSuccess && enabledFormData.outcomes.length > 0 && !isPreparing) {
    buttonText = "Prepare Liquidity";
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-6">
      <div>Add Liquidity</div>
      <p className="text-sm text-gray-600">Configure liquidity provision for each outcome token paired with sDAI.</p>

      {market.outcomes.map((outcomeName, index) => {
        return (
          <OutcomeLiquidityConfig
            key={index}
            index={index}
            outcomeName={outcomeName}
            control={control}
            register={register}
            errors={errors}
            watch={watch}
            setValue={setValue}
            poolData={poolsData[index]}
          />
        );
      })}

      {totalSDaiLiquidity > 0 && (
        <div className="text-right font-medium text-gray-700 mt-4">
          Total sDAI Liquidity:{" "}
          {totalSDaiLiquidity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
      )}

      {preparedData?.mintArgs && preparedData.mintArgs.length > 0 && sDaiAddress && (
        <div className="mt-1 space-y-1">
          {preparedData.mintArgs.map((mintArg, i) => {
            const isToken0sDAI = isTwoStringsEqual(mintArg.token0, sDaiAddress);
            const outcomeTokenAddress = isToken0sDAI ? mintArg.token1 : mintArg.token0;
            const outcomeIndex = market.wrappedTokens.findIndex((addr) => isTwoStringsEqual(addr, outcomeTokenAddress));
            const outcomeName = outcomeIndex !== -1 ? market.outcomes[outcomeIndex] : "Unknown Outcome";
            const outcomeAmountMin = isToken0sDAI ? mintArg.amount1Min : mintArg.amount0Min;
            const outcomeDecimals = 18;
            return (
              <div key={`${i}-outcome`} className="text-right font-medium text-gray-700 text-sm">
                Min {outcomeName}: {displayBalance(outcomeAmountMin, outcomeDecimals)}
              </div>
            );
          })}
        </div>
      )}

      {isPrepareError && prepareError && (
        <div className="text-red-500 text-sm mt-2">Error preparing transaction: {prepareError.message}</div>
      )}

      <div className="text-center">
        {missingApprovals && (
          <SwitchChainButtonWrapper chainId={market.chainId}>
            {missingApprovals.length === 0 && (
              <Button
                variant="primary"
                type="submit"
                disabled={isButtonDisabled || executeLiquidityMint.isPending || !address}
                isLoading={executeLiquidityMint.isPending || isLoadingApprovals}
                text={buttonText}
              />
            )}
            {missingApprovals.length > 0 && (
              <div className="space-y-[8px]">
                {missingApprovals.map((approval) => (
                  <ApproveButton
                    key={approval.address}
                    tokenAddress={approval.address}
                    tokenName={approval.name}
                    spender={approval.spender}
                    amount={approval.amount}
                  />
                ))}
              </div>
            )}
          </SwitchChainButtonWrapper>
        )}
      </div>
    </form>
  );
}

// --- Main Liquidity Component (parent) ---
export function Liquidity({ market }: { market: Market }) {
  const { data: poolsDataForForm, isLoading, isError } = usePoolsData({ market });

  if (isLoading) {
    return <div className="p-4 text-center">Loading pool data...</div>;
  }

  if (isError) {
    return <div className="p-4 text-center">Error loading pools data.</div>;
  }

  return <LiquidityForm market={market} poolsData={poolsDataForForm!} />;
}
