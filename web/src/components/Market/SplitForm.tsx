import Button from "@/components/Form/Button";
import Input from "@/components/Form/Input";
import AltCollateralSwitch from "@/components/Market/AltCollateralSwitch";
import { useCollateralsInfo } from "@/hooks/useCollateralsInfo";
import { useERC20Balance } from "@/hooks/useERC20Balance";
import { useSplitPosition } from "@/hooks/useSplitPosition";
import { CHAIN_ROUTERS } from "@/lib/config";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Address, TransactionReceipt, parseUnits } from "viem";
import { useAccount } from "wagmi";
import { Spinner } from "../Spinner";

export interface SplitFormValues {
  amount: number;
  useAltCollateral: boolean;
}

interface SplitFormProps {
  account?: Address;
  router: Address;
  conditionId: `0x${string}`;
  collateralToken: Address;
  outcomeSlotCount: number;
}

export function SplitForm({ account, router, conditionId, outcomeSlotCount }: SplitFormProps) {
  const { chainId } = useAccount();
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

  const { data: collaterals = [] } = useCollateralsInfo(chainId);

  const altCollateralEnabled = collaterals.length > 1;

  const useAltCollateral = watch("useAltCollateral");

  const selectedCollateral = altCollateralEnabled && useAltCollateral ? collaterals[1] : collaterals[0];
  const { data: balance = BigInt(0) } = useERC20Balance(account, selectedCollateral?.address);

  useEffect(() => {
    trigger("amount");
  }, [balance]);

  const splitPosition = useSplitPosition((_receipt: TransactionReceipt) => {
    reset();
    alert("Position split!");
  });

  if (collaterals.length === 0) {
    return <Spinner />;
  }

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

      {altCollateralEnabled && <AltCollateralSwitch {...register("useAltCollateral")} altCollateral={collaterals[1]} />}

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
