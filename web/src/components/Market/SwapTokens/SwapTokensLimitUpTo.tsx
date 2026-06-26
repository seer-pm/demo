import { usePriceFromVolume } from "@/hooks/liquidity/usePriceUntilVolume";
import { useTicksData } from "@/hooks/liquidity/useTicksData";
import { useVolumeUntilPrice } from "@/hooks/liquidity/useVolumeUntilPrice";
import { useTrade } from "@/hooks/trade/useTrade";
import { useTradeConditions } from "@/hooks/trade/useTradeConditions";
import useDebounce from "@/hooks/useDebounce";
import { useGlobalState } from "@/hooks/useGlobalState";
import { useModal } from "@/hooks/useModal";
import { useTokenUsdPrice } from "@/hooks/useTokenUsdPrice";
import { Parameter, QuestionIcon } from "@/lib/icons";
import { paths } from "@/lib/paths";
import { displayBalance, isTwoStringsEqual, isUndefined } from "@/lib/utils";
import { useQuoteTrade } from "@seer-pm/react";
import { isSeerCredits } from "@seer-pm/sdk";
import { Market, MarketTypes, getMarketType } from "@seer-pm/sdk";
import { decimalToFraction } from "@seer-pm/sdk";
import { type Token, getCollateralPerShare } from "@seer-pm/sdk";
import { getActivePrimaryCollateral } from "@seer-pm/sdk";
import { CoWTrade, SwaprV3Trade, TradeType, UniswapTrade } from "@seer-pm/sdk";
import { TickMath, encodeSqrtRatioX96 } from "@uniswap/v3-sdk";
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

