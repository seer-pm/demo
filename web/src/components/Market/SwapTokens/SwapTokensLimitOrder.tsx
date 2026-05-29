import { useTradeConditions } from "@/hooks/trade/useTradeConditions";
import useDebounce from "@/hooks/useDebounce";
import { useGlobalState } from "@/hooks/useGlobalState";
import { useModal } from "@/hooks/useModal";
import { paths } from "@/lib/paths";
import { toastifyTx } from "@/lib/toastify";
import { displayBalance, displayNumber, isUndefined } from "@/lib/utils";
import { useMissingApprovals, useTokenBalance } from "@seer-pm/react";
import {
  useIsOrderBookPoolInitialized,
  useOrderBookPoolParams,
  useV4PoolState,
} from "@seer-pm/react/hooks/useIsOrderBookPoolInitialized";
import { usePlaceV4LimitOrder } from "@seer-pm/react/hooks/usePlaceV4LimitOrder";
import { TradeType, getActivePrimaryCollateral } from "@seer-pm/sdk";
import type { Market, Token } from "@seer-pm/sdk";
import {
  computeLimitOrderParams,
  formatLimitOrderPriceHint,
  getLimitOrderHookAddress,
  getNearestLimitOrderPrice,
  getOutcomePriceAtTick,
  resolveLimitOrderZeroForOne,
} from "@seer-pm/sdk/order-book";
import clsx from "clsx";
import { useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { formatUnits, maxUint256, parseUnits } from "viem";
import { Alert } from "../../Alert";
import { ApproveButton } from "../../Form/ApproveButton";
import Button from "../../Form/Button";
import Input from "../../Form/Input";
import { SwitchChainButtonWrapper } from "../../Form/SwitchChainButtonWrapper";
import { MarketCollateralDropdown } from "../CollateralDropdown";
import { OutcomeImage } from "../OutcomeImage";
import { V4LimitOrderConfirmation } from "./V4LimitOrderConfirmation";

interface SwapFormValues {
  shares: string;
  limitPrice: string;
}

interface SwapTokensLimitOrderProps {
  market: Market;
  outcomeIndex: number;
  outcomeToken: Token;
  fixedCollateral: Token | undefined;
  outcomeImage?: string;
  isInvalidOutcome: boolean;
  onAddLiquidity: () => void;
}

function sharesToPayAmount(
  swapType: "buy" | "sell",
  shareAmount: bigint,
  nearestPrice: number,
  collateralDecimals: number,
  shareDecimals: number,
): bigint {
  if (swapType === "sell") {
    return shareAmount;
  }

  const shareHuman = Number(formatUnits(shareAmount, shareDecimals));
  return parseUnits((shareHuman * nearestPrice).toFixed(collateralDecimals), collateralDecimals);
}

function getEffectiveLimitPrice(limitPrice: string, outcomeIsToken0: boolean): number | undefined {
  const parsed = limitPrice ? Number(limitPrice) : undefined;
  if (!parsed || parsed <= 0 || parsed >= 1) {
    return undefined;
  }
  return getNearestLimitOrderPrice(parsed, outcomeIsToken0).nearestPrice;
}

export function SwapTokensLimitOrder({
  market,
  outcomeIndex,
  outcomeToken,
  fixedCollateral,
  outcomeImage,
  isInvalidOutcome,
  onAddLiquidity,
}: SwapTokensLimitOrderProps) {
  const sharesRef = useRef<HTMLInputElement | null>(null);
  const limitPriceRef = useRef<HTMLInputElement | null>(null);
  const [swapType, setSwapType] = useState<"buy" | "sell">("buy");
  const primaryCollateral = getActivePrimaryCollateral(market.chainId);
  const setPreferredCollateral = useGlobalState((state) => state.setPreferredCollateral);

  const useFormReturn = useForm<SwapFormValues>({
    mode: "all",
    defaultValues: {
      shares: "",
      limitPrice: "",
    },
  });

  const {
    register,
    reset,
    formState: { errors },
    handleSubmit,
    watch,
    setValue,
  } = useFormReturn;

  const [shares, limitPrice] = watch(["shares", "limitPrice"]);
  const debouncedShares = useDebounce(shares, 500);
  const debouncedLimitPrice = useDebounce(limitPrice, 500);

  const { account, buyToken, sellToken, selectedCollateral } = useTradeConditions({
    market,
    fixedCollateral,
    outcomeToken,
    swapType,
    tradeType: TradeType.EXACT_INPUT,
    errors: {},
  });

  const { data: outcomeBalance = 0n, isFetching: isFetchingOutcomeBalance } = useTokenBalance(
    account,
    outcomeToken.address,
    market.chainId,
  );
  const { data: collateralBalance = 0n, isFetching: isFetchingCollateralBalance } = useTokenBalance(
    account,
    selectedCollateral.address,
    market.chainId,
  );

  const poolParams = useOrderBookPoolParams(market, outcomeIndex);
  const { data: isPoolInitialized, isLoading: isPoolStatusLoading } = useIsOrderBookPoolInitialized(
    market,
    outcomeIndex,
  );
  const { data: poolState } = useV4PoolState(market, outcomeIndex);

  const placeLimitOrder = usePlaceV4LimitOrder(toastifyTx);

  const {
    Modal: ConfirmModal,
    openModal: openConfirmModal,
    closeModal: closeConfirmModal,
  } = useModal("confirm-v4-limit-order-modal");

  const outcomeText = market.outcomes[outcomeIndex];
  const outcomeIsToken0 = poolParams?.outcomeIsToken0 ?? false;
  const hookAddress = getLimitOrderHookAddress(market.chainId);

  const currentMarketPrice = useMemo(() => {
    if (!poolState) {
      return undefined;
    }
    return getOutcomePriceAtTick(poolState.tick, outcomeIsToken0);
  }, [poolState, outcomeIsToken0]);

  const limitPriceHint = useMemo(() => {
    if (currentMarketPrice === undefined) {
      return undefined;
    }
    return formatLimitOrderPriceHint(swapType, outcomeIsToken0, currentMarketPrice);
  }, [swapType, outcomeIsToken0, currentMarketPrice]);

  const handleSwapTypeChange = (nextSwapType: "buy" | "sell") => {
    setSwapType(nextSwapType);
    setValue("shares", "", { shouldValidate: false });
    setValue("limitPrice", "", { shouldValidate: false });
  };

  const parsedLimitPrice = debouncedLimitPrice ? Number(debouncedLimitPrice) : undefined;

  const nearestPriceInfo = useMemo(() => {
    if (!parsedLimitPrice || parsedLimitPrice <= 0 || parsedLimitPrice >= 1) {
      return undefined;
    }
    return getNearestLimitOrderPrice(parsedLimitPrice, outcomeIsToken0);
  }, [parsedLimitPrice, outcomeIsToken0]);

  const parsedShareAmount = useMemo(() => {
    if (!debouncedShares) return undefined;
    try {
      return parseUnits(debouncedShares, outcomeToken.decimals);
    } catch {
      return undefined;
    }
  }, [debouncedShares, outcomeToken.decimals]);

  const parsedPayAmount = useMemo(() => {
    if (!parsedShareAmount || parsedShareAmount <= 0n) {
      return undefined;
    }

    if (swapType === "sell") {
      return parsedShareAmount;
    }

    if (!nearestPriceInfo) {
      return undefined;
    }

    return sharesToPayAmount(
      swapType,
      parsedShareAmount,
      nearestPriceInfo.nearestPrice,
      selectedCollateral.decimals,
      outcomeToken.decimals,
    );
  }, [parsedShareAmount, swapType, nearestPriceInfo, selectedCollateral.decimals, outcomeToken.decimals]);

  const orderPreview = useMemo(() => {
    if (!poolParams || !poolState || !parsedLimitPrice || !parsedPayAmount || parsedPayAmount <= 0n) {
      return { error: null as string | null, data: null };
    }

    try {
      const data = computeLimitOrderParams({
        chainId: market.chainId,
        poolKey: poolParams.poolKey,
        outcomeIsToken0,
        swapType,
        limitPrice: parsedLimitPrice,
        payAmount: parsedPayAmount,
        currentTick: poolState.tick,
        sqrtPriceX96: poolState.sqrtPriceX96,
        payDecimals: sellToken.decimals,
        receiveDecimals: buyToken.decimals,
      });
      return { error: null, data };
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Unable to compute order", data: null };
    }
  }, [
    poolParams,
    poolState,
    parsedLimitPrice,
    parsedPayAmount,
    market.chainId,
    outcomeIsToken0,
    swapType,
    sellToken.decimals,
    buyToken.decimals,
  ]);

  const totalPayAmount =
    orderPreview.data?.payToken === "token0" ? orderPreview.data.totalPay.amount0 : orderPreview.data?.totalPay.amount1;
  const minReceiveAmount =
    orderPreview.data?.receiveToken === "token0"
      ? orderPreview.data.minReceive.amount0
      : orderPreview.data?.minReceive.amount1;

  const collateralAmount = swapType === "buy" ? totalPayAmount : minReceiveAmount;
  const shareAmountPreview = swapType === "buy" ? minReceiveAmount : parsedShareAmount;

  const payTokenAddress = useMemo(() => {
    if (!poolParams) {
      return sellToken.address;
    }
    const zeroForOne = resolveLimitOrderZeroForOne(swapType, outcomeIsToken0);
    return zeroForOne ? poolParams.token0 : poolParams.token1;
  }, [poolParams, swapType, outcomeIsToken0, sellToken.address]);

  const approvalAmount = totalPayAmount && totalPayAmount > 0n ? totalPayAmount : parsedPayAmount;

  const { data: missingApprovals = [], isLoading: isLoadingApprovals } = useMissingApprovals(
    hookAddress && account && approvalAmount && approvalAmount > 0n
      ? {
          tokensAddresses: [payTokenAddress],
          account,
          spender: hookAddress,
          amounts: approvalAmount,
          chainId: market.chainId,
        }
      : undefined,
  );

  const showNearestPrice =
    nearestPriceInfo && parsedLimitPrice && Math.abs(nearestPriceInfo.nearestPrice - parsedLimitPrice) > 0.0001;

  const maxShares = swapType === "sell" ? outcomeBalance : 0n;
  const isFetchingBalance = isFetchingOutcomeBalance || isFetchingCollateralBalance;

  const handlePlaceOrder = async () => {
    if (!account || !parsedPayAmount || !parsedLimitPrice) {
      return;
    }

    await placeLimitOrder.mutateAsync({
      market,
      outcomeIndex,
      account,
      swapType,
      limitPrice: parsedLimitPrice,
      payAmount: parsedPayAmount,
      payDecimals: sellToken.decimals,
      receiveDecimals: buyToken.decimals,
    });
    reset();
    closeConfirmModal();
  };

  const renderButton = () => {
    if (!account) {
      return <Button variant="primary" className="w-full" type="button" disabled text="Connect wallet" />;
    }

    if (isPoolStatusLoading) {
      return <Button variant="primary" className="w-full" type="button" disabled isLoading text="" />;
    }

    if (!isPoolInitialized) {
      return (
        <Button
          variant="primary"
          className="w-full"
          type="button"
          text="Add liquidity to enable limit orders"
          onClick={onAddLiquidity}
        />
      );
    }

    if (errors.shares?.message && errors.shares.message !== "This field is required.") {
      return <Button variant="primary" className="w-full" type="button" disabled text={errors.shares.message} />;
    }

    if (orderPreview.error) {
      return <Button variant="primary" className="w-full" type="button" disabled text="Invalid limit price" />;
    }

    if (!orderPreview.data) {
      return <Button variant="primary" className="w-full" type="button" disabled text="Enter limit price and shares" />;
    }

    if (isLoadingApprovals) {
      return <Button variant="primary" className="w-full" type="button" disabled isLoading text="" />;
    }

    if (missingApprovals.length > 0) {
      const approval = missingApprovals[0];
      return (
        <ApproveButton
          tokenAddress={approval.address}
          tokenName={approval.name}
          spender={approval.spender}
          amount={maxUint256}
          chainId={market.chainId}
        />
      );
    }

    return (
      <Button
        variant="primary"
        className="w-full"
        type="submit"
        text="Place limit order"
        isLoading={placeLimitOrder.isPending}
      />
    );
  };

  const shareSymbol = outcomeText ?? outcomeToken.symbol;
  const collateralSummaryAmount =
    collateralAmount && collateralAmount > 0n
      ? displayNumber(Number(formatUnits(collateralAmount, selectedCollateral.decimals)), 4)
      : shares && limitPrice
        ? displayNumber(Number(shares) * Number(limitPrice), 4)
        : "0";
  const sharesSummaryAmount =
    shareAmountPreview && shareAmountPreview > 0n
      ? displayNumber(Number(formatUnits(shareAmountPreview, outcomeToken.decimals)), 4)
      : shares || "0";

  return (
    <>
      <ConfirmModal
        title="Confirm Limit Order"
        content={
          orderPreview.data && (
            <V4LimitOrderConfirmation
              closeModal={closeConfirmModal}
              onSubmit={handlePlaceOrder}
              swapType={swapType}
              shareAmount={
                shareAmountPreview && shareAmountPreview > 0n
                  ? formatUnits(shareAmountPreview, outcomeToken.decimals)
                  : shares
              }
              shareSymbol={shareSymbol}
              collateralAmount={
                collateralAmount && collateralAmount > 0n
                  ? formatUnits(collateralAmount, selectedCollateral.decimals)
                  : shares && limitPrice
                    ? (Number(shares) * Number(limitPrice)).toFixed(selectedCollateral.decimals)
                    : "0"
              }
              collateralSymbol={selectedCollateral.symbol}
              limitPrice={parsedLimitPrice ?? 0}
              nearestPrice={showNearestPrice ? nearestPriceInfo?.nearestPrice : undefined}
              isLoading={placeLimitOrder.isPending}
            />
          )
        }
      />

      <form onSubmit={handleSubmit(openConfirmModal)} className="space-y-5">
        <div role="tablist" className="tabs tabs-bordered font-semibold">
          <button
            type="button"
            role="tab"
            className={clsx("tab flex-1", swapType === "buy" && "tab-active")}
            onClick={() => handleSwapTypeChange("buy")}
          >
            Buy
          </button>
          <button
            type="button"
            role="tab"
            className={clsx("tab flex-1", swapType === "sell" && "tab-active")}
            onClick={() => handleSwapTypeChange("sell")}
          >
            Sell
          </button>
        </div>

        <div className={clsx("rounded-[12px] p-4 space-y-2 border border-[#2222220d]")}>
          <div className="flex items-center justify-between gap-2">
            <p className="text-base-content/70">Limit price</p>
            <div className="flex items-center gap-2">
              {currentMarketPrice !== undefined && (
                <p className="text-[14px] text-base-content/70">
                  Market: {displayNumber(currentMarketPrice, 3)} {selectedCollateral.symbol}
                </p>
              )}
              {isUndefined(fixedCollateral) && (
                <MarketCollateralDropdown
                  market={market}
                  type={swapType}
                  selectedCollateral={selectedCollateral}
                  setSelectedCollateral={(collateral) => setPreferredCollateral(collateral, market.chainId)}
                />
              )}
            </div>
          </div>
          {limitPriceHint && <p className="text-[13px] text-base-content/60">{limitPriceHint}</p>}
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
                    const num = Number(v);
                    if (Number.isNaN(num) || num <= 0) {
                      return "Limit price must be greater than 0.";
                    }
                    if (num >= 1) {
                      return "Limit price must be less than 1.";
                    }
                    return true;
                  },
                  onChange: (e) => {
                    const value = e.target.value;
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
          <p className="text-base-content/70">Shares</p>
          <div className="flex justify-between items-start">
            <div>
              <Input
                autoComplete="off"
                type="number"
                step="any"
                min="0"
                {...register("shares", {
                  required: "This field is required.",
                  validate: (v) => {
                    if (Number.isNaN(Number(v)) || Number(v) <= 0) {
                      return "Shares must be greater than 0.";
                    }

                    let shareAmount: bigint;
                    try {
                      shareAmount = parseUnits(v, outcomeToken.decimals);
                    } catch {
                      return "Invalid share amount.";
                    }

                    if (swapType === "sell") {
                      if (shareAmount > outcomeBalance) {
                        return "Not enough balance.";
                      }
                      return true;
                    }

                    const price = getEffectiveLimitPrice(limitPrice, outcomeIsToken0);
                    if (!price) {
                      return "Enter a limit price.";
                    }

                    const payAmount = sharesToPayAmount(
                      "buy",
                      shareAmount,
                      price,
                      selectedCollateral.decimals,
                      outcomeToken.decimals,
                    );
                    if (payAmount > collateralBalance) {
                      return "Not enough balance.";
                    }

                    return true;
                  },
                })}
                ref={(el) => {
                  sharesRef.current = el;
                  register("shares").ref(el);
                }}
                onWheel={(event) => {
                  event.currentTarget.blur();
                  requestAnimationFrame(() => {
                    sharesRef.current?.focus({ preventScroll: true });
                  });
                }}
                className="w-full min-w-[50px] p-0 h-auto text-[24px] !bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none border-0 focus:outline-transparent focus:ring-0 focus:border-0"
                placeholder="0"
                useFormReturn={useFormReturn}
                errorClassName="hidden"
              />
            </div>
            <div className="flex items-center gap-1 rounded-full border border-[#f2f2f2] dark:border-neutral px-3 py-1 shadow-[0_0_10px_rgba(34,34,34,0.04)]">
              <div className="rounded-full w-6 h-6 overflow-hidden flex-shrink-0">
                <OutcomeImage
                  className="w-full h-full"
                  image={outcomeImage}
                  isInvalidOutcome={isInvalidOutcome}
                  title={outcomeText}
                />
              </div>
              <p className="font-semibold text-[16px]">{shareSymbol}</p>
            </div>
          </div>
          {swapType === "sell" && (
            <div className="flex justify-end">
              {isFetchingBalance ? (
                <div className="shimmer-container w-[80px] h-[13px]" />
              ) : (
                <div className="flex items-center gap-1">
                  <p className="text-[14px] font-semibold text-base-content/70">
                    {displayBalance(outcomeBalance, outcomeToken.decimals)} {shareSymbol}
                  </p>
                  <button
                    type="button"
                    className={clsx(
                      "text-[14px] font-semibold text-base-content/70 rounded-[12px] border border-[#2222220d] py-1 px-[6px] bg-base-200/80 hover:bg-base-300/60",
                      maxShares === 0n && "opacity-50 cursor-not-allowed",
                    )}
                    disabled={maxShares === 0n}
                    onClick={() => {
                      if (maxShares === 0n) return;
                      setValue("shares", formatUnits(maxShares, outcomeToken.decimals), {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                    }}
                  >
                    Max
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {!isPoolInitialized && !isPoolStatusLoading && (
          <Alert type="warning">
            The V4 pool is not initialized yet.{" "}
            <button type="button" onClick={onAddLiquidity} className="text-purple-primary hover:underline">
              Add liquidity
            </button>{" "}
            to enable limit orders.
          </Alert>
        )}

        <div className="space-y-1">
          {currentMarketPrice !== undefined && (
            <div className="flex justify-between text-[#828282] text-[14px]">
              Current market price
              <span>
                {displayNumber(currentMarketPrice, 3)} {selectedCollateral.symbol}
              </span>
            </div>
          )}
          {showNearestPrice && (
            <div className="flex justify-between text-[#828282] text-[14px]">
              The nearest available price
              <span>
                {displayNumber(nearestPriceInfo.nearestPrice, 3)} {selectedCollateral.symbol}
              </span>
            </div>
          )}
          <div className="flex justify-between text-[#828282] text-[14px]">
            Shares
            <span>
              {sharesSummaryAmount} {shareSymbol}
            </span>
          </div>
          <div className="flex justify-between text-[#828282] text-[14px]">
            {swapType === "buy" ? "Total cost" : "You'll receive"}
            <span>
              {collateralSummaryAmount} {selectedCollateral.symbol}
            </span>
          </div>
        </div>

        {orderPreview.error && isPoolInitialized && <Alert type="error">{orderPreview.error}</Alert>}

        <SwitchChainButtonWrapper chainId={market.chainId}>{renderButton()}</SwitchChainButtonWrapper>
      </form>
    </>
  );
}
