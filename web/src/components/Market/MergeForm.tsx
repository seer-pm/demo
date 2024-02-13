import Button from "@/components/Form/Button";
import Input from "@/components/Form/Input";
import AltCollateralSwitch from "@/components/Market/AltCollateralSwitch";
import { useCollateralsInfo } from "@/hooks/useCollateralsInfo";
import { useERC20Balance } from "@/hooks/useERC20Balance";
import { useMergePositions } from "@/hooks/useMergePositions";
import { Position, usePositions } from "@/hooks/usePositions";
import { CHAIN_ROUTERS } from "@/lib/config";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Address, TransactionReceipt, parseUnits } from "viem";
import { useAccount } from "wagmi";
import { Spinner } from "../Spinner";

export interface MergeFormValues {
  amount: number;
  useAltCollateral: boolean;
}

interface MergeFormProps {
  account?: Address;
  router: Address;
  conditionId: `0x${string}`;
  conditionalTokens: Address;
  collateralToken: Address;
  outcomeSlotCount: number;
}

export function MergeForm({
  account,
  router,
  conditionId,
  conditionalTokens,
  collateralToken,
  outcomeSlotCount,
}: MergeFormProps) {
  const { chainId } = useAccount();
  const { data: positions = [] } = usePositions(
    account,
    router,
    conditionId,
    conditionalTokens,
    collateralToken,
    outcomeSlotCount,
  );

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

  const { data: collaterals = [] } = useCollateralsInfo(chainId);

  const altCollateralEnabled = collaterals.length > 1;

  const useAltCollateral = watch("useAltCollateral");

  const selectedCollateral = altCollateralEnabled && useAltCollateral ? collaterals[1] : collaterals[0];
  const { data: balance = BigInt(0) } = useERC20Balance(account, selectedCollateral?.address);

  useEffect(() => {
    trigger("amount");
  }, [balance]);

  const mergePositions = useMergePositions((_receipt: TransactionReceipt) => {
    reset();
    alert("Position merged!");
  });

  if (collaterals.length === 0) {
    return <Spinner />;
  }

  const onSubmit = async (values: MergeFormValues) => {
    await mergePositions.mutateAsync({
      account: account!,
      router,
      conditionId,
      mainCollateralToken: collaterals[0].address,
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

      {altCollateralEnabled && <AltCollateralSwitch {...register("useAltCollateral")} />}

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
