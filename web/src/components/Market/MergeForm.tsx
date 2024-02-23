import Button from "@/components/Form/Button";
import Input from "@/components/Form/Input";
import AltCollateralSwitch from "@/components/Market/AltCollateralSwitch";
import { useMergePositions } from "@/hooks/useMergePositions";
import { useTokenBalance } from "@/hooks/useTokenBalance";
import { Position, useUserPositions } from "@/hooks/useUserPositions";
import { CHAIN_ROUTERS, COLLATERAL_TOKENS } from "@/lib/config";
import { Token, hasAltCollateral } from "@/lib/tokens";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Address, TransactionReceipt, parseUnits } from "viem";

export interface MergeFormValues {
  amount: number;
  useAltCollateral: boolean;
}

interface MergeFormProps {
  account?: Address;
  chainId: number;
  router: Address;
  conditionId: `0x${string}`;
  outcomeSlotCount: number;
}

export function MergeForm({ account, chainId, router, conditionId, outcomeSlotCount }: MergeFormProps) {
  const { data: positions = [] } = useUserPositions(account, chainId, router, conditionId, outcomeSlotCount);

  const {
    register,
    reset,
    formState: { errors, isValid },
    handleSubmit,
    watch,
    trigger,
  } = useForm<MergeFormValues>({
    mode: "all",
    defaultValues: {
      amount: 0,
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

  const mergePositions = useMergePositions((_receipt: TransactionReceipt) => {
    reset();
    alert("Position merged!");
  });

  const onSubmit = async (values: MergeFormValues) => {
    await mergePositions.mutateAsync({
      account: account!,
      router,
      conditionId,
      mainCollateralToken: COLLATERAL_TOKENS[chainId].primary.address,
      collateralToken: selectedCollateral.address,
      collateralDecimals: selectedCollateral.decimals,
      outcomeSlotCount,
      amount: values.amount,
      isMainCollateral: !useAltCollateral,
      routerType: CHAIN_ROUTERS[chainId!],
    });
  };

  const minPositionAmount = positions.reduce((acum, curr: Position) => {
    if (curr.balance > acum) {
      // biome-ignore lint/style/noParameterAssign:
      acum = curr.balance;
    }
    return acum;
  }, BigInt(0));

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

              if (parseUnits(String(v), selectedCollateral.decimals) > minPositionAmount) {
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
          disabled={!isValid || mergePositions.isPending || !account}
          isLoading={mergePositions.isPending}
          text="Submit"
        />
      </div>
    </form>
  );
}
