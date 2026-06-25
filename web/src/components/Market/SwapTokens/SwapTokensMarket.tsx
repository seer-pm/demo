import { useTrade } from "@/hooks/trade/useTrade";
import { useTokenUsdPrice } from "@/hooks/useTokenUsdPrice";
import useDebounce from "@/hooks/useDebounce";
import { useModal } from "@/hooks/useModal";

import { usePriceFromVolume } from "@/hooks/liquidity/usePriceUntilVolume";
import { useTradeConditions } from "@/hooks/trade/useTradeConditions";
import { useGlobalState } from "@/hooks/useGlobalState";
import { Parameter, QuestionIcon } from "@/lib/icons";
import { displayBalance, displayNumber, isUndefined } from "@/lib/utils";
import { useQuoteTrade } from "@seer-pm/react";
import { isSeerCredits } from "@seer-pm/sdk";
import { FUTARCHY_LP_PAIRS_MAPPING, Market } from "@seer-pm/sdk";
import { type Token, getCollateralPerShare, getOutcomeTokenVolume } from "@seer-pm/sdk";
import { MarketTypes, getActivePrimaryCollateral, getMarketType } from "@seer-pm/sdk";
import { CoWTrade, SwaprV3Trade, TradeType, UniswapTrade } from "@seer-pm/sdk";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Address, formatUnits, parseUnits } from "viem";
import { Alert } from "../../Alert";
import { BridgeWidget } from "../../BridgeWidget";
import Button from "../../Form/Button";
import Input from "../../Form/Input";
import AltCollateralSwitch from "../AltCollateralSwitch";
import { SwapTokensConfirmation } from "./SwapTokensConfirmation";
import { TokenSelector } from "./TokenSelector";
import { PotentialReturn } from "./components/PotentialReturn";
import SwapButtons from "./components/SwapButtons";

interface SwapFormValues {
  type: "buy" | "sell";
  amount: string;
  amountOut: string;
}

interface SwapTokensMarketProps {
  market: Market;
  outcomeIndex: number;
  outcomeToken: Token;
  fixedCollateral: Token | undefined;
  setShowMaxSlippage: (isShow: boolean) => void;
  outcomeImage?: string;
  isInvalidOutcome: boolean;
  onOutcomeChange: (i: number, isClick: boolean) => void;
}

export function FutarchyTokenSwitch({
  market,
  outcomeIndex,
  onOutcomeChange,
}: {
  market: Market;
  outcomeIndex: number;
  onOutcomeChange: (i: number, isClick: boolean) => void;
}) {
  const collateralPair = [outcomeIndex, FUTARCHY_LP_PAIRS_MAPPING[outcomeIndex]]
    .sort()
    .map((collateralIndex) => market.wrappedTokens[collateralIndex]) as [Address, Address];

  return (
    <AltCollateralSwitch
      key={collateralPair.join("-")}
      onChange={() => onOutcomeChange(FUTARCHY_LP_PAIRS_MAPPING[outcomeIndex], true)}
      collateralPair={collateralPair}
      market={market}
    />
  );
}

function FutarchyPricePerShare({
  swapType,
  collateralPerShare,
  buyToken,
  sellToken,
  outcomeIndex,
}: {
  swapType: "buy" | "sell";
  collateralPerShare: number;
  buyToken: Token;
  sellToken: Token;
  outcomeIndex: number;
}) {
  const tokenPair = outcomeIndex <= 1 ? [buyToken.symbol, sellToken.symbol] : [sellToken.symbol, buyToken.symbol];
  const swapTerms = swapType === "sell" ? `${tokenPair[1]} / ${tokenPair[0]}` : `${tokenPair[0]} / ${tokenPair[1]}`;

  return (
    <div className="flex items-center gap-2">
      {collateralPerShare > 0
        ? displayNumber(
            swapType === "sell"
              ? outcomeIndex <= 1
                ? collateralPerShare
                : 1 / collateralPerShare
              : outcomeIndex <= 1
                ? 1 / collateralPerShare
                : collateralPerShare,
            3,
          )
        : 0}{" "}
      {swapTerms}
    </div>
  );
}

