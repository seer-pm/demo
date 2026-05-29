import { ApproveButton } from "@/components/Form/ApproveButton";
import Button from "@/components/Form/Button";
import Input from "@/components/Form/Input";
import { SwitchChainButtonWrapper } from "@/components/Form/SwitchChainButtonWrapper";
import { displayBalance } from "@/lib/utils";
import type { SupportedChain } from "@seer-pm/sdk";
import { clampProbability } from "@seer-pm/sdk";
import { getNearestLimitOrderPrice } from "@seer-pm/sdk/order-book";
import { tickToPrice } from "@seer-pm/sdk/tick-math";
import { useCallback, useEffect, useMemo, useState } from "react";
import { formatUnits, parseUnits } from "viem";
import type { Address } from "viem";

function validatePriceRange(minPrice: string, maxPrice: string): string | null {
  if (!minPrice || !maxPrice) {
    return null;
  }

  const min = Number(minPrice);
  const max = Number(maxPrice);

  if (Number.isNaN(min) || Number.isNaN(max)) {
    return "Enter valid prices.";
  }

  const lower = Math.min(min, max);
  const upper = Math.max(min, max);

  if (lower <= 0 || upper >= 1) {
    return "Price range must be strictly between 0 and 1.";
  }

  if (lower >= upper) {
    return "Max price must be greater than min price.";
  }

  return null;
}

function snapToNearestTickPrice(value: string, outcomeIsToken0: boolean): string {
  if (!value) {
    return value;
  }

  const parsed = Number(value);

  if (Number.isNaN(parsed) || parsed <= 0 || parsed >= 1) {
    return value;
  }

  const { tick } = getNearestLimitOrderPrice(parsed, outcomeIsToken0);
  const [price0, price1] = tickToPrice(tick, 18, true);
  const price = outcomeIsToken0 ? price0 : price1;

  return Number(price).toFixed(8);
}

function validateInitialPrice(
  initialPrice: string,
  minPrice: string,
  maxPrice: string,
  required: boolean,
): string | null {
  if (!required) {
    return null;
  }

  if (!initialPrice) {
    return "Enter a starting price.";
  }

  const price = Number(initialPrice);

  if (Number.isNaN(price)) {
    return "Enter a valid starting price.";
  }

  if (price <= 0 || price >= 1) {
    return "Starting price must be strictly between 0 and 1.";
  }

  if (!minPrice || !maxPrice) {
    return null;
  }

  const min = Number(minPrice);
  const max = Number(maxPrice);

  if (Number.isNaN(min) || Number.isNaN(max)) {
    return null;
  }

  const lower = Math.min(min, max);
  const upper = Math.max(min, max);

  if (price <= lower || price >= upper) {
    return "Starting price must be within the position range.";
  }

  return null;
}

export interface AddLiquidityTokenInfo {
  address: Address;
  symbol: string;
  decimals: number;
  balance: bigint;
}

export interface AddLiquidityFormValues {
  minPrice: number;
  maxPrice: number;
  amount0: string;
  amount1: string;
  initialPrice?: number;
}

export interface AddLiquidityMissingApproval {
  tokenAddress: Address;
  tokenName: string;
  spender: Address;
  amount: bigint;
}

export interface AddLiquidityFormProps {
  chainId: SupportedChain;
  token0: AddLiquidityTokenInfo;
  token1: AddLiquidityTokenInfo;
  outcomeIsToken0: boolean;
  isPoolInitialized?: boolean;
  isPoolStatusLoading?: boolean;
  isSubmitting?: boolean;
  missingApprovals?: AddLiquidityMissingApproval[];
  onComputeDerivedAmount: (
    values: AddLiquidityFormValues,
    editedField: "amount0" | "amount1",
  ) => AddLiquidityFormValues;
  onSubmit: (values: AddLiquidityFormValues) => Promise<void>;
  closeModal: () => void;
  hideReturnButton?: boolean;
  uniswapPoolUrl?: string;
}

