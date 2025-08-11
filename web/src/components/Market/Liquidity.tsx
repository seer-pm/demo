import {
  SLIPPAGE_TOLERANCE,
  USE_FULL_PRECISION,
  buildPrice,
  useExecuteLiquidityMint,
  usePoolsData,
  usePrepareLiquidityMint,
} from "@/hooks/useSwaprProvideLiquidity";
import { useTokenBalance } from "@/hooks/useTokenBalance";
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

const sDaiToken = COLLATERAL_TOKENS[100]?.primary;

// --- Liquidity Chart Component ---
interface LiquidityChartProps {
  minPrice: string;
  maxPrice: string;
  centerPrice: string;
}

const LiquidityChart = ({ minPrice, maxPrice, centerPrice }: LiquidityChartProps) => {
  // Parse price strings to numbers for chart rendering
  const minPriceNum = Number.parseFloat(minPrice);
  const maxPriceNum = Number.parseFloat(maxPrice);
  const centerPriceNum = Number.parseFloat(centerPrice);
  
  // Create background vertical lines data
  const createBackgroundLines = () => {
    const lines = [];
    // Create lines every 2% of the chart width for consistent spacing regardless of container size
    const lineSpacing = 0.02; // 2% spacing
    for (let x = 0; x <= 1; x += lineSpacing) {
      lines.push({
        xAxis: x,
        lineStyle: {
          color: "#EAF1FF",
          type: "solid",
          width: 2,
        },
      });
    }
    return lines;
  };

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
            if (data.xAxis === minPriceNum) label = "Min Price";
            else if (data.xAxis === maxPriceNum) label = "Max Price";
            else if (data.xAxis === centerPriceNum) label = "Center Price";
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
      axisLine: { show: false },
    },
    yAxis: {
      show: false,
      min: 0,
      max: 1,
    },
    series: [
      // Background area between min and max prices
      {
        type: "line",
        data: [
          [minPrice, 0],
          [minPrice, 1],
          [maxPrice, 1],
          [maxPrice, 0],
        ],
        lineStyle: {
          color: "transparent",
          width: 0,
        },
        areaStyle: {
          color: "rgba(179, 143, 255, 0.24)",
          opacity: 0.24,
        },
        symbol: "none",
        silent: true,
        animation: false,
        z: 1, // Lower z-index so it stays behind other elements
      },
      // Background vertical lines series
      {
        type: "line",
        data: [],
        silent: true, // Don't respond to mouse events
        animation: false,
        z: 2, // Higher z-index so lines appear over the background area
        markLine: {
          animation: false,
          silent: true,
          symbol: ["none", "none"],
          label: {
            show: false,
          },
          data: createBackgroundLines(),
        },
      },
      // Main series with price markers
      {
        type: "line",
        data: [],
        z: 3, // Highest z-index for the main price markers
        markLine: {
          animation: false,
          silent: false,
          symbol: "none",
          label: {
            show: false,
          },
          data: [
            {
              xAxis: minPriceNum,
              lineStyle: {
                color: "#B38FFF",
                type: "solid",
                width: 3,
              },
              symbol: "none",
            },
            {
              xAxis: maxPriceNum,
              lineStyle: {
                color: "#B38FFF",
                type: "solid",
                width: 3,
              },
              symbol: "none",
            },
            {
              xAxis: centerPriceNum,
              lineStyle: {
                color: "#24CDFE",
                type: "solid",
                width: 3,
              },
              symbol: "none",
            },
          ],
        },
      },
    ],
  };
  return <ReactECharts option={option} style={{ height: "114px", width: "100%" }} notMerge={true} lazyUpdate={true} />;
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
  market,
  userAddress,
}: OutcomeLiquidityConfigProps) => {
  const isEnabled = watch(`outcomes.${index}.enabled`);
  const centerPrice = watch(`outcomes.${index}.centerPrice`);
  const minPrice = watch(`outcomes.${index}.minPrice`);
  const maxPrice = watch(`outcomes.${index}.maxPrice`);

  // Get token balances
  const collateralToken = sDaiToken.address;
  const outcomeToken = market.wrappedTokens[index];
  
  const { data: collateralBalance } = useTokenBalance(userAddress, collateralToken, market.chainId);
  const { data: outcomeBalance } = useTokenBalance(userAddress, outcomeToken, market.chainId);

  // Helper function to validate balance
  const validateBalance = (amount: number, balance: bigint | undefined, tokenDecimals: number, tokenSymbol: string) => {
    // If user is not connected or no balance data, allow the input
    if (!userAddress || balance === undefined) return true;
    
    // If amount is 0 or negative, let other validations handle it
    if (amount <= 0) return "Amount must be non-negative";
/*     
    // Check for unreasonably large or small numbers (including scientific notation)
    // Prevent numbers that would overflow or cause parsing errors
    if (!isFinite(amount) || amount > Number.MAX_SAFE_INTEGER) {
      return "Amount is too large";
    }
    
    // Check for very small numbers that could cause parsing issues
    if (amount > 0 && amount < 1e-18) {
      return "Amount is too small";
    }
    
    // Check if the number is in scientific notation with very large or small exponent
    const amountStr = amount.toString();
    if (amountStr.includes('e+') && amount > 1e20) {
      return "Amount is too large";
    }
    if (amountStr.includes('e-') && amount < 1e-15) {
      return "Amount is too small";
    } */
    
    try {
      const amountInWei = parseUnits(amount.toString(), tokenDecimals);
      if (amountInWei > balance) {
        const balanceFormatted = displayBalance(balance, tokenDecimals);
        return `Insufficient ${tokenSymbol} balance. Available: ${balanceFormatted}`;
      }
      return true;
    } catch (error) {
      // If parsing fails, return an appropriate error message
      console.error("Error parsing amount for validation:", error);
      return "Invalid amount format";
    }
  };

  const outcomeErrors = errors.outcomes?.[index];

  // Helper function for increment/decrement buttons
  const adjustPrice = (field: `outcomes.${number}.minPrice` | `outcomes.${number}.maxPrice`, delta: number) => {
    const currentMin = watch(`outcomes.${index}.minPrice`);
    const currentMax = watch(`outcomes.${index}.maxPrice`);
    const currentVal = field === `outcomes.${index}.minPrice` ? currentMin : currentMax;
    let newVal = Number.parseFloat(currentVal) + delta; // Parse string to number, then add delta
    newVal = Number(newVal.toFixed(4)); // Use 4 decimal places precision for adjustments

    // Clamp between 0 and 1
    newVal = Math.max(0, Math.min(1, newVal));

    // Ensure min < max
    if (field === `outcomes.${index}.minPrice`) {
      const maxVal = Number.parseFloat(currentMax);
      newVal = Math.min(newVal, maxVal - 0.0001);
    } else {
      const minVal = Number.parseFloat(currentMin);
      newVal = Math.max(newVal, minVal + 0.0001);
    }

    newVal = Math.max(0, Math.min(1, newVal));
    console.log("set value", newVal, newVal.toFixed(4));
    setValue(field, newVal.toFixed(4), { shouldValidate: true, shouldDirty: true });
  };

  function handleIndependentChange(
    outcomeIndex: number,
    inputAmountIsh: string,
    currentIndependentToken: "quote" | "base",
  ) {console.log("handle independent change");
    const isToken0sDAI = isTwoStringsEqual(poolData.token0.address, sDaiToken.address);
    // Determine the correct input token based on which field the user is editing
    const inputToken = currentIndependentToken === "quote" 
      ? (isToken0sDAI ? poolData.token0 : poolData.token1)  // sDAI token
      : (isToken0sDAI ? poolData.token1 : poolData.token0); // outcome token
    const inputAmount = parseUnits(inputAmountIsh, inputToken.decimals).toString();
console.log("prices debug", "centerPrice", centerPrice, "minPrice", minPrice, "maxPrice", maxPrice, Number.parseFloat(centerPrice), Number.parseFloat(minPrice), Number.parseFloat(maxPrice))
console.log("inputToken", inputToken, "inputAmount", inputAmount)
    const { amount0Min, amount1Min, ...rest } = calculateMintAmountsFromInput(
      getPoolFromPoolData(poolData, FeeAmount.LOW, buildPrice(poolData.token0, poolData.token1, Number.parseFloat(centerPrice))),
      buildPrice(poolData.token0, poolData.token1, Number.parseFloat(minPrice)),
      buildPrice(poolData.token0, poolData.token1, Number.parseFloat(maxPrice)),
      inputToken,
      inputAmount,
      USE_FULL_PRECISION,
      SLIPPAGE_TOLERANCE,
    );

    setValue(`outcomes.${outcomeIndex}.independentToken`, currentIndependentToken, {
      shouldValidate: true,
      shouldDirty: true,
    });
console.log("handleIndependentChange", currentIndependentToken, "amount0Min", amount0Min, "amount1Min", amount1Min, "rest", rest)
    // Only update the dependent field, keep the independent field unchanged
    if (currentIndependentToken === "quote") {
      // User entered sDAI amount, update outcome amount
      const outcomeAmount = isToken0sDAI ? amount1Min : amount0Min;
      setValue(`outcomes.${outcomeIndex}.baseAmount`, (Number(outcomeAmount) / 10 ** 18).toString(), {
        shouldValidate: true,
        shouldDirty: true,
      });console.log("update base", outcomeAmount, (Number(outcomeAmount) / 10 ** 18), (Number(outcomeAmount) / 10 ** 18).toString());
    } else if (currentIndependentToken === "base") {
      // User entered outcome amount, update sDAI amount
      const sDaiAmount = isToken0sDAI ? amount0Min : amount1Min;
      setValue(`outcomes.${outcomeIndex}.quoteAmount`, (Number(sDaiAmount) / 10 ** 18).toString(), {
        shouldValidate: true,
        shouldDirty: true,
      });console.log("update quote", sDaiAmount, (Number(sDaiAmount) / 10 ** 18), (Number(sDaiAmount) / 10 ** 18).toString());
    }
  }

  // Handle price changes to update amounts
  function handlePriceChange() {
    const currentIndependentToken = watch(`outcomes.${index}.independentToken`) || "quote";
    const currentAmount = currentIndependentToken === "quote" 
      ? watch(`outcomes.${index}.quoteAmount`)
      : watch(`outcomes.${index}.baseAmount`);
    
    if (currentAmount && !Number.isNaN(Number.parseFloat(currentAmount)) && Number.parseFloat(currentAmount) > 0) {
      handleIndependentChange(index, currentAmount, currentIndependentToken);
    }
  }

  return (
    <div className={`space-y-3 bg-white py-[12px] px-[24px] border rounded-[3px] shadow-sm cursor-pointer border-black-medium`}>
      <div 
        className="flex justify-between items-center cursor-pointer"
        onClick={() => {
          const currentValue = watch(`outcomes.${index}.enabled`);
          setValue(`outcomes.${index}.enabled`, !currentValue, {
            shouldValidate: true,
            shouldDirty: true,
          });
        }}
      >
        <h3 className="text-[16px] text-black">{outcomeName}</h3>
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
              onClick={(e) => e.stopPropagation()}
            />
          )}
        />
      </div>

      {isEnabled && (
        <>
          <div className="flex flex-wrap items-center gap-4 text-center">
            <div className="flex-1 p-[12px] border rounded-[12px] border-black-medium min-w-[150px] ">
              <label htmlFor={`outcomes.${index}.minPrice`} className="block text-[14px] text-gray-700">
                Min Price
              </label>
              <div className="flex items-center mt-1">
                <button
                  type="button"
                  onClick={() => adjustPrice(`outcomes.${index}.minPrice`, -0.001)}
                  className="btn btn-sm btn-ghost"
                  aria-label="Decrease min price"
                  disabled={Number.parseFloat(minPrice) <= 0}
                >
                  <MinusIcon className="h-4 w-4 text-purple-primary" />
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
                    validate: {
                      min: (v: string) => {
                        const num = Number.parseFloat(v);
                        return !Number.isNaN(num) && num >= 0 || "Min price cannot be negative";
                      },
                      max: (v: string) => {
                        const num = Number.parseFloat(v);
                        return !Number.isNaN(num) && num < 1 || "Min price must be less than 1";
                      },
                      lessThanMax: (v: string) => {
                        const maxP = watch(`outcomes.${index}.maxPrice`);
                        const maxPNum = Number.parseFloat(maxP);
                        const vNum = Number.parseFloat(v);
                        return Number.isNaN(maxPNum) || Number.isNaN(vNum) || vNum < maxPNum || "Min price must be less than Max price";
                      },
                    },
                    onChange: () => {
                      // Use setTimeout to ensure the form value is updated before calling handlePriceChange
                      setTimeout(() => handlePriceChange(), 0);
                    },
                  })}
                />
                <button
                  type="button"
                  onClick={() => adjustPrice(`outcomes.${index}.minPrice`, 0.001)}
                  className="btn btn-sm btn-ghost"
                  aria-label="Increase min price"
                  disabled={Number.parseFloat(minPrice) >= Number.parseFloat(maxPrice) - 0.0001}
                >
                  <PlusIcon className="h-4 w-4 text-purple-primary" />
                </button>
              </div>
              {outcomeErrors?.minPrice && <p className="text-warning-primary text-xs mt-1">{outcomeErrors.minPrice.message}</p>}
            </div>

            <div className="flex-1 p-[12px] bg-purple-medium rounded-[12px] border-black-medium min-w-[100px] ">
              <label htmlFor={poolData.poolExists ? `outcomes.${index}.centerPrice` : undefined} className="block text-[14px] text-gray-700">
                {poolData.poolExists ? "Current Pool Price" : "Center Price"}
              </label>
              {poolData.poolExists ? (
                <div className="mt-1 p-2 text-center text-blue-primary font-semibold">{centerPrice}</div>
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
                    validate: {
                      min: (v: string) => {
                        const num = Number.parseFloat(v);
                        return !Number.isNaN(num) && num >= 0 || "Price cannot be negative";
                      },
                      max: (v: string) => {
                        const num = Number.parseFloat(v);
                        return !Number.isNaN(num) && num <= 1 || "Price cannot exceed 1";
                      },
                    },
                    onChange: () => {
                      // Use setTimeout to ensure the form value is updated before calling handlePriceChange
                      setTimeout(() => handlePriceChange(), 0);
                    },
                  })}
                />
              )}
              {outcomeErrors?.centerPrice && (
                <p className="text-warning-primary text-xs mt-1">{outcomeErrors.centerPrice.message}</p>
              )}
            </div>

            <div className="flex-1 p-[12px] border rounded-[12px] border-black-medium min-w-[150px] ">
              <label htmlFor={`outcomes.${index}.maxPrice`} className="block text-[14px] text-gray-700">
                Max Price
              </label>
              <div className="flex items-center mt-1">
                <button
                  type="button"
                  onClick={() => adjustPrice(`outcomes.${index}.maxPrice`, -0.001)}
                  className="btn btn-sm btn-ghost"
                  aria-label="Decrease max price"
                  disabled={Number.parseFloat(maxPrice) <= Number.parseFloat(minPrice) + 0.0001}
                >
                  <MinusIcon className="h-4 w-4 text-purple-primary" />
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
                    validate: {
                      min: (v: string) => {
                        const num = Number.parseFloat(v);
                        return !Number.isNaN(num) && num > 0 || "Max price must be greater than 0";
                      },
                      max: (v: string) => {
                        const num = Number.parseFloat(v);
                        return !Number.isNaN(num) && num <= 1 || "Max price cannot exceed 1";
                      },
                      greaterThanMin: (v: string) => {
                        const minP = watch(`outcomes.${index}.minPrice`);
                        const minPNum = Number.parseFloat(minP);
                        const vNum = Number.parseFloat(v);
                        return Number.isNaN(minPNum) || Number.isNaN(vNum) || vNum > minPNum || "Max price must be greater than Min price";
                      },
                    },
                    onChange: () => {
                      // Use setTimeout to ensure the form value is updated before calling handlePriceChange
                      setTimeout(() => handlePriceChange(), 0);
                    },
                  })}
                />
                <button
                  type="button"
                  onClick={() => adjustPrice(`outcomes.${index}.maxPrice`, 0.001)}
                  className="btn btn-sm btn-ghost"
                  aria-label="Increase max price"
                  disabled={Number.parseFloat(maxPrice) >= 1}
                >
                  <PlusIcon className="h-4 w-4 text-purple-primary" />
                </button>
              </div>
              {outcomeErrors?.maxPrice && <p className="text-warning-primary text-xs mt-1">{outcomeErrors.maxPrice.message}</p>}
            </div>

            <div className="flex items-center space-x-2">
              {(Object.keys(PRESETS) as PresetName[]).map((presetName) => (
                <button
                  key={presetName}
                  type="button"
                  onClick={() => {
                    if (!Number.isNaN(Number.parseFloat(centerPrice))) {
                      const { minPrice: newMin, maxPrice: newMax } = calculateRange(centerPrice, presetName);
                      setValue(`outcomes.${index}.minPrice`, newMin, {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                      setValue(`outcomes.${index}.maxPrice`, newMax, {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                    }
                  }}
                  className="btn btn-sm font-normal text-purple-primary bg-purple-medium rounded-[20px]"
                  disabled={Number.isNaN(Number.parseFloat(centerPrice))}
                >
                  {presetName}
                </button>
              ))}
              <button
                key="full-range"
                type="button"
                onClick={() => {
                  setValue(`outcomes.${index}.minPrice`, "0.01", { shouldValidate: true, shouldDirty: true });
                  setValue(`outcomes.${index}.maxPrice`, "0.99", { shouldValidate: true, shouldDirty: true });
                }}
                className="btn btn-sm font-normal text-purple-primary bg-purple-medium rounded-[20px]"
              >
                Full
              </button>
            </div>
          </div>

          {!Number.isNaN(Number.parseFloat(minPrice)) && !Number.isNaN(Number.parseFloat(maxPrice)) && !Number.isNaN(Number.parseFloat(centerPrice)) && Number.parseFloat(minPrice) < Number.parseFloat(maxPrice) && (
            <div className="mt-3">
              <LiquidityChart minPrice={minPrice} maxPrice={maxPrice} centerPrice={centerPrice} />
            </div>
          )}

          <div className="flex items-start space-x-4 pt-4">
            <div className="flex-grow">
              <label htmlFor={`outcomes.${index}.quoteAmount`} className="block text-sm text-gray-700">
                sDAI Amount
              </label>
              <input
                id={`outcomes.${index}.quoteAmount`}
                type="number"
                placeholder="e.g., 100"
                className={`mt-1 input input-bordered w-full ${outcomeErrors?.quoteAmount ? "input-error" : ""}`}
                {...register(`outcomes.${index}.quoteAmount`, {
                  required: "sDAI amount required",
                  validate: (value: string) => {
                    const numValue = Number.parseFloat(value);
                    if (Number.isNaN(numValue)) return "Invalid amount";
                    return validateBalance(
                      numValue, 
                      collateralBalance, 
                      sDaiToken.decimals,
                      sDaiToken.symbol
                    );
                  },
                  onChange: (e: BaseSyntheticEvent) => {
                    handleIndependentChange(index, e.target.value, "quote");
                  },
                })}
                min="0"
                step="any"
              />
              {userAddress && (
                <p className="text-gray-500 text-xs mt-1">
                  Balance: {collateralBalance !== undefined 
                    ? `${displayBalance(collateralBalance, sDaiToken.decimals)} ${sDaiToken.symbol}`
                    : 'Loading...'
                  }
                </p>
              )}
              {outcomeErrors?.quoteAmount && (
                <p className="text-warning-primary text-xs mt-1">{outcomeErrors.quoteAmount.message}</p>
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
                  validate: (value: string) => {
                    const numValue = Number.parseFloat(value);
                    if (Number.isNaN(numValue)) return "Invalid amount";
                    return validateBalance(numValue, outcomeBalance, 18, outcomeName);
                  },
                  onChange: (e: BaseSyntheticEvent) => {
                    handleIndependentChange(index, e.target.value, "base");
                  },
                })}
                min="0"
                step="any"
              />
              {userAddress && (
                <p className="text-gray-500 text-xs mt-1">
                  Balance: {outcomeBalance !== undefined 
                    ? `${displayBalance(outcomeBalance, 18)} ${outcomeName}`
                    : 'Loading...'
                  }
                </p>
              )}
              {outcomeErrors?.baseAmount && (
                <p className="text-warning-primary text-xs mt-1">{outcomeErrors.baseAmount.message}</p>
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
          quoteAmount: "0",
          centerPrice: defaultCenterPrice.toString(),
          minPrice: "0",
          maxPrice: "0",
          baseAmount: "0",
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
      if (!config || !config.enabled) {
        return sum;
      }
      
      const quoteAmount = Number.parseFloat(config.quoteAmount);
      if (Number.isNaN(quoteAmount) || quoteAmount <= 0) {
        return sum;
      }

      return sum + quoteAmount;
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
      <div className="font-semibold text-[24px]">Add Liquidity</div>
      <p className="text-[16px] text-gray-600">Configure liquidity provision for each outcome token paired with sDAI.</p>

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
            market={market}
            userAddress={address}
          />
        );
      })}

      {totalSDaiLiquidity > 0 && (
        <div className="text-right font-medium text-gray-700 mt-4">
          Total sDAI Liquidity:{" "}
          {totalSDaiLiquidity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
      )}

      {preparedData?.mintArgs && preparedData.mintArgs.length > 0 && sDaiToken && (
        <div className="mt-1 space-y-1">
          {preparedData.mintArgs.map((mintArg, i) => {
            const isToken0sDAI = isTwoStringsEqual(mintArg.token0, sDaiToken.address);
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
        <div className="text-warning-primary text-sm mt-2">Error preparing transaction: {prepareError.message}</div>
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