export function SwapTokensMarket({
  market,
  outcomeIndex,
  outcomeToken,
  setShowMaxSlippage,
  fixedCollateral,
  outcomeImage,
  isInvalidOutcome,
  onOutcomeChange,
}: SwapTokensMarketProps) {
  const amountRef = useRef<HTMLInputElement | null>(null);
  const amountOutRef = useRef<HTMLInputElement | null>(null);
  const [tradeType, setTradeType] = useState(TradeType.EXACT_INPUT);
  const [swapType, setSwapType] = useState<"buy" | "sell">("buy");
  // Accumulating rotation for the swap-direction button (180° per click).
  const [swapRotation, setSwapRotation] = useState(0);
  const setPreferredCollateral = useGlobalState((state) => state.setPreferredCollateral);
  const primaryCollateral = getActivePrimaryCollateral(market.chainId);
  const useFormReturn = useForm<SwapFormValues>({
    mode: "all",
    defaultValues: {
      type: "buy",
      amount: "",
      amountOut: "",
    },
  });

  const {
    register,
    reset,
    formState: { isValid, dirtyFields, errors },
    handleSubmit,
    watch,
    setValue,
    trigger,
    setFocus,
    resetField,
  } = useFormReturn;

  const [amount, amountOut] = watch(["amount", "amountOut"]);

  const {
    Modal: ConfirmSwapModal,
    openModal: openConfirmSwapModal,
    closeModal: closeConfirmSwapModal,
  } = useModal("confirm-swap-modal");

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
    amountErrorMessage,
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

  const debouncedAmount = useDebounce(amount, 500);
  const debouncedAmountOut = useDebounce(amountOut, 500);

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
    market,
    outcomeIndex,
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
    quoteData?.psm3Leg,
    quoteData?.completeSetLeg,
  );

  const onSubmit = async (trade: CoWTrade | SwaprV3Trade | UniswapTrade) => {
    await tradeTokens.mutateAsync({
      trade,
      account: account!,
      isBuyExactOutputNative,
      isSellToNative,
      isSeerCredits: isSeerCreditsCollateral,
      psm3Leg: quoteData?.psm3Leg,
      completeSetLeg: quoteData?.completeSetLeg,
    });
  };

  // calculate price per share
  const receivedAmount =
    tradeType === TradeType.EXACT_INPUT
      ? quoteData
        ? Number(formatUnits(quoteData.value, quoteData.decimals))
        : 0
      : Number(amountOut);

  const collateralPerShare = useMemo(() => {
    if (!quoteData) {
      return 0;
    }
    if (quoteData.route === "mintSell" && swapType === "buy") {
      const tokensOut = Number(formatUnits(quoteData.value, quoteData.decimals));
      return tokensOut > 0 ? Number(quoteData.sellAmount) / tokensOut : 0;
    }
    if (quoteData.route === "buyMerge" && swapType === "sell") {
      const tokensIn = Number(quoteData.sellAmount);
      const collateralOut = Number(formatUnits(quoteData.value, quoteData.decimals));
      return tokensIn > 0 ? collateralOut / tokensIn : 0;
    }
    return getCollateralPerShare(quoteData, swapType);
  }, [quoteData, swapType]);

  const outcomeText = market.outcomes[outcomeIndex];
  // check if current token price higher than 1 (primary) collateral per token
  const isPriceTooHigh =
    market.type === "Generic" &&
    collateralPerShare * (isSecondaryCollateral ? assetsToShares : 1) > 1 &&
    swapType === "buy";

  const limitPriceFromVolume = usePriceFromVolume(
    market,
    outcomeToken.address,
    swapType,
    getOutcomeTokenVolume(quoteData, swapType),
  );
  const resetInputs = () => {
    resetField("amount");
    resetField("amountOut");
  };

  const usdPrice = useTokenUsdPrice(sellToken?.symbol);
  const collateralUsdPrice = useTokenUsdPrice(selectedCollateral?.symbol);
  const isSellingCollateral = swapType === "buy";

  // Current input as a float (defaults to 0 if blank / non-numeric so
  // the additive buttons start from a known number, not NaN).
  const currentAmountFloat = (): number => {
    const n = Number(amount);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  };

  // Full balance as a float in token units (formatUnits → string → Number).
  const balanceTokens = (): number => Number(formatUnits(balance, sellToken.decimals));

  // Single-write helper for all quick actions: clamps to [0, balance],
  // sets trade-type to EXACT_INPUT (the quote should size off our input,
  // not derive backwards from output), and resets the input's scroll
  // position so the start of the number stays visible after large jumps.
  const setAmountTokens = (next: number) => {
    setTradeType(TradeType.EXACT_INPUT);
    const max = balanceTokens();
    const clamped = Math.max(0, Math.min(next, max));
    // Trim trailing zeros so the input doesn't look messy (e.g. "5.00000000")
    // but keep enough precision that small percent increments aren't lost
    // (1% of a 100-token balance must still read as 1, not 0).
    const formatted = clamped.toFixed(sellToken.decimals).replace(/\.?0+$/, "") || "0";
    setValue("amount", formatted, { shouldValidate: true, shouldDirty: true });
    requestAnimationFrame(() => {
      if (amountRef.current) {
        amountRef.current.scrollLeft = 0;
      }
    });
  };

  // Additive: clicking +10% three times → 30% added on top of the
  // current input, NOT a re-set to 30% (the "+" in the label is the
  // promise to the user that these accumulate).
  const addPercentOfBalance = (pct: number) => {
    const inc = balanceTokens() * (pct / 100);
    setAmountTokens(currentAmountFloat() + inc);
  };

  // Additive: +$X / per-token-USD-price → tokens to add. If price
  // somehow isn't known we treat 1:1 ($X ≈ X tokens) — every collateral
  // we currently support is within ~10 % of 1.0 USD anyway, so the
  // fallback is "off by at most a tenth" rather than broken.
  const addUsdAmount = (usd: number) => {
    const price = usdPrice && usdPrice > 0 ? usdPrice : 1;
    setAmountTokens(currentAmountFloat() + usd / price);
  };

  const disabledCtaClassName =
    // `!cursor-pointer` is the hand cursor (not the "blocked" circle).
    // The CTA is disabled but the design treats it as actionable-looking
    // (red + hover lift), so the hand cursor matches the visual affordance.
    "w-full !rounded-[8px] !bg-[#ea1d21] !text-white !text-[14px] !border-transparent !opacity-100 !pointer-events-auto !cursor-pointer shadow-none hover:!shadow-[0_4px_12px_-4px_rgba(234,29,33,0.35)] transition-shadow duration-150";

  const renderButtons = () => {
    if (isCowFastQuote) {
      return (
        <Button
          variant="primary"
          type="button"
          disabled={true}
          isLoading={true}
          className={disabledCtaClassName}
          text="Calculating best price..."
        />
      );
    }
    if (amountErrorMessage && amountErrorMessage !== "This field is required.") {
      return (
        <Button
          variant="primary"
          className={disabledCtaClassName}
          type="button"
          disabled={true}
          text={amountErrorMessage}
        />
      );
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
            !isValid ||
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
      return (
        <Button
          variant="primary"
          type="button"
          className={disabledCtaClassName}
          disabled={true}
          isLoading={true}
          text=""
        />
      );
    }
    return (
      <Button
        variant="primary"
        className={disabledCtaClassName}
        type="button"
        disabled={true}
        text="Enter an amount"
      />
    );
  };

  // useEffects

  useEffect(() => {
    dirtyFields["amount"] && trigger("amount");
  }, [balance]);

  useEffect(() => {
    resetInputs();
  }, [swapType, selectedCollateral.address, outcomeToken.address]);

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

  return (
    <>
      <ConfirmSwapModal
        title="Confirm Swap"
        content={
          <SwapTokensConfirmation
            trade={quoteData?.trade}
            quoteData={quoteData}
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
        <div>
          {/* You pay */}
          <div className="io-block">
            <div className="io-label">
              <span>You pay</span>
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
                  })}
                  ref={(el) => {
                    amountRef.current = el;
                    register("amount").ref(el);
                  }}
                  onWheel={(event) => {
                    event.currentTarget.blur();
                    requestAnimationFrame(() => {
                      amountRef.current?.focus({ preventScroll: true });
                    });
                  }}
                  onChange={(e) => {
                    setTradeType(TradeType.EXACT_INPUT);
                    register("amount").onChange(e);
                  }}
                  className="w-full p-0 h-auto font-display text-[22px] tracking-tight tabular-nums !bg-transparent !border-0 !rounded-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus:outline-none focus:!border-transparent focus:!shadow-none focus:ring-0"
                  placeholder="0"
                  useFormReturn={useFormReturn}
                  errorClassName="hidden"
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
                  // BUY mode → USD eq = input × sellToken (collateral) USD price.
                  // SELL mode → USD eq = amountOut (collateral the user
                  //   will receive) × collateral USD price. This is what
                  //   "fed from the same number as 'You will get'" means:
                  //   we read the receive-side value and convert that.
                  const usd = isSellingCollateral
                    ? Number(amount || 0) * (usdPrice || 1)
                    : Number(amountOut || 0) * (collateralUsdPrice || 1);
                  return usd > 0 ? `$${usd.toFixed(2)}` : "$0.00";
                })()}
              </span>
              <div className="quick-group">
                <button
                  type="button"
                  className="quick-btn quick-btn--full"
                  onClick={() => setAmountTokens(balanceTokens() / 2)}
                >
                  HALF
                </button>
                <button
                  type="button"
                  className="quick-btn quick-btn--full"
                  onClick={() => {
                    setTradeType(TradeType.EXACT_INPUT);
                    setValue("amount", formatUnits(balance, sellToken.decimals), {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                    requestAnimationFrame(() => {
                      if (amountRef.current) {
                        amountRef.current.scrollLeft = 0;
                      }
                    });
                  }}
                >
                  MAX
                </button>
              </div>
            </div>
            <div className="io-quick-actions">
              <div className="quick-group">
                {[1, 5, 10].map((n) => (
                  <button
                    key={`amount-${n}`}
                    type="button"
                    className="quick-btn quick-btn--dollar"
                    onClick={() =>
                      isSellingCollateral
                        ? addUsdAmount(n)
                        : setAmountTokens(currentAmountFloat() + n)
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
          </div>

          {/* Swap direction button: rotates 180° on each click */}
          <div className="io-swap-wrap">
            <button
              type="button"
              aria-label="Swap pay and receive"
              onClick={() => {
                setSwapType((state) => (state === "buy" ? "sell" : "buy"));
                setSwapRotation((r) => r + 180);
                setFocus("amount");
              }}
              className="io-swap"
            >
              <svg
                className="io-swap-icon"
                viewBox="0 0 18 18"
                fill="none"
                aria-hidden="true"
                style={{ transform: `rotate(${swapRotation}deg)` }}
              >
                <path
                  d="M5.25 13.5V4.5M5.25 4.5L2.5 7.25M5.25 4.5L8 7.25"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M12.75 4.5V13.5M12.75 13.5L10 10.75M12.75 13.5L15.5 10.75"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>

          {/* You will get */}
          <div className="io-block !mb-0">
            <div className="io-label">
              <span>You will get</span>
              <span>≈</span>
            </div>
            <div className="io-row">
              <div className="flex-1 min-w-0">
                <Input
                  autoComplete="off"
                  type="number"
                  step="any"
                  min="0"
                  {...register("amountOut")}
                  onChange={(e) => {
                    setTradeType(TradeType.EXACT_OUTPUT);
                    register("amountOut").onChange(e);
                  }}
                  ref={(el) => {
                    amountOutRef.current = el;
                    register("amountOut").ref(el);
                  }}
                  onWheel={(event) => {
                    event.currentTarget.blur();
                    requestAnimationFrame(() => {
                      amountOutRef.current?.focus({ preventScroll: true });
                    });
                  }}
                  className="w-full p-0 h-auto font-display text-[22px] tracking-tight tabular-nums !bg-transparent !border-0 !rounded-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus:outline-none focus:!border-transparent focus:!shadow-none focus:ring-0"
                  placeholder="0"
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
              ) : market.type === "Futarchy" ? (
                <FutarchyPricePerShare
                  {...{
                    swapType,
                    collateralPerShare,
                    buyToken,
                    sellToken,
                    outcomeIndex,
                  }}
                />
              ) : (
                <div className="flex items-center gap-2 font-mono tabular-nums font-semibold text-ink">
                  {collateralPerShare.toFixed(3)} {selectedCollateral.symbol}
                  {isSecondaryCollateral && (
                    <span className="tooltip">
                      <p className="tooltiptext">
                        {(collateralPerShare * assetsToShares).toFixed(3)} {primaryCollateral.symbol}
                      </p>
                      <QuestionIcon fill="var(--blue)" />
                    </span>
                  )}
                </div>
              )}
            </div>

            {!!limitPriceFromVolume && (
              <div className="flex justify-between items-baseline text-[13px]">
                <span className="text-ink-4 font-medium">Price after {swapType}</span>
                {quoteIsLoading || isFetching ? (
                  <div className="shimmer-container ml-2 w-[100px]" />
                ) : (
                  <div className="flex items-center gap-2 font-mono tabular-nums font-semibold text-ink">
                    {(isSecondaryCollateral ? limitPriceFromVolume * sharesToAssets : limitPriceFromVolume).toFixed(3)}{" "}
                    {selectedCollateral.symbol}
                    {isSecondaryCollateral && (
                      <span className="tooltip">
                        <p className="tooltiptext">
                          {limitPriceFromVolume.toFixed(3)} {primaryCollateral.symbol}
                        </p>
                        <QuestionIcon fill="var(--blue)" />
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

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

        {isPriceTooHigh && (
          <Alert type="warning">
            Price exceeds 1 {isSecondaryCollateral ? primaryCollateral.symbol : selectedCollateral.symbol} per share.
            Try to reduce the input amount.
          </Alert>
        )}
        {quoteError && (
          <Alert type="error">
            {quoteError.message
              ? quoteError.message === "No route found"
                ? "Not enough liquidity. Try to reduce the input amount."
                : quoteError.message
              : "Error when quoting price"}
          </Alert>
        )}

        <div className="space-y-3">
          {market.type === "Futarchy" && (
            <FutarchyTokenSwitch market={market} outcomeIndex={outcomeIndex} onOutcomeChange={onOutcomeChange} />
          )}
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
