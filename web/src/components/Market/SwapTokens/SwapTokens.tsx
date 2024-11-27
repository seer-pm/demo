import { useQuoteTrade, useTrade } from "@/hooks/trade";
import { useConvertToAssets, useConvertToShares } from "@/hooks/trade/handleSDAI";
import { useGlobalState } from "@/hooks/useGlobalState";
import { useModal } from "@/hooks/useModal";
import { useTokenBalance } from "@/hooks/useTokenBalance";
import { SupportedChain } from "@/lib/chains";
import { COLLATERAL_TOKENS, getLiquidityUrl } from "@/lib/config";
import { Parameter } from "@/lib/icons";
import { Token, hasAltCollateral } from "@/lib/tokens";
import { NATIVE_TOKEN, displayBalance, isUndefined } from "@/lib/utils";
import { CoWTrade, SwaprV3Trade, UniswapTrade, WXDAI } from "@swapr/sdk";
import clsx from "clsx";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Address, formatUnits, parseUnits } from "viem";
import { gnosis } from "viem/chains";
import { Alert } from "../../Alert";
import Button from "../../Form/Button";
import Input from "../../Form/Input";
import AltCollateralSwitch from "../AltCollateralSwitch";
import { OutcomeImage } from "../OutcomeImage";
import { SwapTokensConfirmation } from "./SwapTokensConfirmation";
import SwapTokensMaxSlippage from "./SwapTokensMaxSlippage";
import SwapButtons from "./components/SwapButtons";

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
  outcomeImage?: string;
  isInvalidResult: boolean;
  parentCollateral: Token | undefined;
}

function getSelectedCollateral(chainId: SupportedChain, useAltCollateral: boolean, isUseWrappedToken: boolean): Token {
  if (hasAltCollateral(COLLATERAL_TOKENS[chainId].secondary) && useAltCollateral) {
    if (isUseWrappedToken && COLLATERAL_TOKENS[chainId].secondary?.wrapped) {
      return COLLATERAL_TOKENS[chainId].secondary?.wrapped as Token;
    }

    return COLLATERAL_TOKENS[chainId].secondary as Token;
  }

  return COLLATERAL_TOKENS[chainId].primary;
}

