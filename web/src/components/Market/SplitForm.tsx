import Button from "@/components/Form/Button";
import Input from "@/components/Form/Input";
import { useERC20Balance } from "@/hooks/useERC20Balance";
import { useSplitPosition } from "@/hooks/useSplitPosition";
import { useForm } from "react-hook-form";
import { Address, TransactionReceipt, parseUnits } from "viem";

interface SplitFormValues {
  amount: number;
}

interface SplitFormProps {
  account?: Address;
  router: Address;
  conditionId: `0x${string}`;
  collateralToken: Address;
  collateralDecimals: number;
  outcomeSlotCount: number;
}

export function SplitForm({
  account,
  router,
  conditionId,
  collateralToken,
  collateralDecimals,
  outcomeSlotCount,
}: SplitFormProps) {
  const {
    register,
    reset,
    formState: { errors, isValid },
    handleSubmit,
  } = useForm<SplitFormValues>({
    mode: "all",
    defaultValues: {
      amount: 0,
    },
  });

  const { data: balance = BigInt(0) } = useERC20Balance(account, collateralToken);

  const splitPosition = useSplitPosition((_receipt: TransactionReceipt) => {
    reset();
    alert("Position split!");
  });

  const onSubmit = async (values: SplitFormValues) => {
    await splitPosition.mutateAsync({
      account: account!,
      router: router,
      conditionId,
      collateralToken,
      collateralDecimals,
      outcomeSlotCount,
      amount: values.amount,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-2">
        <div className="font-bold">Amount</div>
        <Input
          autoComplete="off"
          type="number"
          {...register("amount", {
            required: "This field is required.",
            valueAsNumber: true,
            validate: (v) => {
              if (Number.isNaN(Number(v)) || Number(v) < 0) {
                return "Amount must be greater than 0.";
              }

              if (parseUnits(String(v), collateralDecimals) > balance) {
                return "Not enough balance.";
              }

              return true;
            },
          })}
          className="w-full md:w-2/3"
          errors={errors}
        />
      </div>

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
