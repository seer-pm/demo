import { usePriceFromVolume } from "@/hooks/liquidity/usePriceUntilVolume";
import { useTicksData } from "@/hooks/liquidity/useTicksData";
import { useVolumeUntilPrice } from "@/hooks/liquidity/useVolumeUntilPrice";
import { decimalToFraction } from "@/hooks/liquidity/utils";
import { useQuoteTrade, useTrade } from "@/hooks/trade";
import { useTradeConditions } from "@/hooks/trade/useTradeConditions";
import useDebounce from "@/hooks/useDebounce";
import { useGlobalState } from "@/hooks/useGlobalState";
import { useModal } from "@/hooks/useModal";
import { COLLATERAL_TOKENS, isSeerCredits } from "@/lib/config";
import { Parameter, QuestionIcon } from "@/lib/icons";
import { Market } from "@/lib/market";
import { paths } from "@/lib/paths";
import { Token, getCollateralPerShare } from "@/lib/tokens";
import { displayBalance, isTwoStringsEqual, isUndefined } from "@/lib/utils";
import { CoWTrade, SwaprV3Trade, TradeType, UniswapTrade } from "@swapr/sdk";
import { TickMath, encodeSqrtRatioX96 } from "@uniswap/v3-sdk";
import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { formatUnits, parseUnits } from "viem";
import { Alert } from "../../Alert";
import { BridgeWidget } from "../../BridgeWidget";
import Button from "../../Form/Button";
import Input from "../../Form/Input";
import { SwapTokensConfirmation } from "./SwapTokensConfirmation";
import { TokenSelector } from "./TokenSelector";
import { PotentialReturn } from "./components/PotentialReturn";
import SwapButtons from "./components/SwapButtons";

interface SwapFormValues {
  type: "buy" | "sell";
  amount: string;
  amountOut: string;
  limitPrice: string;
}

interface SwapTokensLimitUptoProps {
  market: Market;
  outcomeIndex: number;
  outcomeToken: Token;
  fixedCollateral: Token | undefined;
  setShowMaxSlippage: (isShow: boolean) => void;
  outcomeImage?: string;
  isInvalidOutcome: boolean;
}

