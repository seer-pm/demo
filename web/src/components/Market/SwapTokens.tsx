import { useCalculateSwap } from "@/hooks/useCalculateSwap";
import { useSwapTokens } from "@/hooks/useSwapTokens";
import { displayBalance } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { Address, TransactionReceipt } from "viem";
import Button from "../Form/Button";
import Input from "../Form/Input";

interface SwapFormValues {
  type: "buy" | "sell";
  amount: number;
}

interface SwapTokensProps {
  account: Address | undefined;
  chainId: number;
  pool: Address;
  outcomeToken: Address;
  outcomeText: string;
  swapType: "buy" | "sell";
  setSwapType: (type: "buy" | "sell") => void;
}

export function SwapTokens({
  account,
  chainId,
  pool,
  outcomeToken,
  outcomeText,
  swapType,
  setSwapType,
}: SwapTokensProps) {
  const tabClick = (type: "buy" | "sell") => () => setSwapType(type);

  const {
    register,
    reset,
    formState: { errors, isValid },
    handleSubmit,
    watch,
  } = useForm<SwapFormValues>({
    mode: "all",
    defaultValues: {
      type: "buy",
      amount: 0,
    },
  });

  const swapTokens = useSwapTokens((_receipt: TransactionReceipt) => {
    reset();
    alert("Tokens swaped!");
  });

  const [amount] = watch(["amount"]);

  const {
    data: swapData,
    isPending: calculateIsPending,
    isError: calculateIsError,
  } = useCalculateSwap(chainId, pool, amount, outcomeToken, swapType);

  const onSubmit = async (values: SwapFormValues) => {
    await swapTokens.mutateAsync({
      account: account!,
      chainId,
      amount: values.amount,
      type: values.type,
      amountOutMinimum: swapData?.output!,
      outcomeToken,
      pool,
      isMainCollateral: false, // TODO
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="font-bold text-center text-lg">{outcomeText}</div>
      <div role="tablist" className="tabs tabs-bordered">
        <button
          type="button"
          role="tab"
          className={`tab ${swapType === "buy" && "tab-active"}`}
          onClick={tabClick("buy")}
        >
          Buy
        </button>
        <button
          type="button"
          role="tab"
          className={`tab ${swapType === "sell" && "tab-active"}`}
          onClick={tabClick("sell")}
        >
          Sell
        </button>
      </div>

      <div className="space-y-2">
        <div className="font-bold">{swapType === "buy" ? "Amount" : "Shares"}</div>
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

              /*if (parseUnits(String(v), selectedCollateral.decimals) > balance) {
                return "Not enough balance.";
              }*/

              return true;
            },
          })}
          className="w-full md:w-2/3"
          errors={errors}
        />
      </div>

      <div className="flex space-x-2">
        <div>{swapType === "buy" ? "Shares" : "Amount"}:</div>
        <div>{swapData ? displayBalance(swapData.output, swapData.decimals) : 0}</div>
      </div>

      {calculateIsError && <div className="alert alert-error">Not enough liquidity</div>}

      <div>
        <Button
          className="btn btn-primary"
          type="submit"
          disabled={!!swapData?.output || !account || !isValid || swapTokens.isPending}
          isLoading={swapTokens.isPending || calculateIsPending}
          text={swapType === "buy" ? "Buy" : "Sell"}
        />
      </div>
    </form>
  );
}
