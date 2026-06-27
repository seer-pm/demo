import Button from "@/components/Form/Button";
import Input from "@/components/Form/Input";
import AltCollateralSwitch from "@/components/Market/AltCollateralSwitch";
import { useMergePositions } from "@/hooks/useMergePositions";
import { getSplitMergeRedeemCollateral, useSelectedCollateral } from "@/hooks/useSelectedCollateral";
import { displayBalance } from "@/lib/utils";
import { useTokenBalance, useTokenBalances } from "@seer-pm/react";
import { useTokensInfo } from "@seer-pm/react";
import { Market } from "@seer-pm/sdk";
import { getRouterAddress } from "@seer-pm/sdk";
import clsx from "clsx";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Address, formatUnits, parseUnits } from "viem";
import { Alert } from "../Alert";
import { ApproveButton } from "../Form/ApproveButton";
import { SwitchChainButtonWrapper } from "../Form/SwitchChainButtonWrapper";

export interface MergeFormValues {
  amount: string;
  useAltCollateral: boolean;
}

interface MergeFormProps {
  account?: Address;
  market: Market;
}

function getMergePositions(market: Market, useAltCollateral: boolean): Address[] {
  if (market.type === "Generic") {
    return market.wrappedTokens;
  }

  // in a futarchy market we merge the first or the last two tokens
  return !useAltCollateral
    ? [market.wrappedTokens[0], market.wrappedTokens[1]]
    : [market.wrappedTokens[2], market.wrappedTokens[3]];
}