export function SwapTokensLimitUpto({
  market,
  outcomeIndex,
  outcomeToken,
  setShowMaxSlippage,
  fixedCollateral,
  outcomeImage,
  isInvalidOutcome,
}: SwapTokensLimitUptoProps) {
  const limitPriceRef = useRef<HTMLInputElement | null>(null);
  const [swapType, setSwapType] = useState<"buy" | "sell">("buy");
  const [tradeType, setTradeType] = useState(TradeType.EXACT_INPUT);
  const [isUseMax, setUseMax] = useState(false);
  const primaryCollateral = COLLATERAL_TOKENS[market.chainId].primary;
  const setPreferredCollateral = useGlobalState((state) => state.setPreferredCollateral);

  const { data: ticksByPool } = useTicksData(
    market,
    market.wrappedTokens.findIndex((x) => isTwoStringsEqual(x, outcomeToken.address)),
  );
  const poolInfo = ticksByPool ? Object.values(ticksByPool)[0].poolInfo : undefined;
  const currentSqrtPriceX96 = poolInfo ? BigInt(TickMath.getSqrtRatioAtTick(poolInfo.tick).toString()) : 0n;
  const useFormReturn = useForm<SwapFormValues>({
    mode: "all",
    defaultValues: {
      type: "buy",
      amount: "",
      amountOut: "",
      limitPrice: "",
    },
  });

  const {
    register,
    reset,
    resetField,
    formState: { isValid, dirtyFields, errors },
    handleSubmit,
    watch,
    setValue,
    trigger,
  } = useFormReturn;

  const [amount, amountOut, limitPrice] = watch(["amount", "amountOut", "limitPrice"]);

  const limitErrorMessage = limitPrice && errors.limitPrice?.message;

  const {
    maxSlippage,
    isInstantSwap,
    account,
    parentMarket,
    isFetching,
    sharesToAssets,
    assetsToShares,
    buyToken,
    sellToken,
    showBridgeLink,
    isSecondaryCollateral,
    isBuyExactOutputNative,
    isSellToNative,
    isFetchingBalance,
    balance,
    selectedCollateral,
  } = useTradeConditions({
    market,
    fixedCollateral,
    outcomeToken,
    swapType,
    tradeType,
    errors,
  });

  const {
    Modal: ConfirmSwapModal,
    openModal: openConfirmSwapModal,
    closeModal: closeConfirmSwapModal,
  } = useModal("confirm-swap-modal");

  const debouncedAmount = useDebounce(amount, 500);
  const debouncedAmountOut = useDebounce(amountOut, 500);
  const debounceLimitPrice = useDebounce(limitPrice, 500);

  const volume = useVolumeUntilPrice(
    market,
    outcomeToken.address,
    swapType,
    debounceLimitPrice ? Number(debounceLimitPrice) : undefined,
  );
  const limitPriceFromVolume = usePriceFromVolume(
    market,
    outcomeToken.address,
    swapType,
    tradeType === TradeType.EXACT_INPUT ? Number(amountOut) : Number(amount),
  );

  const isSeerCreditsCollateral = isSeerCredits(market.chainId, selectedCollateral.address);

  const {
    data: quoteData,
    isLoading: quoteIsLoading,
    fetchStatus: quoteFetchStatus,
    error: quoteError,
  } = useQuoteTrade(
    market.chainId,
    account,
    tradeType === TradeType.EXACT_INPUT ? debouncedAmount : debouncedAmountOut,
    outcomeToken,
    selectedCollateral,
    swapType,
    tradeType,
  );
  const isCowFastQuote =
    quoteData?.trade instanceof CoWTrade && quoteData?.trade?.quote?.expiration === "1970-01-01T00:00:00Z";
  const {
    tradeTokens,
    approvals: { data: missingApprovals = [], isLoading: isLoadingApprovals },
  } = useTrade(account, quoteData?.trade, isSeerCreditsCollateral, async () => {
    reset();
    closeConfirmSwapModal();
  });

  const onSubmit = async (trade: CoWTrade | SwaprV3Trade | UniswapTrade) => {
    await tradeTokens.mutateAsync({
      trade,
      account: account!,
      isBuyExactOutputNative,
      isSellToNative,
      isSeerCredits: isSeerCreditsCollateral,
    });
  };

  // calculate price per share
  const receivedAmount =
    tradeType === TradeType.EXACT_INPUT
      ? quoteData
        ? Number(formatUnits(quoteData.value, quoteData.decimals))
        : 0
      : Number(amountOut);
  const collateralPerShare = getCollateralPerShare(quoteData, swapType);

  const outcomeText = market.outcomes[outcomeIndex];
  // check if current token price higher than 1 (primary) collateral per token
  const isPriceTooHigh =
    market.type === "Generic" &&
    collateralPerShare * (isSecondaryCollateral ? assetsToShares : 1) > 1 &&
    swapType === "buy";

  const renderButtons = () => {
    if (isCowFastQuote) {
      return (
        <Button
          variant="primary"
          type="button"
          disabled={true}
          isLoading={true}
          className="w-full"
          text="Calculating best price..."
        />
      );
    }
    if (limitErrorMessage && limitErrorMessage !== "This field is required." && !isUseMax) {
      return <Button variant="primary" className="w-full" type="button" disabled={true} text={limitErrorMessage} />;
    }
    if (quoteData?.trade) {
      return (
        <SwapButtons
          account={account}
          trade={quoteData.trade}
          isBuyExactOutputNative={isBuyExactOutputNative}
          isDisabled={
            isUndefined(quoteData?.value) ||
            quoteData?.value === 0n ||
            !account ||
            (!isUseMax && !isValid) ||
            tradeTokens.isPending ||
            isPriceTooHigh
          }
          missingApprovals={missingApprovals}
          isLoading={
            tradeTokens.isPending ||
            (!isUndefined(quoteData?.value) && quoteData.value > 0n && quoteIsLoading) ||
            isFetching ||
            isLoadingApprovals
          }
        />
      );
    }

    if (quoteIsLoading && quoteFetchStatus === "fetching") {
      return <Button variant="primary" type="button" className="w-full" disabled={true} isLoading={true} text="" />;
    }
    return <Button variant="primary" className="w-full" type="button" disabled={true} text="Enter target price" />;
  };

  const checkPriceDirection = (value: number) => {
    if (value > 1 || Number.isNaN(value) || value <= 0 || !poolInfo) return undefined;
    const isOutcomeToken0 = isTwoStringsEqual(poolInfo.token0, outcomeToken.address);
    const [num, den] = decimalToFraction(isOutcomeToken0 ? value : 1 / value);
    const targetSqrtPriceX96 = BigInt(encodeSqrtRatioX96(num, den).toString());
    const isBuy =
      (isOutcomeToken0 && targetSqrtPriceX96 > currentSqrtPriceX96) ||
      (!isOutcomeToken0 && targetSqrtPriceX96 < currentSqrtPriceX96);
    return isBuy ? "buy" : "sell";
  };

  // useEffects

  useEffect(() => {
    dirtyFields["amount"] && trigger("amount");
  }, [balance]);

  useEffect(() => {
    resetField("limitPrice");
    resetField("amount");
    resetField("amountOut");
  }, [selectedCollateral.address, outcomeToken.address]);

  useEffect(() => {
    if (tradeType === TradeType.EXACT_INPUT) {
      setValue("amountOut", receivedAmount ? receivedAmount.toString() : "", {
        shouldValidate: true,
        shouldDirty: true,
      });
    } else {
      setValue("amount", quoteData ? formatUnits(quoteData.value, quoteData.decimals) : "", {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  }, [quoteData?.value]);

  useEffect(() => {
    if (isUseMax) return;
    if (volume) {
      setTradeType(swapType === "buy" ? TradeType.EXACT_OUTPUT : TradeType.EXACT_INPUT);
      setValue(swapType === "buy" ? "amountOut" : "amount", volume.toString(), {
        shouldValidate: true,
        shouldDirty: true,
      });
    } else {
      setTradeType(TradeType.EXACT_INPUT);
      resetField("amount");
      resetField("amountOut");
    }
  }, [volume]);

  useEffect(() => {
    if (isUseMax) return;
    setTradeType(TradeType.EXACT_INPUT);
    resetField("amount");
    resetField("amountOut");
  }, [isUseMax]);

  useEffect(() => {
    const priceDirection = checkPriceDirection(Number(debounceLimitPrice));
    if (!priceDirection) return;
    setSwapType(priceDirection as "buy" | "sell");
  }, [debounceLimitPrice]);

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
            isBuyExactOutputNative={isBuyExactOutputNative}
            isSellToNative={isSellToNative}
            isSeerCredits={isSeerCreditsCollateral}
            outcomeToken={outcomeToken}
          />
        }
      />
      <form onSubmit={handleSubmit(openConfirmSwapModal)} className="space-y-5">
        <div className="space-y-2">
          <div className={clsx("rounded-[12px] p-4 space-y-2 border border-[#2222220d]")}>
            <div className="flex items-center justify-between">
              <p className="text-base-content/70">Target price</p>
            </div>
            <div className="flex justify-between items-start">
              <div>
                <Input
                  autoComplete="off"
                  type="number"
                  step="any"
                  min="0"
                  {...register("limitPrice", {
                    required: "This field is required.",
                    validate: (v) => {
                      if (Number.isNaN(Number(v)) || Number(v) < 0) {
                        return "Limit price must be greater than 0.";
                      }
                    },
                    onChange: (e) => {
                      setUseMax(false);
                      const value = e.target.value;

                      // All trades must be less than 1. Input field defaults to cents - when user types "86",
                      // it automatically becomes "0.86" to represent 86 cents
                      if (value && !value.includes(".") && !value.includes(",") && Number(value) >= 1) {
                        const formattedValue = `0.${value}`;
                        setValue("limitPrice", formattedValue, {
                          shouldValidate: true,
                          shouldDirty: true,
                        });
                      }
                    },
                  })}
                  ref={(el) => {
                    limitPriceRef.current = el;
                    register("limitPrice").ref(el);
                  }}
                  onWheel={(event) => {
                    event.currentTarget.blur();
                    requestAnimationFrame(() => {
                      limitPriceRef.current?.focus({ preventScroll: true });
                    });
                  }}
                  value={isUseMax ? (limitPriceFromVolume?.toFixed(8) ?? "") : limitPrice}
                  className="w-full p-0 h-auto text-[24px] !bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none border-0 focus:outline-transparent focus:ring-0 focus:border-0"
                  placeholder="0"
                  useFormReturn={useFormReturn}
                  errorClassName="hidden"
                />
              </div>
              <div className="flex items-center gap-1 rounded-full border border-[#f2f2f2] px-3 py-1 shadow-[0_0_10px_rgba(34,34,34,0.04)]">
                <div className="rounded-full w-6 h-6 overflow-hidden flex-shrink-0">
                  <img
                    className="w-full h-full"
                    alt={primaryCollateral.symbol}
                    src={paths.tokenImage(primaryCollateral.address, market.chainId)}
                  />
                </div>
                <p className="font-semibold text-[16px]">{primaryCollateral.symbol}</p>
              </div>
            </div>
          </div>
          <div className={clsx("rounded-[12px] p-4 space-y-2 bg-base-200/80")}>
            <p className="text-base-content/70">You will sell</p>
            <div className="flex justify-between items-start">
              <div>
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

                    onChange: () => {
                      setTradeType(TradeType.EXACT_INPUT);
                    },
                  })}
                  disabled
                  className="w-full p-0 h-auto text-[24px] !bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none border-0 focus:outline-transparent focus:ring-0 focus:border-0"
                  placeholder="0"
                  useFormReturn={useFormReturn}
                  errorClassName="absolute"
                />
              </div>
              <TokenSelector
                type="sell"
                {...{
                  sellToken,
                  buyToken,
                  selectedCollateral,
                  market,
                  fixedCollateral,
                  setPreferredCollateral,
                  parentMarket,
                  outcomeIndex,
                  outcomeImage,
                  isInvalidOutcome,
                  outcomeText,
                }}
              />
            </div>
            <div className="flex justify-end">
              {isFetchingBalance ? (
                <div className="shimmer-container w-[80px] h-[13px]" />
              ) : (
                <div className="flex items-center gap-1">
                  <p className="text-[12px] font-semibold text-base-content/70">
                    {displayBalance(balance, sellToken.decimals)} {sellToken.symbol}
                  </p>
                  {balance > 0 && (
                    <button
                      type="button"
                      className="text-[14px] font-semibold text-base-content/70 rounded-[12px] border border-[#2222220d] py-1 px-[6px] bg-base-200/80 hover:bg-base-300/60"
                      onClick={() => {
                        setUseMax(true);
                        setTradeType(TradeType.EXACT_INPUT);
                        setValue("amount", formatUnits(balance, sellToken.decimals), {
                          shouldValidate: true,
                          shouldDirty: true,
                        });
                      }}
                    >
                      Max
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className={clsx("rounded-[12px] p-4 space-y-2 bg-base-200/80")}>
            <p className="text-base-content/70">To receive</p>
            <div className="flex justify-between items-start">
              <div>
                <Input
                  autoComplete="off"
                  type="number"
                  step="any"
                  min="0"
                  {...register("amountOut", {
                    onChange: () => {
                      setTradeType(TradeType.EXACT_OUTPUT);
                    },
                  })}
                  className="w-full p-0 h-auto text-[24px] !bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none border-0 focus:outline-transparent focus:ring-0 focus:border-0"
                  placeholder="0"
                  disabled
                  useFormReturn={useFormReturn}
                />
              </div>
              <TokenSelector
                type="buy"
                {...{
                  sellToken,
                  buyToken,
                  selectedCollateral,
                  market,
                  fixedCollateral,
                  setPreferredCollateral,
                  parentMarket,
                  outcomeIndex,
                  outcomeImage,
                  isInvalidOutcome,
                  outcomeText,
                }}
              />
            </div>
          </div>
        </div>
        {showBridgeLink && <BridgeWidget toChainId={market.chainId} />}
        <div className="space-y-1">
          <div className="flex justify-between text-[#828282] text-[14px]">
            Avg price
            {quoteIsLoading || isFetching ? (
              <div className="shimmer-container ml-2 w-[100px]" />
            ) : (
              <div className="flex items-center gap-2">
                {collateralPerShare} {selectedCollateral.symbol}
                {isSecondaryCollateral && (
                  <span className="tooltip">
                    <p className="tooltiptext">
                      {(collateralPerShare * sharesToAssets).toFixed(3)} {primaryCollateral.symbol}
                    </p>
                    <QuestionIcon fill="#9747FF" />
                  </span>
                )}
              </div>
            )}
          </div>
          <PotentialReturn
            {...{
              swapType,
              isSecondaryCollateral,
              selectedCollateral,
              sharesToAssets,
              assetsToShares,
              outcomeText,
              outcomeToken,
              market,
              quoteIsLoading,
              isFetching,
              amount,
              receivedAmount,
              collateralPerShare,
              tradeType,
            }}
          />
        </div>

        {isPriceTooHigh && (
          <Alert type="warning">
            Price exceeds 1 {isSecondaryCollateral ? primaryCollateral.symbol : selectedCollateral.symbol} per share.
            Try to reduce the input price.
          </Alert>
        )}
        {quoteError && (
          <Alert type="error">
            {quoteError.message
              ? quoteError.message === "No route found"
                ? `Not enough liquidity. Try to ${swapType === "buy" ? "reduce" : "increase"} the input price.`
                : quoteError.message
              : "Error when quoting price"}
          </Alert>
        )}

        <div className="flex justify-between flex-wrap gap-4">
          {/* market.type === "Futarchy" && <FutarchyTokenSwitch market={market} outcomeIndex={outcomeIndex} /> */}
          <div className="w-full text-[12px] text-black-secondary flex items-center gap-2">
            Parameters:{" "}
            <div
              className="flex items-center gap-2 cursor-pointer text-purple-primary hover:opacity-50"
              onClick={() => setShowMaxSlippage(true)}
            >
              <p>
                Max slippage {maxSlippage}%{isInstantSwap && " - Instant"}
              </p>

              <Parameter width="16px" height="16px" />
            </div>
          </div>
        </div>
        {renderButtons()}
      </form>
    </>
  );
}
