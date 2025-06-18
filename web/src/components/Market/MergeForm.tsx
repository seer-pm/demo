import Button from "@/components/Form/Button";
import Input from "@/components/Form/Input";
import AltCollateralSwitch from "@/components/Market/AltCollateralSwitch";
import { useMergePositions } from "@/hooks/useMergePositions";
import { useSelectedCollateral } from "@/hooks/useSelectedCollateral";
import { useTokenBalance, useTokenBalances } from "@/hooks/useTokenBalance";
import { useTokensInfo } from "@/hooks/useTokenInfo";
import { getRouterAddress } from "@/lib/config";
import { Market } from "@/lib/market";
import { displayBalance } from "@/lib/utils";
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
      tokensAddresses: market.wrappedTokens,
      account,
      spender: router,
      amounts: parsedAmount,
      chainId: market.chainId,
    },
    (/*receipt: TransactionReceipt*/) => {
      reset();
    },
  );

  const onSubmit = async (/*values: MergeFormValues*/) => {
    await mergePositions.mutateAsync({
      router,
      market: market,
      amount: parsedAmount,
      collateralToken:
        market.type === "Futarchy"
          ? selectedCollateral.address
          : !useAltCollateral
            ? selectedCollateral.address
            : undefined,
    });
  };

  const maxPositionAmount = balances?.reduce((min, curr) => (min < curr ? min : curr), balances?.[0] ?? 0n) ?? 0n;
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div>
        <div className="mb-4">
          <Alert type="info">
            <p className="text-[14px]">To merge, provide an equal number of tokens for each outcome.</p>
          </Alert>
        </div>
        <div className="flex justify-between items-center">
          <div className="text-[14px]">Amount</div>
          <div
            className="text-purple-primary cursor-pointer"
            onClick={() => {
              setValue("amount", formatUnits(maxPositionAmount, selectedCollateral.decimals), {
                shouldValidate: true,
                shouldDirty: true,
              });
            }}
          >
            Max
          </div>
        </div>
        <div className={clsx("text-[12px] text-black-secondary mb-2 flex gap-1", isLoading ? "items-center" : "")}>
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
                />
              ))}
            </div>
          )}
        </SwitchChainButtonWrapper>
      )}
    </form>
  );
}
