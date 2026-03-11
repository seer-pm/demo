"use client";

import Button from "@/components/Form/Button";
import Input from "@/components/Form/Input";
import { CollateralDropdown } from "@/components/Market/CollateralDropdown";
import { usePsm3Preview, usePsm3Swap } from "@/hooks/usePsm3Swap";
import { base, optimism } from "@/lib/chains";
import { PSM3_ADDRESS } from "@/lib/config";
import { displayBalance } from "@/lib/utils";
import { useTokenBalance, useTokensInfo } from "@seer-pm/react";
import { COLLATERAL_TOKENS, GetTokenResult, SupportedChain, Token } from "@seer-pm/sdk";
import clsx from "clsx";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { formatUnits, parseUnits } from "viem";
import { useAccount } from "wagmi";

const SLIPPAGE_BPS = 50n; // 0.5%

interface TradeCollateralWidgetProps {
  chainId: SupportedChain;
}

export function TradeCollateralWidget({ chainId }: TradeCollateralWidgetProps) {
  const config = COLLATERAL_TOKENS[chainId];
  const isOptimismOrBase = chainId === optimism.id || chainId === base.id;

  // Optimism/Base: [primary (sUSDS), USDS, USDC]
  const swapTokens = config.swap;
  const tokenAddresses = useMemo(() => {
    if (isOptimismOrBase && swapTokens) {
      return [config.primary.address, ...swapTokens.map((t) => t.address)];
    }
    return [];
  }, [config, isOptimismOrBase, swapTokens]);

  const { data: collateralTokens } = useTokensInfo(tokenAddresses.length > 0 ? tokenAddresses : undefined, chainId);

  const [payIndex, setPayIndex] = useState(0);
  const [getAddress, setGetAddress] = useState<string | undefined>();

  const payToken = collateralTokens?.[payIndex];

  const { address } = useAccount();
  const { data: payBalance = BigInt(0), isFetching: isFetchingPayBalance } = useTokenBalance(
    address,
    payToken?.address,
    chainId,
  );

  const useFormReturn = useForm<{ amount: string; amountOut: string }>({
    mode: "all",
    defaultValues: { amount: "", amountOut: "" },
  });
  const { register, watch, setValue } = useFormReturn;
  const amountStr = watch("amount");

  const amountInBigInt = useMemo(() => {
    if (!amountStr || !payToken) return undefined;
    try {
      const parsed = parseUnits(amountStr, payToken.decimals);
      return parsed > 0n ? parsed : undefined;
    } catch {
      return undefined;
    }
  }, [amountStr, payToken]);

  const setPayToken = (token: Token) => {
    const i = collateralTokens?.findIndex((t) => t.address === token.address) ?? -1;
    setPayIndex(i >= 0 ? i : 0);
    setGetAddress(undefined);
  };

  const setGetToken = (token: Token) => {
    setGetAddress(token.address);
  };

  const getOptions: GetTokenResult[] = useMemo(() => {
    if (!collateralTokens || !payToken) {
      return [];
    }

    // Optimism / Base rules:
    // 3) sUSDS => USDS and USDC
    // 4) USDS  => sUSDS
    // 5) USDC  => sUSDS
    if (chainId === optimism.id || chainId === base.id) {
      const bySymbol = (symbol: string) => collateralTokens.find((t) => t.symbol === symbol);
      const sUSDS = bySymbol("sUSDS");
      const USDS = bySymbol("USDS");
      const USDC = bySymbol("USDC");

      if (payToken.symbol === "sUSDS") {
        return [USDS, USDC].filter(Boolean) as GetTokenResult[];
      }

      if (payToken.symbol === "USDS" || payToken.symbol === "USDC") {
        return [sUSDS].filter(Boolean) as GetTokenResult[];
      }
    }

    return [];
  }, [collateralTokens, payToken, chainId]);

  useEffect(() => {
    // ensure selected "you will get" token is valid for current payToken
    if (!getOptions || getOptions.length === 0) {
      setGetAddress(undefined);
      return;
    }

    if (!getAddress || !getOptions.some((t) => t.address === getAddress)) {
      setGetAddress(getOptions[0].address);
    }
  }, [getOptions, getAddress]);

  const getToken = useMemo(() => getOptions.find((t) => t.address === getAddress), [getOptions, getAddress]);

  const canUsePsm3 = isOptimismOrBase && !!PSM3_ADDRESS[chainId] && !!payToken && !!getToken;
  const { data: previewAmountOut, isLoading: isPreviewLoading } = usePsm3Preview(
    chainId,
    canUsePsm3 ? payToken!.address : undefined,
    canUsePsm3 ? getToken!.address : undefined,
    canUsePsm3 ? amountInBigInt : undefined,
  );

  const psm3Swap = usePsm3Swap();

  useEffect(() => {
    if (!getToken) return;
    if (!amountStr || !amountInBigInt) {
      setValue("amountOut", "");
      return;
    }
    if (previewAmountOut === undefined) return;
    const formatted = formatUnits(previewAmountOut, getToken.decimals);
    setValue("amountOut", formatted);
  }, [previewAmountOut, getToken, setValue, amountStr, amountInBigInt]);

  if (!collateralTokens || collateralTokens.length < 2) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-[#2222220d] dark:border-neutral bg-base-100 p-5 space-y-5 max-w-[480px]">
      <form className="space-y-5">
        <div className={clsx("rounded-[12px] p-4 space-y-2 min-h-[120px]", "border border-[#2222220d] bg-base-200/80")}>
          <p className="text-base-content/70">You pay</p>
          <div className="flex justify-between items-start">
            <Input
              autoComplete="off"
              type="number"
              step="any"
              min="0"
              {...register("amount")}
              className="w-full min-w-[50px] p-0 h-auto text-[24px] !bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none border-0 focus:outline-transparent focus:ring-0"
              placeholder="0"
              useFormReturn={useFormReturn}
            />
            {payToken && (
              <CollateralDropdown
                selectedCollateral={payToken}
                setSelectedCollateral={setPayToken}
                collateralTokens={collateralTokens}
              />
            )}
          </div>
          <div className="flex items-center justify-between gap-2">
            <div>
              {isFetchingPayBalance ? (
                <div className="shimmer-container w-[80px] h-[13px]" />
              ) : (
                payToken && (
                  <p className="text-[14px] font-semibold text-base-content/70">
                    {displayBalance(payBalance, payToken.decimals)} {payToken.symbol}
                  </p>
                )
              )}
            </div>
            <div className="flex items-center gap-1">
              {([25, 50, 100] as const).map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => {
                    if (!payToken || !payBalance || payBalance === 0n) return;
                    const amount = (payBalance * BigInt(pct)) / 100n;
                    setValue("amount", formatUnits(amount, payToken.decimals));
                  }}
                  disabled={!payToken || !payBalance || payBalance === 0n}
                  className="text-[12px] font-semibold text-base-content/70 rounded-lg border border-[#2222220d] dark:border-neutral py-1.5 px-2.5 bg-base-200/80 hover:bg-base-300/60 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {pct}%
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className={clsx("rounded-[12px] p-4 space-y-2 min-h-[120px]", "border border-[#2222220d] bg-base-200/80")}>
          <p className="text-base-content/70">You will get</p>
          <div className="flex justify-between items-start">
            <Input
              autoComplete="off"
              type="number"
              step="any"
              min="0"
              readOnly={canUsePsm3}
              {...register("amountOut")}
              className="w-full min-w-[50px] p-0 h-auto text-[24px] !bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none border-0 focus:outline-transparent focus:ring-0"
              placeholder="0"
              useFormReturn={useFormReturn}
            />
            {getToken && (
              <CollateralDropdown
                selectedCollateral={getToken}
                setSelectedCollateral={setGetToken}
                collateralTokens={getOptions}
              />
            )}
          </div>
        </div>

        <Button
          variant="primary"
          type="button"
          className="w-full"
          disabled={
            !address ||
            !amountInBigInt ||
            !previewAmountOut ||
            !payToken ||
            !getToken ||
            psm3Swap.isPending ||
            (payBalance !== undefined && amountInBigInt > payBalance)
          }
          isLoading={psm3Swap.isPending || isPreviewLoading}
          text="Swap"
          onClick={() => {
            if (!address || !amountInBigInt || !previewAmountOut || !payToken || !getToken) return;
            const minAmountOut = (previewAmountOut * (10000n - SLIPPAGE_BPS)) / 10000n;
            psm3Swap
              .mutateAsync({
                chainId,
                assetIn: payToken.address,
                assetOut: getToken.address,
                amountIn: amountInBigInt,
                minAmountOut,
              })
              .then(() => {
                setValue("amount", "");
                setValue("amountOut", "");
              })
              .catch(() => {
                // errors are already handled by toastifyTx
              });
          }}
        />
      </form>
    </div>
  );
}
