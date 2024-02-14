import Button from "@/components/Form/Button";
import Input from "@/components/Form/Input";
import AltCollateralSwitch from "@/components/Market/AltCollateralSwitch";
import { useSplitPosition } from "@/hooks/useSplitPosition";
import { useTokenBalance } from "@/hooks/useTokenBalance";
import { CHAIN_ROUTERS, COLLATERAL_TOKENS } from "@/lib/config";
import { Token, hasAltCollateral } from "@/lib/tokens";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Address, TransactionReceipt, parseUnits } from "viem";

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
  const {
    register,
    reset,
    formState: { errors, isValid },
    handleSubmit,
    watch,
    trigger,
  } = useForm<SplitFormValues>({
    mode: "all",
    defaultValues: {
      amount: 0,
      useAltCollateral: false,
    },
  });

  const useAltCollateral = watch("useAltCollateral");

  const selectedCollateral = (
    hasAltCollateral(COLLATERAL_TOKENS[chainId].secondary) && useAltCollateral
      ? COLLATERAL_TOKENS[chainId].secondary
      : COLLATERAL_TOKENS[chainId].primary
  ) as Token;
  const { data: balance = BigInt(0) } = useTokenBalance(account, selectedCollateral?.address);

  useEffect(() => {
    trigger("amount");
  }, [balance]);

  const splitPosition = useSplitPosition((_receipt: TransactionReceipt) => {
    reset();
    alert("Position split!");
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
        <div className="font-bold">Amount</div>
        <Input
          autoComplete="off"
          type="number"
          step="any"
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
          className="w-full md:w-2/3"
          errors={errors}
        />
      </div>

      <AltCollateralSwitch {...register("useAltCollateral")} chainId={chainId} />

      <div>
        <Button
          className="btn btn-primary"
          type="submit"
          disabled={!isValid || splitPosition.isPending || !account}
          isLoading={splitPosition.isPending}
          text="Submit"
        />
      </div>
    </form>
  );
}