export function AddLiquidityForm({
  chainId,
  token0,
  token1,
  outcomeIsToken0,
  isPoolInitialized,
  isPoolStatusLoading,
  isSubmitting,
  missingApprovals = [],
  onComputeDerivedAmount,
  onSubmit,
  closeModal,
  hideReturnButton,
  uniswapPoolUrl,
}: AddLiquidityFormProps) {
  const [initialPrice, setInitialPrice] = useState("");
  const [minPrice, setMinPrice] = useState("0.01");
  const [maxPrice, setMaxPrice] = useState("0.99");
  const [amount0, setAmount0] = useState("");
  const [amount1, setAmount1] = useState("");
  const [lastEditedField, setLastEditedField] = useState<"amount0" | "amount1" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const requiresInitialPrice = !isPoolInitialized;

  const getValues = useCallback((): AddLiquidityFormValues => {
    const values: AddLiquidityFormValues = {
      minPrice: Number(minPrice),
      maxPrice: Number(maxPrice),
      amount0,
      amount1,
    };

    if (requiresInitialPrice && initialPrice) {
      values.initialPrice = Number(initialPrice);
    }

    return values;
  }, [minPrice, maxPrice, amount0, amount1, initialPrice, requiresInitialPrice]);

  const parsedAmounts = useMemo(() => {
    try {
      return {
        parsed0: amount0 ? parseUnits(amount0, token0.decimals) : 0n,
        parsed1: amount1 ? parseUnits(amount1, token1.decimals) : 0n,
      };
    } catch {
      return null;
    }
  }, [amount0, amount1, token0.decimals, token1.decimals]);

  const balanceError = useMemo(() => {
    if (!parsedAmounts) {
      return null;
    }

    const { parsed0, parsed1 } = parsedAmounts;

    if (parsed0 > token0.balance || parsed1 > token1.balance) {
      return "Insufficient balance.";
    }

    return null;
  }, [parsedAmounts, token0.balance, token1.balance]);

  const priceRangeError = useMemo(() => validatePriceRange(minPrice, maxPrice), [minPrice, maxPrice]);

  const initialPriceValidationError = useMemo(() => {
    if (!requiresInitialPrice || !initialPrice) {
      return null;
    }

    return validateInitialPrice(initialPrice, minPrice, maxPrice, false);
  }, [initialPrice, minPrice, maxPrice, requiresInitialPrice]);

  const hasInitialPrice = !requiresInitialPrice || Boolean(initialPrice);

  const canComputeAmounts = hasInitialPrice && !initialPriceValidationError;

  const canSubmit = useMemo(() => {
    if (!parsedAmounts || balanceError || priceRangeError || initialPriceValidationError || !hasInitialPrice) {
      return false;
    }

    const { parsed0, parsed1 } = parsedAmounts;

    if (parsed0 === 0n && parsed1 === 0n) {
      return false;
    }

    const min = Number(minPrice);
    const max = Number(maxPrice);

    if (Number.isNaN(min) || Number.isNaN(max)) {
      return false;
    }

    return true;
  }, [parsedAmounts, balanceError, priceRangeError, initialPriceValidationError, hasInitialPrice, minPrice, maxPrice]);

  const recomputeDerivedAmount = useCallback(
    (field: "amount0" | "amount1", value: string) => {
      if (!value || Number(value) <= 0) {
        return;
      }

      if (!canComputeAmounts) {
        return;
      }

      const derived = onComputeDerivedAmount({ ...getValues(), [field]: value }, field);
      setAmount0(derived.amount0);
      setAmount1(derived.amount1);
    },
    [canComputeAmounts, getValues, onComputeDerivedAmount],
  );

  const handlePriceBlur = (field: "minPrice" | "maxPrice" | "initialPrice") => {
    const snap = (value: string) => snapToNearestTickPrice(value, outcomeIsToken0);

    if (field === "minPrice") {
      setMinPrice((current) => snap(current));
      return;
    }

    if (field === "maxPrice") {
      setMaxPrice((current) => snap(current));
      return;
    }

    setInitialPrice((current) => snap(current));
  };

  const handleAmountChange = (field: "amount0" | "amount1", value: string) => {
    setError(null);
    setLastEditedField(field);

    if (!value || Number(value) <= 0) {
      if (field === "amount0") {
        setAmount0(value);
        setAmount1("");
      } else {
        setAmount1(value);
        setAmount0("");
      }
      return;
    }

    if (field === "amount0") {
      setAmount0(value);
    } else {
      setAmount1(value);
    }

    if (!canComputeAmounts) {
      return;
    }

    try {
      recomputeDerivedAmount(field, value);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to compute amounts");
    }
  };

  useEffect(() => {
    setError(null);
  }, [minPrice, maxPrice, initialPrice]);

  useEffect(() => {
    if (!lastEditedField || !canComputeAmounts) {
      return;
    }

    const value = lastEditedField === "amount0" ? amount0 : amount1;

    if (!value || Number(value) <= 0) {
      return;
    }

    try {
      const derived = onComputeDerivedAmount({ ...getValues(), [lastEditedField]: value }, lastEditedField);
      setAmount0(derived.amount0);
      setAmount1(derived.amount1);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to compute amounts");
    }
  }, [initialPrice, minPrice, maxPrice, canComputeAmounts, lastEditedField, onComputeDerivedAmount]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    const values = getValues();
    const rangeError = validatePriceRange(minPrice, maxPrice);
    if (rangeError) {
      setError(rangeError);
      return;
    }

    const startingPriceError = validateInitialPrice(initialPrice, minPrice, maxPrice, requiresInitialPrice);

    if (startingPriceError) {
      setError(startingPriceError);
      return;
    }

    const min = clampProbability(Math.min(values.minPrice, values.maxPrice));
    const max = clampProbability(Math.max(values.minPrice, values.maxPrice));

    const parsed0 = parseUnits(values.amount0 || "0", token0.decimals);
    const parsed1 = parseUnits(values.amount1 || "0", token1.decimals);

    if (parsed0 === 0n && parsed1 === 0n) {
      setError("Enter an amount for at least one token.");
      return;
    }

    if (parsed0 > token0.balance || parsed1 > token1.balance) {
      setError("Insufficient balance.");
      return;
    }

    try {
      await onSubmit({
        ...values,
        minPrice: min,
        maxPrice: max,
        ...(requiresInitialPrice && values.initialPrice !== undefined ? { initialPrice: values.initialPrice } : {}),
      });
      closeModal();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Transaction failed");
    }
  };

  const outcomeLabel = outcomeIsToken0 ? token0.symbol : token1.symbol;
  const showApprovals = missingApprovals.length > 0;
  const displayError = error || balanceError || priceRangeError || initialPriceValidationError;

  const uniswapPoolLink =
    uniswapPoolUrl && uniswapPoolUrl !== "#" ? (
      <a
        href={uniswapPoolUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-purple-primary hover:underline"
      >
        Uniswap V4 pool
      </a>
    ) : (
      "Uniswap V4 pool"
    );

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {isPoolStatusLoading ? (
        <p className="text-[14px] text-black-secondary">Checking pool status...</p>
      ) : (
        <p className="text-[14px] text-black-secondary">
          {isPoolInitialized ? (
            <>Add liquidity to the existing {uniswapPoolLink}.</>
          ) : (
            <>
              Create the {uniswapPoolLink} and add initial liquidity. Set the starting price, position range, and
              deposit.
            </>
          )}
        </p>
      )}

      {!isPoolInitialized && !isPoolStatusLoading && (
        <div className="min-w-0">
          <div className="text-[14px] font-semibold mb-2">Starting price ({outcomeLabel})</div>
          <Input
            type="number"
            min="0"
            max="1"
            step="any"
            value={initialPrice}
            onChange={(e) => setInitialPrice(e.target.value)}
            onBlur={() => handlePriceBlur("initialPrice")}
            className="w-full"
            placeholder="e.g. 0.65"
          />
        </div>
      )}

      <div>
        <div className="text-[14px] font-semibold mb-2">Position range ({outcomeLabel})</div>
        <div className="grid grid-cols-2 gap-4">
          <div className="min-w-0">
            <div className="text-[14px] text-black-secondary mb-2">Min price</div>
            <Input
              type="number"
              min="0"
              max="1"
              step="any"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              onBlur={() => handlePriceBlur("minPrice")}
              className="w-full"
            />
          </div>
          <div className="min-w-0">
            <div className="text-[14px] text-black-secondary mb-2">Max price</div>
            <Input
              type="number"
              min="0"
              max="1"
              step="any"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              onBlur={() => handlePriceBlur("maxPrice")}
              className="w-full"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="min-w-0">
          <div className="text-[14px] font-semibold mb-2">{token0.symbol}</div>
          <div className="flex justify-between items-center gap-2 mb-2 text-[12px]">
            <span className="text-black-secondary truncate">
              Balance: {displayBalance(token0.balance, token0.decimals)} {token0.symbol}
            </span>
            <button
              type="button"
              className="text-purple-primary shrink-0"
              disabled={!canComputeAmounts}
              onClick={() => handleAmountChange("amount0", formatUnits(token0.balance, token0.decimals))}
            >
              Max
            </button>
          </div>
          <Input
            type="number"
            min="0"
            step="any"
            value={amount0}
            disabled={!canComputeAmounts}
            onChange={(e) => handleAmountChange("amount0", e.target.value)}
            className="w-full"
          />
        </div>

        <div className="min-w-0">
          <div className="text-[14px] font-semibold mb-2">{token1.symbol}</div>
          <div className="flex justify-between items-center gap-2 mb-2 text-[12px]">
            <span className="text-black-secondary truncate">
              Balance: {displayBalance(token1.balance, token1.decimals)} {token1.symbol}
            </span>
            <button
              type="button"
              className="text-purple-primary shrink-0"
              disabled={!canComputeAmounts}
              onClick={() => handleAmountChange("amount1", formatUnits(token1.balance, token1.decimals))}
            >
              Max
            </button>
          </div>
          <Input
            type="number"
            min="0"
            step="any"
            value={amount1}
            disabled={!canComputeAmounts}
            onChange={(e) => handleAmountChange("amount1", e.target.value)}
            className="w-full"
          />
        </div>
      </div>

      {displayError ? <p className="text-[14px] text-error-primary">{displayError}</p> : null}

      <SwitchChainButtonWrapper chainId={chainId}>
        {!showApprovals && (
          <Button
            variant="primary"
            type="submit"
            text={isPoolInitialized ? "Add Liquidity" : "Create Pool & Add Liquidity"}
            isLoading={isSubmitting}
            disabled={!canSubmit}
            className="w-full"
          />
        )}
        {showApprovals && (
          <div className="space-y-2 w-full">
            {missingApprovals.map((approval) => (
              <ApproveButton
                key={`${approval.tokenAddress}-${approval.spender}`}
                tokenAddress={approval.tokenAddress}
                tokenName={approval.tokenName}
                spender={approval.spender}
                amount={approval.amount}
                chainId={chainId}
              />
            ))}
          </div>
        )}
      </SwitchChainButtonWrapper>

      {!hideReturnButton && (
        <div className="text-center">
          <Button text="Return" variant="secondary" type="button" onClick={closeModal} />
        </div>
      )}
    </form>
  );
}
