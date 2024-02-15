import { Market } from "@/hooks/useMarket";
import { useState } from "react";
import Button from "../Form/Button";
import Input from "../Form/Input";
import { useForm } from "react-hook-form";
//import { TransactionReceipt } from "viem";
import { useCalculateSwap } from "@/hooks/useCalculateSwap";
import { useSwapTokens } from "@/hooks/useSwapTokens";

interface SwapFormValues {
    type: 'buy' | 'sell';
    outcomeIndex: number;
    amount: number;
  }

export function SwapTokens({ market, chainId }: { market: Market, chainId: number }) {
  const [activeTab, setActiveTab] = useState("buy");

  const tabClick = (type: string) => () => setActiveTab(type);

  const {
    register,
    reset,
    formState: { errors, isValid },
    handleSubmit,
    setValue,
    watch
  } = useForm<SwapFormValues>({
    mode: "all",
    defaultValues: {
      type: "buy",
      outcomeIndex: 0,
      amount: 0,
    },
  });

  const swapTokens = useSwapTokens((/*_receipt: TransactionReceipt*/) => {
    reset();
    alert("Tokens swaped!");
  });

  const [amount, outcomeIndex] = watch(['amount', 'outcomeIndex']);

  const {data: swapOutput = 0n} = useCalculateSwap(chainId, market.pools[amount], BigInt(outcomeIndex), true, false, 0n)

  const onSubmit = async (/*values: SwapFormValues*/) => {
    // TODO: swap tokens
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div role="tablist" className="tabs tabs-bordered">
        <a
          role="tab"
          className={`tab ${activeTab === "buy" && "tab-active"}`}
          onClick={tabClick("buy")}
        >
          Buy
        </a>
        <a
          role="tab"
          className={`tab ${activeTab === "sell" && "tab-active"}`}
          onClick={tabClick("sell")}
        >
          Sell
        </a>
      </div>

      <div className="text-bold">Outcome</div>

      <div className="grid grid-cols-2 gap-4">
        {market.outcomes.map((outcome, index) => (
          <Button text={outcome} key={outcome} onClick={() => setValue('outcomeIndex', index)}></Button>
        ))}
      </div>

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

      <div>
        <div>Shares</div>
        <div>{swapOutput.toString()}</div>
      </div>

      <div>
            <Button
              className="btn btn-primary"
              type="submit"
              disabled={!isValid || swapTokens.isPending}
              isLoading={swapTokens.isPending}
              text="Swap"
            />
          </div>
    </form>
  );
}
