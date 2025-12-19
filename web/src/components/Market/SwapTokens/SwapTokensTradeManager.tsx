import { useConvertToShares } from "@/hooks/trade/useShareAssetRatio";
import { useTradeManager } from "@/hooks/trade/useTradeManager";
import { useTradeQuoter } from "@/hooks/trade/useTradeQuoter";
import { useGlobalState } from "@/hooks/useGlobalState";
import { useModal } from "@/hooks/useModal";
import { useTokenBalance } from "@/hooks/useTokenBalance";
import { useTokenInfo } from "@/hooks/useTokenInfo";
import { COLLATERAL_TOKENS } from "@/lib/config";
import { Parameter } from "@/lib/icons";
import { Market } from "@/lib/market";
import { Token } from "@/lib/tokens";
import { NATIVE_TOKEN, displayBalance } from "@/lib/utils";
import clsx from "clsx";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Address, formatUnits, parseUnits, zeroAddress } from "viem";
import { useAccount } from "wagmi";
import { Alert } from "../../Alert";
import Input from "../../Form/Input";
import AltCollateralSwitch from "../AltCollateralSwitch";
import SwapTokensMaxSlippage from "./SwapTokensMaxSlippage";
import { SwapTokensTradeManagerConfirmation } from "./SwapTokensTradeManagerConfirmation";
import SwapButtonsTradeManager from "./components/SwapButtonsTradeManager";

interface SwapFormValues {
  type: "buy" | "sell";
  amount: string;
  isUseNativeToken: boolean;
}

interface SwapTokensProps {
  market: Market;
  swapType: "buy" | "sell";
  outcomeToken: Token;
  isUseTradeManager: boolean;
  setUseTradeManager: React.Dispatch<React.SetStateAction<boolean>>;
}

