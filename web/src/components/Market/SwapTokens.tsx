import { useCalculateSwap } from "@/hooks/useCalculateSwap";
import { useSwapTokens } from "@/hooks/useSwapTokens";
import { useTokenBalance } from "@/hooks/useTokenBalance";
import { SupportedChain } from "@/lib/chains";
import { COLLATERAL_TOKENS } from "@/lib/config";
import { Token, hasAltCollateral } from "@/lib/tokens";
import { displayBalance, isUndefined } from "@/lib/utils";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Address, formatUnits, parseUnits } from "viem";
import { Alert } from "../Alert";
import Button from "../Form/Button";
import Input from "../Form/Input";
import AltCollateralSwitch from "./AltCollateralSwitch";

interface SwapFormValues {
  type: "buy" | "sell";
  amount: number;
  useAltCollateral: boolean;
}

interface SwapTokensProps {
  account: Address | undefined;
  chainId: SupportedChain;
  outcomeText: string;
  outcomeToken: Token;
}

function getSelectedCollateral(chainId: SupportedChain, useAltCollateral: boolean, useWrappedToken: boolean): Token {
  if (hasAltCollateral(COLLATERAL_TOKENS[chainId].secondary) && useAltCollateral) {
    if (useWrappedToken && COLLATERAL_TOKENS[chainId].secondary?.wrapped) {
      return COLLATERAL_TOKENS[chainId].secondary?.wrapped as Token;
    }

    return COLLATERAL_TOKENS[chainId].secondary as Token;
  }

  return COLLATERAL_TOKENS[chainId].primary;
}

export function SwapTokens({ account, chainId, outcomeText, outcomeToken }: SwapTokensProps) {
  const [swapType, setSwapType] = useState<"buy" | "sell">("buy");
  const tabClick = (type: "buy" | "sell") => () => setSwapType(type);

  const useFormReturn = useForm<SwapFormValues>({
    mode: "all",
    defaultValues: {
      type: "buy",
      amount: 0,
      useAltCollateral: false,
    },
  });

  const {
    register,
    reset,
    formState: { isValid },
    handleSubmit,
    watch,
    setValue,
    trigger,
  } = useFormReturn;

  const [amount, useAltCollateral] = watch(["amount", "useAltCollateral"]);

  const useWrappedToken = true;

  const selectedCollateral = getSelectedCollateral(chainId, useAltCollateral, useWrappedToken);
  const sellToken = swapType === "buy" ? selectedCollateral : outcomeToken;
  const { data: balance = BigInt(0) } = useTokenBalance(account, sellToken.address);

  useEffect(() => {
    trigger("amount");
  }, [balance]);

  const swapTokens = useSwapTokens((/*orderId: string*/) => {
    reset();
  });

  const {
    data: swapData,
    isPending: calculateIsPending,
    isError: calculateIsError,
  } = useCalculateSwap(chainId, account, amount, outcomeToken, selectedCollateral, swapType);

  const onSubmit = async (_values: SwapFormValues) => {
    const orderId = await swapTokens.mutateAsync({
      account: account!,
      chainId,
      quote: swapData?.quote!,
    });
    console.log(`https://explorer.cow.fi/gc/orders/${orderId}?tab=overview`);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 bg-white p-[24px] drop-shadow">
      <div className="flex items-center space-x-[12px]">
        <div>
          <div className="w-[48px] h-[48px] rounded-full bg-purple-primary"></div>
        </div>
        <div className="text-[16px]">{outcomeText}</div>
      </div>

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
        <div className="flex justify-between items-center">
          <div className="text-[14px]">{swapType === "buy" ? "Amount" : "Shares"}</div>
          <div
            className="text-purple-primary cursor-pointer"
            onClick={() => setValue("amount", Number(formatUnits(balance, sellToken.decimals)))}
          >
            Max
          </div>
        </div>
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

              if (parseUnits(String(v), sellToken.decimals) > balance) {
                return "Not enough balance.";
              }

              return true;
            },
          })}
          className="w-full"
          useFormReturn={useFormReturn}
        />
      </div>

      <div className="flex space-x-2 text-purple-primary">
        {swapType === "buy" ? "Expected shares" : "Expected amount"} ={" "}
        {swapData ? displayBalance(swapData.value, swapData.decimals) : 0}
      </div>

      {calculateIsError && <Alert type="error">Not enough liquidity</Alert>}

      <div className="flex justify-between">
        <AltCollateralSwitch {...register("useAltCollateral")} chainId={chainId} useWrappedToken={useWrappedToken} />
        <div className="text-[12px] text-[#999999]">Max slippage: 0.1%</div>
      </div>

      <div>
        <Button
          variant="primary"
          type="submit"
          disabled={
            isUndefined(swapData?.value) || swapData?.value === 0n || !account || !isValid || swapTokens.isPending
          }
          isLoading={
            swapTokens.isPending || (!isUndefined(swapData?.value) && swapData.value > 0n && calculateIsPending)
          }
          text={swapType === "buy" ? "Buy" : "Sell"}
        />
      </div>
    </form>
  );
}