export function SwapTokens({
  account,
  chainId,
  outcomeText,
  outcomeToken,
  hasEnoughLiquidity,
  outcomeImage,
  isInvalidResult,
  parentCollateral,
}: SwapTokensProps) {
  const [swapType, setSwapType] = useState<"buy" | "sell">("buy");
  const tabClick = (type: "buy" | "sell") => () => setSwapType(type);
  const [isShowMaxSlippage, setShowMaxSlippage] = useState(false);
  const maxSlippage = useGlobalState((state) => state.maxSlippage);
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
  const {
    Modal: ConfirmSwapModal,
    openModal: openConfirmSwapModal,
    closeModal: closeConfirmSwapModal,
  } = useModal("confirm-swap-modal");
  const { data: wxDAIBalance = BigInt(0) } = useTokenBalance(
    account,
    WXDAI[chainId]?.address as `0x${string}`,
    chainId,
  );
  const { data: xDAIBalance = BigInt(0) } = useTokenBalance(account, NATIVE_TOKEN, chainId);
  const isUseWrappedToken = wxDAIBalance > xDAIBalance && chainId === gnosis.id;

  const selectedCollateral = parentCollateral || getSelectedCollateral(chainId, useAltCollateral, isUseWrappedToken);
  const [buyToken, sellToken] =
    swapType === "buy" ? [outcomeToken, selectedCollateral] : [selectedCollateral, outcomeToken];
  const { data: balance = BigInt(0), isFetching: isFetchingBalance } = useTokenBalance(
    account,
    sellToken.address,
    chainId,
  );

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
    closeConfirmSwapModal();
  });

  const onSubmit = async (trade: CoWTrade | SwaprV3Trade | UniswapTrade) => {
    await tradeTokens.mutateAsync({
      trade,
      account: account!,
    });
  };
  const sDAI = COLLATERAL_TOKENS[chainId].primary;

  // convert sell result to xdai or wxdai if using multisteps swap
  const isCollateralDai = selectedCollateral.address !== sDAI.address && isUndefined(parentCollateral);
  const isMultiStepsSwap = isCollateralDai && !(quoteData?.trade instanceof CoWTrade);
  const isMultiStepsSell = swapType === "sell" && isMultiStepsSwap;
  const isCowSwapDai = isCollateralDai && quoteData?.trade instanceof CoWTrade;

  const { data: sharesToAssets, isFetching: isFetchingSharesToAssets } = useConvertToAssets(
    isMultiStepsSell ? (quoteData?.value ?? 0n) : 0n,
    chainId,
  );
  const { data: assetsToShares, isFetching: isFetchingAssetsToShares } = useConvertToShares(
    isCowSwapDai
      ? swapType === "buy"
        ? parseUnits(amount, selectedCollateral.decimals)
        : (quoteData?.value ?? 0n)
      : 0n,
    chainId,
  );
  const cowSwapDaiAmount = assetsToShares ? Number(formatUnits(assetsToShares, selectedCollateral.decimals)) : 0;

  // calculate price per share
  const multiStepSellDaiReceived = sharesToAssets
    ? Number(formatUnits(sharesToAssets, selectedCollateral.decimals))
    : 0;
  const inputAmount = quoteData
    ? Number(
        formatUnits(BigInt(quoteData.trade.inputAmount.raw.toString()), quoteData.trade.inputAmount.currency.decimals),
      )
    : 0;
  const receivedAmount = quoteData ? Number(formatUnits(quoteData.value, quoteData.decimals)) : 0;
  const collateralPerShare = (() => {
    if (!quoteData) return 0;
    if (!isCowSwapDai) {
      return Number(inputAmount) / receivedAmount;
    }
    if (swapType === "buy") {
      return cowSwapDaiAmount / receivedAmount;
    }
    return Number(inputAmount) / cowSwapDaiAmount;
  })();

  // check if current token price higher than 1 collateral per token
  const isPriceTooHigh = collateralPerShare > 1 && swapType === "buy";

  return (
    <>
      <ConfirmSwapModal
        title="Confirm Swap"
        content={
          <SwapTokensConfirmation
            trade={quoteData?.trade}
            closeModal={closeConfirmSwapModal}
            reset={() => reset()}
            isLoading={tradeTokens.isPending}
            onSubmit={onSubmit}
            collateral={selectedCollateral}
            originalAmount={amount}
          />
        }
      />
      {!isShowMaxSlippage && (
        <form onSubmit={handleSubmit(openConfirmSwapModal)} className="space-y-5 bg-white p-[24px] drop-shadow">
          <div className="flex items-center space-x-[12px]">
            <div>
              <OutcomeImage image={outcomeImage} isInvalidResult={isInvalidResult} title={outcomeText} />
            </div>
            <div className="text-[16px]">{outcomeText}</div>
          </div>

          {hasEnoughLiquidity === false && (
            <Alert type="warning">
              This outcome lacks sufficient liquidity for trading. You can mint tokens or{" "}
              <a
                href={getLiquidityUrl(chainId, outcomeToken.address, parentCollateral?.address || sDAI.address)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-primary"
              >
                provide liquidity.
              </a>
            </Alert>
          )}

          <div
            className={clsx("space-y-5", hasEnoughLiquidity === false && "grayscale opacity-40 pointer-events-none")}
          >
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
                {quoteFetchStatus === "fetching" || isFetchingSharesToAssets || isFetchingAssetsToShares ? (
                  <div className="shimmer-container ml-2 flex-grow" />
                ) : (
                  <>
                    {swapType === "sell"
                      ? collateralPerShare > 0
                        ? (1 / collateralPerShare).toFixed(3)
                        : 0
                      : collateralPerShare.toFixed(3)}{" "}
                    {isCollateralDai ? "sDAI" : selectedCollateral.symbol}
                  </>
                )}
              </div>
            )}

            {Number(amount) > 0 && (
              <div className="flex space-x-2 text-purple-primary">
                {swapType === "buy" ? "Expected shares" : "Expected amount"} ={" "}
                {quoteFetchStatus === "fetching" || isFetchingSharesToAssets ? (
                  <div className="shimmer-container ml-2 flex-grow" />
                ) : (
                  <>
                    {isMultiStepsSell ? multiStepSellDaiReceived.toFixed(3) : receivedAmount.toFixed(3)}{" "}
                    {buyToken.symbol}
                  </>
                )}
              </div>
            )}

            {isPriceTooHigh && (
              <Alert type="warning">
                Price exceeds 1 {isCollateralDai ? "sDAI" : selectedCollateral.symbol} per share. Try to reduce the
                input amount.
              </Alert>
            )}
            {quoteIsError && <Alert type="error">Not enough liquidity</Alert>}

            <div className="flex justify-between flex-wrap gap-4">
              {isUndefined(parentCollateral) && (
                <AltCollateralSwitch
                  {...register("useAltCollateral")}
                  chainId={chainId}
                  isUseWrappedToken={isUseWrappedToken}
                />
              )}
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

            {quoteData?.trade ? (
              <SwapButtons
                account={account}
                trade={quoteData.trade}
                swapType={swapType}
                isDisabled={
                  isUndefined(quoteData?.value) ||
                  quoteData?.value === 0n ||
                  !account ||
                  !isValid ||
                  tradeTokens.isPending ||
                  isPriceTooHigh
                }
                isLoading={
                  tradeTokens.isPending ||
                  (!isUndefined(quoteData?.value) && quoteData.value > 0n && quoteIsPending) ||
                  isFetchingSharesToAssets
                }
                isMultiStepsSwap={isMultiStepsSwap}
              />
            ) : quoteIsPending && quoteFetchStatus === "fetching" ? (
              <Button variant="primary" type="button" disabled={true} isLoading={true} text="" />
            ) : null}
          </div>
        </form>
      )}
      {isShowMaxSlippage && <SwapTokensMaxSlippage onReturn={() => setShowMaxSlippage(false)} />}
    </>
  );
}
