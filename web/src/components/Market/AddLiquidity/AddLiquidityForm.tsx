import { ApproveButton } from "@/components/Form/ApproveButton";
import Button from "@/components/Form/Button";
import Input from "@/components/Form/Input";
import { SwitchChainButtonWrapper } from "@/components/Form/SwitchChainButtonWrapper";
import { displayBalance } from "@/lib/utils";
import type { SupportedChain } from "@seer-pm/sdk";
import { clampProbability } from "@seer-pm/sdk";
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
}: AddLiquidityFormProps) {
  const [minPrice, setMinPrice] = useState("0.01");
  const [maxPrice, setMaxPrice] = useState("0.99");
  const [amount0, setAmount0] = useState("");
  const [amount1, setAmount1] = useState("");
  const [error, setError] = useState<string | null>(null);

  const getValues = useCallback(
    (): AddLiquidityFormValues => ({
      minPrice: Number(minPrice),
      maxPrice: Number(maxPrice),
      amount0,
      amount1,
    }),
    [minPrice, maxPrice, amount0, amount1],
  );

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

  const canSubmit = useMemo(() => {
    if (!parsedAmounts || balanceError || priceRangeError) {
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
  }, [parsedAmounts, balanceError, priceRangeError, minPrice, maxPrice]);

  const handleAmountChange = (field: "amount0" | "amount1", value: string) => {
    setError(null);
    const next = {
      ...getValues(),
      [field]: value,
    };

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

    try {
      const derived = onComputeDerivedAmount(next, field);
      setMinPrice(String(derived.minPrice));
      setMaxPrice(String(derived.maxPrice));
      setAmount0(derived.amount0);
      setAmount1(derived.amount1);
    } catch (e) {
      if (field === "amount0") setAmount0(value);
      else setAmount1(value);
      setError(e instanceof Error ? e.message : "Unable to compute amounts");
    }
  };

  useEffect(() => {
    setError(null);
  }, [minPrice, maxPrice]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    const values = getValues();
    const rangeError = validatePriceRange(minPrice, maxPrice);

    if (rangeError) {
      setError(rangeError);
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
      await onSubmit({ ...values, minPrice: min, maxPrice: max });
      closeModal();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Transaction failed");
    }
  };

  const outcomeLabel = outcomeIsToken0 ? token0.symbol : token1.symbol;
  const showApprovals = missingApprovals.length > 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {isPoolStatusLoading ? (
        <p className="text-[14px] text-black-secondary">Checking pool status...</p>
      ) : (
        <p className="text-[14px] text-black-secondary">
          {isPoolInitialized
            ? "Add liquidity to the existing Uniswap V4 pool."
            : "Create the Uniswap V4 pool and add initial liquidity. Initial price is derived from your deposit."}
        </p>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="min-w-0">
          <div className="text-[14px] font-semibold mb-2">Min price ({outcomeLabel})</div>
          <Input
            type="number"
            min="0"
            max="1"
            step="any"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="min-w-0">
          <div className="text-[14px] font-semibold mb-2">Max price ({outcomeLabel})</div>
          <Input
            type="number"
            min="0"
            max="1"
            step="any"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="w-full"
          />
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
            onChange={(e) => handleAmountChange("amount1", e.target.value)}
            className="w-full"
          />
        </div>
      </div>

      {error || balanceError || priceRangeError ? (
        <p className="text-[14px] text-error-primary">{error || balanceError || priceRangeError}</p>
      ) : null}

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
