import Button from "@/components/Form/Button";
import Input from "@/components/Form/Input";
import AltCollateralSwitch from "@/components/Market/AltCollateralSwitch";
import { useMissingApprovals } from "@/hooks/useMissingApprovals";
import { useSplitPosition } from "@/hooks/useSplitPosition";
import { useTokenBalance } from "@/hooks/useTokenBalance";
import { CHAIN_ROUTERS, COLLATERAL_TOKENS } from "@/lib/config";
import { Token, hasAltCollateral } from "@/lib/tokens";
import { NATIVE_TOKEN } from "@/lib/utils";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Address, formatUnits, parseUnits } from "viem";
import { ApproveButton } from "../Form/ApproveButton";

export interface SplitFormValues {
  amount: number;
  useAltCollateral: boolean;
}

interface SplitFormProps {
  account?: Address;
  chainId: number;
  router: Address;
  conditionId: `0x${string}`;
  outcomeSlotCount: number;
}

export function SplitForm({ account, chainId, router, conditionId, outcomeSlotCount }: SplitFormProps) {
  const useFormReturn = useForm<SplitFormValues>({
    mode: "all",
    defaultValues: {
      amount: 0,
      useAltCollateral: false,
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

  const selectedCollateral = (
    hasAltCollateral(COLLATERAL_TOKENS[chainId].secondary) && useAltCollateral
      ? COLLATERAL_TOKENS[chainId].secondary
      : COLLATERAL_TOKENS[chainId].primary
  ) as Token;
  const { data: balance = BigInt(0) } = useTokenBalance(account, selectedCollateral?.address);

  const parsedAmount = parseUnits(String(amount || 0), selectedCollateral.decimals);
  const { data: missingApprovals = [] } = useMissingApprovals(
    selectedCollateral.address !== NATIVE_TOKEN ? [selectedCollateral.address] : [],
    account,
    router,
    parsedAmount,
  );

  useEffect(() => {
    dirtyFields["amount"] && trigger("amount");
  }, [balance, useAltCollateral]);

  const splitPosition = useSplitPosition((/*receipt: TransactionReceipt*/) => {
    reset();
  });

  const onSubmit = async (values: SplitFormValues) => {
    await splitPosition.mutateAsync({
      account: account!,
      router: router,
      conditionId,
      collateralToken: selectedCollateral.address,
      collateralDecimals: selectedCollateral.decimals,
      outcomeSlotCount,
      amount: values.amount,
      isMainCollateral: !useAltCollateral,
      routerType: CHAIN_ROUTERS[chainId!],
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <div className="text-[14px]">Amount</div>
          <div
            className="text-purple-primary cursor-pointer"
            onClick={() =>
              setValue("amount", Number(formatUnits(balance, selectedCollateral.decimals)), {
                shouldValidate: true,
                shouldDirty: true,
              })
            }
          >
            Max
          </div>
        </div>
        <Input
          autoComplete="off"
          type="text"
          {...register("amount", {
            required: "This field is required.",
            valueAsNumber: true,
            validate: (v) => {
              if (Number.isNaN(Number(v)) || Number(v) <= 0) {
                return "Amount must be greater than 0.";
              }

              if (parseUnits(String(v), selectedCollateral.decimals) > balance) {
                return "Not enough balance.";
              }

              return true;
            },
          })}
          className="w-full"
          useFormReturn={useFormReturn}
        />
      </div>

      <AltCollateralSwitch {...register("useAltCollateral")} chainId={chainId} />

      {missingApprovals && (
        <div>
          {missingApprovals.length === 0 && (
            <Button
              variant="primary"
              type="submit"
              disabled={!isValid || splitPosition.isPending || !account}
              isLoading={splitPosition.isPending}
              text="Mint"
            />
          )}
          {missingApprovals.length > 0 && (
            <div className="space-y-[8px]">
              <ApproveButton
                tokenAddress={missingApprovals[0].address}
                tokenName={missingApprovals[0].name}
                router={router}
                amount={parsedAmount}
              />
            </div>
          )}
        </div>
      )}
    </form>
  );
}
