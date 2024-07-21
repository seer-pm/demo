import { useMissingTradeApproval, useQuoteTrade, useTrade } from "@/hooks/trade";
import { useTokenBalance } from "@/hooks/useTokenBalance";
import { SupportedChain } from "@/lib/chains";
import { COLLATERAL_TOKENS } from "@/lib/config";
import { Token, hasAltCollateral } from "@/lib/tokens";
import { displayBalance, isUndefined } from "@/lib/utils";
import { Trade } from "@swapr/sdk";
import clsx from "clsx";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Address, formatUnits, parseUnits } from "viem";
import { Alert } from "../Alert";
import { ApproveButton } from "../Form/ApproveButton";
import Button from "../Form/Button";
import Input from "../Form/Input";
import AltCollateralSwitch from "./AltCollateralSwitch";

interface SwapFormValues {
  type: "buy" | "sell";
  amount: string;
  useAltCollateral: boolean;
}

interface SwapTokensProps {
  account: Address | undefined;
  chainId: SupportedChain;
  outcomeText: string;
  outcomeToken: Token;
  hasEnoughLiquidity?: boolean;
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

function SwapButtons({
  account,
  trade,
  swapType,
  isDisabled,
  isLoading,
}: {
  account?: Address;
  trade: Trade;
  swapType: "buy" | "sell";
  isDisabled: boolean;
  isLoading: boolean;
}) {
  const missingApprovals = useMissingTradeApproval(account!, trade);

  if (!missingApprovals) {
    return null;
  }

  return (
    <div>
      {missingApprovals.length === 0 && (
        <Button
          variant="primary"
          type="submit"
          disabled={isDisabled}
          isLoading={isLoading}
          text={swapType === "buy" ? "Buy" : "Sell"}
        />
      )}
      {missingApprovals.length > 0 && (
        <div className="space-y-[8px]">
          {missingApprovals.map((approval) => (
            <ApproveButton
              key={approval.address}
              tokenAddress={approval.address}
              tokenName={approval.name}
              spender={approval.spender}
              amount={approval.amount}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function SwapTokens({ account, chainId, outcomeText, outcomeToken, hasEnoughLiquidity }: SwapTokensProps) {
  const [swapType, setSwapType] = useState<"buy" | "sell">("buy");
  const tabClick = (type: "buy" | "sell") => () => setSwapType(type);

  const useFormReturn = useForm<SwapFormValues>({
    mode: "all",
    defaultValues: {
      type: "buy",
      amount: "0",
      useAltCollateral: false,
    },
  });

  const {
    register,
    reset,
    formState: { isValid, dirtyFields },
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
    dirtyFields["amount"] && trigger("amount");
  }, [balance]);

  const {
    data: quoteData,
    isPending: quoteIsPending,
    fetchStatus: quoteFetchStatus,
    isError: quoteIsError,
  } = useQuoteTrade(chainId, account, amount, outcomeToken, selectedCollateral, swapType);

  const tradeTokens = useTrade(async () => {
    reset();
  });

  const onSubmit = async (_values: SwapFormValues) => {
    await tradeTokens.mutateAsync({
      trade: quoteData?.trade!,
      account: account!,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 bg-white p-[24px] drop-shadow">
      <div className="flex items-center space-x-[12px]">
        <div>
          <div className="w-[48px] h-[48px] rounded-full bg-purple-primary"></div>
        </div>
        <div className="text-[16px]">{outcomeText}</div>
      </div>

      {hasEnoughLiquidity === false && (
        <Alert type="warning">
          This outcome lacks sufficient liquidity for trading. You can mint tokens or{" "}
          <a
            href={`https://v3.swapr.eth.limo/#/add/${outcomeToken.address}/${COLLATERAL_TOKENS[chainId].primary.address}/enter-amounts`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-primary"
          >
            provide liquidity.
          </a>
        </Alert>
      )}

      <div className={clsx("space-y-5", hasEnoughLiquidity === false && "grayscale pointer-events-none")}>
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
              onClick={() => {
                setValue("amount", formatUnits(balance, sellToken.decimals), {
                  shouldValidate: true,
                  shouldDirty: true,
                });
              }}
            >
              Max
            </div>
          </div>
          <Input
            autoComplete="off"
            type="text"
            {...register("amount", {
              required: "This field is required.",
              validate: (v) => {
                if (Number.isNaN(Number(v)) || Number(v) <= 0) {
                  return "Amount must be greater than 0.";
                }

                const val = parseUnits(v, sellToken.decimals);

                if (val > balance) {
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
          {quoteData ? displayBalance(quoteData.value, quoteData.decimals) : 0}
        </div>

        {quoteIsError && <Alert type="error">Not enough liquidity</Alert>}

        <div className="flex justify-between">
          <AltCollateralSwitch {...register("useAltCollateral")} chainId={chainId} useWrappedToken={useWrappedToken} />
          <div className="text-[12px] text-[#999999]">Max slippage: 0.1%</div>
        </div>

        {quoteData?.trade ? (
          <SwapButtons
            account={account}
            trade={quoteData.trade}
            swapType={swapType}
            isDisabled={
              isUndefined(quoteData?.value) || quoteData?.value === 0n || !account || !isValid || tradeTokens.isPending
            }
            isLoading={
              tradeTokens.isPending || (!isUndefined(quoteData?.value) && quoteData.value > 0n && quoteIsPending)
            }
          />
        ) : quoteIsPending && quoteFetchStatus === "fetching" ? (
          <Button variant="primary" type="button" disabled={true} isLoading={true} text="" />
        ) : null}
      </div>
    </form>
  );
}