function truncateToTwoDecimals(value: string): string {
  if (!value) return value;
  const dotIdx = value.indexOf(".");
  if (dotIdx === -1) return value;
  return value.slice(0, dotIdx + 3);
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
  const primaryCollateral = getActivePrimaryCollateral(market.chainId);
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
    formState: { dirtyFields, errors },
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
    isPsm3Collateral,
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
    maxSlippage,
    !isInstantSwap,
  );
  const trade = quoteData?.trade;
  const isCowFastQuote = trade instanceof CoWTrade && trade.quote?.expiration === "1970-01-01T00:00:00Z";
  const {
    tradeTokens,
    approvals: { data: missingApprovals = [], isLoading: isLoadingApprovals },
  } = useTrade(
    account,
    quoteData?.trade,
    isSeerCreditsCollateral,
    async () => {
      reset();
      closeConfirmSwapModal();
    },
    market,
    quoteData?.psm3Leg,
  );

  const onSubmit = async (trade: CoWTrade | SwaprV3Trade | UniswapTrade) => {
    await tradeTokens.mutateAsync({
      trade,
      account: account!,
      isBuyExactOutputNative,
      isSellToNative,
      isSeerCredits: isSeerCreditsCollateral,
      psm3Leg: quoteData?.psm3Leg,
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
          className="w-full !rounded-[8px]"
          text="Calculating best price..."
        />
      );
    }
    if (limitErrorMessage && limitErrorMessage !== "This field is required." && !isUseMax) {
      return (
        <Button
          variant="primary"
          className="w-full !rounded-[8px]"
          type="button"
          disabled={true}
          text={limitErrorMessage}
        />
      );
    }
    if (quoteData?.trade) {
      const parsedAmount = parseUnits(amount, sellToken.decimals);
      const usePartialSwap = parsedAmount > balance;
      return (
        <SwapButtons
          account={account}
          trade={quoteData.trade}
          isBuyExactOutputNative={isBuyExactOutputNative}
          isDisabled={
            isUndefined(quoteData?.value) ||
            quoteData?.value === 0n ||
            !account ||
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
          text={usePartialSwap ? "Partial Swap" : "Swap"}
        />
      );
    }

    if (quoteIsLoading && quoteFetchStatus === "fetching") {
      return (
        <Button
          variant="primary"
          type="button"
          className="w-full !rounded-[8px]"
          disabled={true}
          isLoading={true}
          text=""
        />
      );
    }
    return (
      <Button
        variant="primary"
        className="w-full !rounded-[8px]"
        type="button"
        disabled={true}
        text="Enter target price"
      />
    );
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

  const swapMax = () => {
    setUseMax(true);
    setTradeType(TradeType.EXACT_INPUT);
    setValue("amount", truncateToTwoDecimals(formatUnits(balance, sellToken.decimals)), {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const usdPrice = useTokenUsdPrice(sellToken?.symbol);
  const collateralUsdPrice = useTokenUsdPrice(selectedCollateral?.symbol);
  const isSellingCollateral = swapType === "buy";

  const currentAmountFloat = (): number => {
    const n = Number(amount);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  };
  const balanceTokens = (): number => Number(formatUnits(balance, sellToken.decimals));
  const setAmountTokens = (next: number) => {
    setUseMax(false);
    setTradeType(TradeType.EXACT_INPUT);
    const max = balanceTokens();
    const clamped = Math.max(0, Math.min(next, max));
    const formatted = clamped.toFixed(sellToken.decimals).replace(/\.?0+$/, "") || "0";
    setValue("amount", truncateToTwoDecimals(formatted), { shouldValidate: true, shouldDirty: true });
  };
  const addPercentOfBalance = (pct: number) => {
    setAmountTokens(currentAmountFloat() + balanceTokens() * (pct / 100));
  };
  const addUsdAmount = (usd: number) => {
    const price = usdPrice && usdPrice > 0 ? usdPrice : 1;
    setAmountTokens(currentAmountFloat() + usd / price);
  };

  const handleOpenConfirmPartialSwap = () => {
    const parsedAmount = parseUnits(amount, sellToken.decimals);
    const usePartialSwap = parsedAmount > balance;
    if (usePartialSwap) {
      swapMax();
    }
    openConfirmSwapModal();
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
      setValue("amountOut", receivedAmount ? truncateToTwoDecimals(receivedAmount.toString()) : "", {
        shouldValidate: true,
        shouldDirty: true,
      });
    } else {
      setValue("amount", quoteData ? truncateToTwoDecimals(formatUnits(quoteData.value, quoteData.decimals)) : "", {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  }, [quoteData?.value]);

  useEffect(() => {
    if (isUseMax) return;
    if (volume) {
      setTradeType(swapType === "buy" ? TradeType.EXACT_OUTPUT : TradeType.EXACT_INPUT);
      setValue(swapType === "buy" ? "amountOut" : "amount", truncateToTwoDecimals(volume.toString()), {
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
      <form onSubmit={handleSubmit(openConfirmSwapModal, handleOpenConfirmPartialSwap)} className="space-y-5">
        <div className="space-y-3">
          {/* Target price */}
          <div>
            <div className="io-label">
              <span>Target price</span>
            </div>
            <div className="io-row">
              <div className="flex-1 min-w-0">
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
                  className="w-full p-0 h-auto font-display text-[22px] tracking-tight tabular-nums !bg-transparent !border-0 !rounded-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus:outline-none focus:!border-transparent focus:!shadow-none focus:ring-0"
                  placeholder="0"
                  useFormReturn={useFormReturn}
                  errorClassName="hidden"
                />
              </div>
              <div className="io-token">
                <div className="token-img rounded-full w-4 h-4 overflow-hidden flex-shrink-0">
                  <img
                    className="w-full h-full"
                    alt={primaryCollateral.symbol}
                    src={paths.tokenImage(primaryCollateral.address, market.chainId)}
                  />
                </div>
                <p>{primaryCollateral.symbol}</p>
              </div>
            </div>
          </div>

          {/* You will sell */}
          <div>
            <div className="io-label">
              <span>You will sell</span>
              {isFetchingBalance ? (
                <span className="shimmer-container w-[80px] h-[13px] inline-block" />
              ) : (
                <span className="tabular-nums">
                  Balance: {displayBalance(balance, sellToken.decimals)} {sellToken.symbol}
                </span>
              )}
            </div>
            <div className="io-row">
              <div className="flex-1 min-w-0">
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
                  className="w-full p-0 h-auto font-display text-[22px] tracking-tight tabular-nums !bg-transparent !border-0 !rounded-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus:outline-none focus:!border-transparent focus:!shadow-none focus:ring-0"
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

            <div className="io-balance">
              <span className="tabular-nums">
                {(() => {
                  const usd = isSellingCollateral
                    ? Number(amount || 0) * (usdPrice || 1)
                    : Number(amountOut || 0) * (collateralUsdPrice || 1);
                  return usd > 0 ? `$${usd.toFixed(2)}` : "$0.00";
                })()}
              </span>
              {balance > 0 && (
                <div className="quick-group">
                  <button
                    type="button"
                    className="quick-btn quick-btn--full"
                    onClick={() => setAmountTokens(balanceTokens() / 2)}
                  >
                    HALF
                  </button>
                  <button type="button" className="quick-btn quick-btn--full" onClick={() => swapMax()}>
                    MAX
                  </button>
                </div>
              )}
            </div>
            {balance > 0 && (
              <div className="io-quick-actions">
                <div className="quick-group">
                  {[1, 5, 10].map((n) => (
                    <button
                      key={`amount-${n}`}
                      type="button"
                      className="quick-btn quick-btn--dollar"
                      onClick={() =>
                        isSellingCollateral ? addUsdAmount(n) : setAmountTokens(currentAmountFloat() + n)
                      }
                    >
                      {isSellingCollateral ? `+$${n}` : `+${n}`}
                    </button>
                  ))}
                </div>
                <div className="quick-group">
                  {[1, 5, 10].map((pct) => (
                    <button
                      key={`pct-${pct}`}
                      type="button"
                      className="quick-btn quick-btn--pct"
                      onClick={() => addPercentOfBalance(pct)}
                    >
                      +{pct}%
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* To receive */}
          <div>
            <div className="io-label">
              <span>To receive</span>
            </div>
            <div className="io-row">
              <div className="flex-1 min-w-0">
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
                  className="w-full p-0 h-auto font-display text-[22px] tracking-tight tabular-nums !bg-transparent !border-0 !rounded-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus:outline-none focus:!border-transparent focus:!shadow-none focus:ring-0"
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
        <div>
          <div className="space-y-2 bg-bg-2 rounded-[8px] p-[14px]">
            <div className="flex justify-between items-baseline text-[13px]">
              <span className="text-ink-4 font-medium">Avg price</span>
              {quoteIsLoading || isFetching ? (
                <div className="shimmer-container ml-2 w-[100px]" />
              ) : (
                <div className="flex items-center gap-2 font-mono tabular-nums font-semibold text-ink">
                  {collateralPerShare} {selectedCollateral.symbol}
                  {isSecondaryCollateral && (
                    <span className="tooltip">
                      <p className="tooltiptext">
                        {(collateralPerShare * sharesToAssets).toFixed(3)} {primaryCollateral.symbol}
                      </p>
                      <QuestionIcon fill="var(--blue)" />
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
          {swapType === "buy" &&
            market.type !== "Futarchy" &&
            (getMarketType(market) === MarketTypes.CATEGORICAL || outcomeToken.symbol === "SER-INVALID") && (
              <p className="return-note">
                Each token can be redeemed for 1{" "}
                {isSecondaryCollateral ? primaryCollateral.symbol : selectedCollateral.symbol}
                {isSecondaryCollateral ? ` (or ${sharesToAssets.toFixed(3)} ${selectedCollateral.symbol})` : ""} if the
                market resolves to {outcomeText}.
              </p>
            )}
        </div>

        {isPsm3Collateral && (
          <Alert type="info">
            Limit orders are not available with {selectedCollateral.symbol}. Use market swap instead.
          </Alert>
        )}

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

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2 px-[12px] py-[10px] border border-[var(--border)] rounded-[8px] text-[12.5px] text-ink-3">
            <span className="flex items-center gap-1.5">
              <Parameter width="14px" height="14px" />
              Max slippage {maxSlippage}%{isInstantSwap && " — Instant"}
            </span>
            <button
              type="button"
              className="text-blue font-semibold text-[12px] hover:text-blue-hover"
              onClick={() => setShowMaxSlippage(true)}
            >
              More
            </button>
          </div>
        </div>
        {renderButtons()}
      </form>
    </>
  );
}
