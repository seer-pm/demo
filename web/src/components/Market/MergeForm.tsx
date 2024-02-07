import Button from "@/components/Form/Button";
import Input from "@/components/Form/Input";
import { useMergePositions } from "@/hooks/useMergePositions";
import { Position } from "@/hooks/usePositions";
import { useForm } from "react-hook-form";
import { Address, TransactionReceipt, parseUnits } from "viem";

interface MergeFormValues {
  amount: number;
}

interface MergeFormProps {
  account?: Address;
  conditionalTokens: Address;
  conditionId: `0x${string}`;
  collateralToken: Address;
  collateralDecimals: number;
  outcomeSlotCount: number;
  positions: Position[];
}

export function MergeForm({
  account,
  conditionalTokens,
  conditionId,
  collateralToken,
  collateralDecimals,
  outcomeSlotCount,
  positions,
}: MergeFormProps) {
  const {
    register,
    reset,
    formState: { errors, isValid },
    handleSubmit,
  } = useForm<MergeFormValues>({
    mode: "all",
    defaultValues: {
      amount: 0,
    },
  });

  const mergePositions = useMergePositions((_receipt: TransactionReceipt) => {
    reset();
    alert("Position merged!");
  });

  const onSubmit = async (values: MergeFormValues) => {
    await mergePositions.mutateAsync({
      account: account!,
      conditionalTokens,
      conditionId,
      collateralToken,
      collateralDecimals,
      outcomeSlotCount,
      amount: values.amount,
    });
  };

  const minPositionAmount = positions.reduce((acum, curr) => {
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
          {...register("amount", {
            required: "This field is required.",
            valueAsNumber: true,
            validate: (v) => {
              if (Number.isNaN(Number(v)) || Number(v) < 0) {
                return "Amount must be greater than 0.";
              }

              if (parseUnits(String(v), collateralDecimals) > minPositionAmount) {
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
          disabled={!isValid || mergePositions.isPending || !account}
          isLoading={mergePositions.isPending}
          text="Submit"
        />
      </div>
    </form>
  );
}