export function MergeForm({ account, market }: MergeFormProps) {
  const router = getRouterAddress(market);

  const { data: balances, isLoading: isLoadingBalances } = useTokenBalances(
    account,
    market.wrappedTokens,
    market.chainId,
  );
  const { data: tokensInfo = [], isLoading: isLoadingInfo } = useTokensInfo(market.wrappedTokens, market.chainId);
  const isLoading = isLoadingBalances || isLoadingInfo;
  const useFormReturn = useForm<MergeFormValues>({
    mode: "all",
    defaultValues: {
      amount: "",
    },
  });

  const {
    register,
    reset,
    formState: { isValid, dirtyFields },
    handleSubmit,
    watch,
    trigger,
    setValue,
  } = useFormReturn;

  const [useAltCollateral, amount] = watch(["useAltCollateral", "amount"]);

  const selectedCollateral = useSelectedCollateral(market, useAltCollateral);
  const { data: balance = BigInt(0) } = useTokenBalance(account, selectedCollateral?.address, market.chainId);

  const parsedAmount = parseUnits(amount ?? "0", selectedCollateral.decimals);

  useEffect(() => {
    dirtyFields["amount"] && trigger("amount");
  }, [balance]);

  const {
    mergePositions,
    approvals: { data: missingApprovals = [], isLoading: isLoadingApprovals },
  } = useMergePositions(
    {
      tokensAddresses: getMergePositions(market, useAltCollateral),
      account,
      spender: router,
      amounts: parsedAmount,
      chainId: market.chainId,
    },
    () => {
      reset();
    },
  );

  const onSubmit = async (/*values: MergeFormValues*/) => {
    await mergePositions.mutateAsync({
      router,
      market: market,
      amount: parsedAmount,
      collateralToken: getSplitMergeRedeemCollateral(market, selectedCollateral, useAltCollateral),
    });
  };

  const maxPositionAmount = balances?.reduce((min, curr) => (min < curr ? min : curr), balances?.[0] ?? 0n) ?? 0n;

  const currentAmountFloat = (): number => {
    const n = Number(amount);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  };
  const maxTokens = (): number => Number(formatUnits(maxPositionAmount, selectedCollateral.decimals));
  const setAmountTokens = (next: number) => {
    const max = maxTokens();
    const clamped = Math.max(0, Math.min(next, max));
    const formatted = clamped.toFixed(selectedCollateral.decimals).replace(/\.?0+$/, "") || "0";
    const dot = formatted.indexOf(".");
    const truncated = dot === -1 ? formatted : formatted.slice(0, dot + 3);
    setValue("amount", truncated, { shouldValidate: true, shouldDirty: true });
  };
  const addPercentOfBalance = (pct: number) => {
    setAmountTokens(currentAmountFloat() + maxTokens() * (pct / 100));
  };
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div>
        <div className="mb-4">
          <Alert type="info">
            <p className="text-[14px]">To merge, provide an equal number of tokens for each outcome.</p>
          </Alert>
        </div>
        <div className="text-[14px] mb-2">Amount</div>
        <div className="flex justify-between items-end gap-2 mb-2">
          <div className={clsx("text-[12px] text-black-secondary flex gap-1", isLoading ? "items-center" : "")}>
            Balance:{" "}
            <div>
              {isLoading ? (
                <div className="shimmer-container w-[80px] h-[13px]" />
              ) : (
                <div className="max-h-[80px] overflow-y-auto custom-scrollbar">
                  {balances && balances.length > 0
                    ? balances.map((balance, index) => {
                        return (
                          <div key={tokensInfo?.[index]?.address}>
                            {displayBalance(balance, 18, true)} {tokensInfo?.[index]?.symbol}
                          </div>
                        );
                      })
                    : 0}
                </div>
              )}
            </div>
          </div>
          <div className="quick-group flex-shrink-0">
            <button
              type="button"
              className="quick-btn quick-btn--full"
              onClick={() => setAmountTokens(maxTokens() / 2)}
            >
              HALF
            </button>
            <button type="button" className="quick-btn quick-btn--full" onClick={() => setAmountTokens(maxTokens())}>
              MAX
            </button>
          </div>
        </div>
        <div className="io-quick-actions mb-2">
          <div className="quick-group">
            {[1, 5, 10].map((n) => (
              <button
                key={`amount-${n}`}
                type="button"
                className="quick-btn quick-btn--dollar"
                onClick={() => setAmountTokens(currentAmountFloat() + n)}
              >
                +{n}
              </button>
            ))}
          </div>
          <div className="quick-group">
            {[1, 5, 10].map((pct) => (
              <button
                key={`pct-${pct}`}
                type="button"
                className="quick-btn quick-btn--pct"
                onClick={() => addPercentOfBalance(pct)}
              >
                +{pct}%
              </button>
            ))}
          </div>
        </div>
        <Input
          autoComplete="off"
          type="number"
          min="0"
          step="any"
          {...register("amount", {
            required: "This field is required.",
            // valueAsNumber: true,
            validate: (v) => {
              if (Number.isNaN(Number(v)) || Number(v) < 0) {
                return "Amount must be greater than 0.";
              }
              if (parseUnits(String(v), selectedCollateral.decimals) > maxPositionAmount) {
                return "Not enough balance.";
              }

              return true;
            },
          })}
          className="w-full"
          useFormReturn={useFormReturn}
        />
      </div>

      <AltCollateralSwitch {...register("useAltCollateral")} market={market} />

      {missingApprovals && (
        <SwitchChainButtonWrapper chainId={market.chainId}>
          {missingApprovals.length === 0 && (
            <Button
              variant="primary"
              type="submit"
              disabled={!isValid || parsedAmount === 0n || mergePositions.isPending || !account}
              isLoading={mergePositions.isPending || isLoadingApprovals}
              text="Merge"
            />
          )}
          {missingApprovals.length > 0 && parsedAmount <= maxPositionAmount && (
            <div className="space-y-[8px]">
              {missingApprovals.map((approval) => (
                <ApproveButton
                  key={approval.address}
                  tokenAddress={approval.address}
                  tokenName={approval.name}
                  spender={approval.spender}
                  amount={parsedAmount}
                  chainId={market.chainId}
                />
              ))}
            </div>
          )}
        </SwitchChainButtonWrapper>
      )}
    </form>
  );
}