export function SwapTokensTradeManager({
  market,
  swapType,
  outcomeToken,
  isUseTradeManager,
  setUseTradeManager,
}: SwapTokensProps) {
  const [isShowMaxSlippage, setShowMaxSlippage] = useState(false);
  const maxSlippage = useGlobalState((state) => state.maxSlippage);
  const useFormReturn = useForm<SwapFormValues>({
    mode: "all",
    defaultValues: {
      type: "buy",
      amount: "0",
      isUseNativeToken: false,
    },
  });
  const { address: account } = useAccount();
  const { data: parentCollateral } = useTokenInfo(
    market.parentMarket.id !== zeroAddress ? market.collateralToken : undefined,
    market.chainId,
  );
  const {
    register,
    reset,
    formState: { isValid, dirtyFields },
    handleSubmit,
    watch,
    setValue,
    trigger,
  } = useFormReturn;

  const [amount, isUseNativeToken] = watch(["amount", "isUseNativeToken"]);
  const {
    Modal: ConfirmSwapModal,
    openModal: openConfirmSwapModal,
    closeModal: closeConfirmSwapModal,
  } = useModal("confirm-swap-modal");

  const selectedCollateral = isUseNativeToken
    ? { address: NATIVE_TOKEN as Address, symbol: "xDai", decimals: 18 }
    : COLLATERAL_TOKENS[market.chainId].primary;
  const [buyToken, sellToken] =
    swapType === "buy" ? [outcomeToken, selectedCollateral] : [selectedCollateral, outcomeToken];
  const { data: balance = BigInt(0), isFetching: isFetchingBalance } = useTokenBalance(
    account,
    sellToken.address,
    market.chainId,
  );

  useEffect(() => {
    dirtyFields["amount"] && trigger("amount");
  }, [balance]);

  const {
    data: quoteData,
    isPending: quoteIsPending,
    error: quoteError,
  } = useTradeQuoter(market.id, outcomeToken.address, parseUnits(amount, 18), isUseNativeToken, swapType === "buy");

  const { data: assetsToShares, isFetching: isFetchingAssetsToShares } = useConvertToShares(
    isUseNativeToken ? parseUnits(amount, 18) : 0n,
    market.chainId,
  );
  const amountInToSDai = isUseNativeToken ? Number(formatUnits(assetsToShares ?? 0n, 18)) : Number(amount);

  const receivedAmount = quoteData ? Number(formatUnits(quoteData.amountOut, 18)) : 0;
  const amountOutMinimum = receivedAmount * (1 - Number(maxSlippage) / 100);
  const collateralPerShare = receivedAmount ? amountInToSDai / receivedAmount : 0;

  // check if current token price higher than 1 collateral per token
  const isPriceTooHigh = collateralPerShare > 1 && swapType === "buy";
  const tradeTokens = useTradeManager(async () => {
    reset();
    closeConfirmSwapModal();
  });

  const onSubmit = async () => {
    await tradeTokens.mutateAsync({
      paths: quoteData?.paths ?? [],
      amountIn: parseUnits(amount, 18),
      amountOutMinimum: parseUnits(amountOutMinimum.toString(), 18),
      isUseNativeToken,
    });
  };
  return (
    <>
      <ConfirmSwapModal
        title="Confirm Swap"
        content={
          <SwapTokensTradeManagerConfirmation
            quoteData={{
              buyToken,
              sellToken,
              amountIn: Number(amount),
              amountOut: receivedAmount,
            }}
            closeModal={closeConfirmSwapModal}
            isLoading={tradeTokens.isPending}
            onSubmit={onSubmit}
          />
        }
      />
      {!isShowMaxSlippage && (
        <form onSubmit={handleSubmit(openConfirmSwapModal)} className="space-y-5">
          {parentCollateral && (
            <button
              className="text-purple-primary hover:underline text-[14px]"
              type="button"
              onClick={() => setUseTradeManager((state) => !state)}
            >
              {isUseTradeManager
                ? `${swapType === "buy" ? "Buy with" : "Sell to"} ${parentCollateral.symbol}`
                : `${swapType === "buy" ? "Buy with" : "Sell to"} sDai/xDai`}
            </button>
          )}
          <div className={clsx("space-y-5")}>
            <div>
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
              <div className="text-[12px] text-black-secondary mb-2 flex items-center gap-1">
                Balance:{" "}
                <div>
                  {isFetchingBalance ? (
                    <div className="shimmer-container w-[80px] h-[13px]" />
                  ) : (
                    <>
                      {displayBalance(balance, sellToken.decimals)} {sellToken.symbol}
                    </>
                  )}
                </div>
              </div>
              <Input
                autoComplete="off"
                type="number"
                step="any"
                min="0"
                {...register("amount", {
                  required: "This field is required.",
                  validate: (v) => {
                    if (Number.isNaN(Number(v)) || Number(v) < 0) {
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
            {Number(amount) > 0 && (
              <div className="flex space-x-2 text-purple-primary">
                Price per share ={" "}
                {quoteIsPending || isFetchingAssetsToShares ? (
                  <div className="shimmer-container ml-2 flex-grow" />
                ) : (
                  <>
                    {swapType === "sell"
                      ? collateralPerShare > 0
                        ? (1 / collateralPerShare).toFixed(3)
                        : 0
                      : collateralPerShare.toFixed(3)}{" "}
                    sDAI
                  </>
                )}
              </div>
            )}
            {Number(amount) > 0 && (
              <div className="flex space-x-2 text-purple-primary">
                {swapType === "buy" ? "Expected shares" : "Expected amount"} ={" "}
                {quoteIsPending ? (
                  <div className="shimmer-container ml-2 flex-grow" />
                ) : (
                  <>
                    {receivedAmount.toFixed(3)} {buyToken.symbol}
                  </>
                )}
              </div>
            )}

            {isPriceTooHigh && (
              <Alert type="warning">Price exceeds 1 sDAI per share. Try to reduce the input amount.</Alert>
            )}
            {quoteError && <Alert type="error">{quoteError.message}</Alert>}

            <div className="flex justify-between flex-wrap gap-4">
              <AltCollateralSwitch {...register("isUseNativeToken")} market={market} isUseWrappedToken={false} />
              <div className="text-[12px] text-black-secondary flex items-center gap-2">
                Max slippage:{" "}
                <div
                  className="flex items-center gap-2 cursor-pointer text-purple-primary hover:opacity-50"
                  onClick={() => setShowMaxSlippage(true)}
                >
                  <p>{maxSlippage}%</p>
                  <Parameter width="16px" height="16px" />
                </div>
              </div>
            </div>
          </div>
          <div>
            <SwapButtonsTradeManager
              account={account}
              chainId={market.chainId}
              tokenIn={sellToken.address}
              amountIn={parseUnits(amount, 18)}
              swapType={swapType}
              isDisabled={!receivedAmount || !account || !isValid || tradeTokens.isPending || isPriceTooHigh}
              isLoading={tradeTokens.isPending || (receivedAmount > 0 && quoteIsPending) || isFetchingAssetsToShares}
            />
          </div>
        </form>
      )}
      {isShowMaxSlippage && <SwapTokensMaxSlippage onReturn={() => setShowMaxSlippage(false)} />}
    </>
  );
}
