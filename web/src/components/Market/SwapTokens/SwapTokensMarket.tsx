import { useTrade } from "@/hooks/trade/useTrade";
import useDebounce from "@/hooks/useDebounce";
import { useModal } from "@/hooks/useModal";

import { usePriceFromVolume } from "@/hooks/liquidity/usePriceUntilVolume";
import { useMintToCover } from "@/hooks/trade/useMintToCover";
import { useTradeConditions } from "@/hooks/trade/useTradeConditions";
import { useGlobalState } from "@/hooks/useGlobalState";
import { useMarketTradeDraft, useOnTradeDraftCleared } from "@/hooks/useTradeFormDraft";
import { NOT_ENOUGH_BALANCE_ERROR } from "@/lib/form-errors";
import { QuestionIcon } from "@/lib/icons";
import { formatLeftoverList, summarizeLeftovers } from "@/lib/leftovers";
import { isDraftForOutcome } from "@/lib/trade-draft";
import { displayBalance, displayNumber, isUndefined } from "@/lib/utils";
import { useQuoteTrade } from "@seer-pm/react";
import { MarketTypes, getMarketType, isMintToCoverEligible, isTradingCredits } from "@seer-pm/sdk";
import { FUTARCHY_LP_PAIRS_MAPPING, Market } from "@seer-pm/sdk";
import { type Token, getCollateralPerShare, getOutcomeTokenVolume } from "@seer-pm/sdk";
import { getActivePrimaryCollateral } from "@seer-pm/sdk";
import { type AmmTrade, TradeType } from "@seer-pm/sdk";
import clsx from "clsx";
import { type ReactNode, useEffect, useId, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Address, formatUnits, parseUnits } from "viem";
import { Alert } from "../../Alert";
import { BridgeWidget } from "../../BridgeWidget";
import Button from "../../Form/Button";
import Input from "../../Form/Input";
import { SwitchChainButtonWrapper } from "../../Form/SwitchChainButtonWrapper";
import AltCollateralSwitch from "../AltCollateralSwitch";
import { SwapTokensConfirmation } from "./SwapTokensConfirmation";
import { TokenSelector } from "./TokenSelector";
import { MintToCoverNotice } from "./components/MintToCoverNotice";
import { PotentialReturn } from "./components/PotentialReturn";
import { QuoteErrorAlert } from "./components/QuoteErrorAlert";
import { SlippageButton } from "./components/SlippageButton";
import SwapButtons from "./components/SwapButtons";
import { TradeSideToggle } from "./components/TradeSideToggle";

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
  orderTypeControl?: ReactNode;
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
  orderTypeControl,
}: SwapTokensMarketProps) {
  const amountInputId = useId();
  const amountOutInputId = useId();
  const amountRef = useRef<HTMLInputElement | null>(null);
  const amountOutRef = useRef<HTMLInputElement | null>(null);
  const { getDraft, setDraft, clearDraft } = useMarketTradeDraft(market);
  // Read once: from here on this panel owns the values and writes them back to the draft.
  // A draft typed against another outcome is ignored: the amounts would not mean the same thing.
  const [draft] = useState(() => {
    const marketDraft = getDraft()?.market;
    return isDraftForOutcome(marketDraft, outcomeToken.address) ? marketDraft : undefined;
  });
  const [tradeType, setTradeType] = useState(draft?.tradeType ?? TradeType.EXACT_INPUT);
  const [swapType, setSwapType] = useState<"buy" | "sell">(draft?.swapType ?? "buy");
  const [focusContainer, setFocusContainer] = useState(0);
  const setPreferredCollateral = useGlobalState((state) => state.setPreferredCollateral);
  const primaryCollateral = getActivePrimaryCollateral(market.chainId);
  const useFormReturn = useForm<SwapFormValues>({
    mode: "all",
    defaultValues: {
      type: draft?.swapType ?? "buy",
      amount: draft?.amount ?? "",
      amountOut: draft?.amountOut ?? "",
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

  // Explicit values: the defaults were seeded from the draft, so a bare reset()
  // would put the traded amount back instead of clearing the form.
  useOnTradeDraftCleared(market, "market", () => reset({ type: swapType, amount: "", amountOut: "" }));

  const {
    Modal: ConfirmSwapModal,
    openModal: openConfirmSwapModal,
    closeModal: closeConfirmSwapModal,
  } = useModal("confirm-swap-modal");

  const {
    maxSlippage,
    account,
    parentMarket,
    isFetching,
    sharesToAssets,
    assetsToShares,
    buyToken,
    sellToken,
    showBridgeLink,
    isSecondaryCollateral,
    amountErrorMessage,
    isFetchingBalance,
    balance,
    collateralBalance,
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

  const isTradingCreditsCollateral = isTradingCredits(market.chainId, selectedCollateral.address);

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
    market,
    outcomeIndex,
  );

  const mintToCover = useMintToCover({
    market,
    outcomeIndex,
    selectedCollateral,
    outcomeToken,
    swapType,
    tradeType,
    account,
    amount,
    balance,
    collateralBalance,
    quoteData,
  });
  const isMintToCover = mintToCover.kind === "ready";
  const mintToCoverLeftovers =
    mintToCover.kind === "ready" ? (mintToCover.quote.completeSetLeg?.leftoverTokens ?? []) : [];
  // Everything downstream of the quote (trade, approvals, confirmation) must see the composite
  // route, not the plain sell it was derived from.
  const effectiveQuote = mintToCover.kind === "ready" ? mintToCover.quote : quoteData;

  const parsedAmount = useMemo(() => {
    try {
      return parseUnits(amount || "0", sellToken.decimals);
    } catch {
      return 0n;
    }
  }, [amount, sellToken.decimals]);
  const hasShortfall = parsedAmount > balance;

  // Whether a shortfall could be minted, decided without waiting for a quote so that
  // react-hook-form can answer synchronously while the quote is still in flight.
  const canMintShortfall =
    hasShortfall &&
    collateralBalance >= parsedAmount - balance &&
    isMintToCoverEligible({ market, outcomeIndex, selectedCollateral, swapType, tradeType, account });
  const canMintShortfallRef = useRef(canMintShortfall);
  canMintShortfallRef.current = canMintShortfall;

  const {
    tradeTokens,
    approvals: { data: missingApprovals = [], isLoading: isLoadingApprovals },
  } = useTrade(
    account,
    effectiveQuote?.trade,
    isTradingCreditsCollateral,
    async () => {
      clearDraft("market");
      closeConfirmSwapModal();
    },
    market,
    effectiveQuote?.psm3Leg,
    effectiveQuote?.completeSetLeg,
  );

  const onSubmit = async (trade: AmmTrade) => {
    await tradeTokens.mutateAsync({
      trade,
      account: account!,
      isTradingCredits: isTradingCreditsCollateral,
      psm3Leg: effectiveQuote?.psm3Leg,
      completeSetLeg: effectiveQuote?.completeSetLeg,
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
  // Buttons name the outcome only while it fits on one line; the header above always shows it in full.
  const actionLabel = `${swapType === "buy" ? "Buy" : "Sell"}${outcomeText.length <= 20 ? ` ${outcomeText}` : ""}`;
  const hasAmount = Number(amount) > 0 || Number(amountOut) > 0;

  // The one-line bet, repeated in the confirmation. Only categorical outcomes pay a fixed 1 per
  // token; other market types depend on where the answer lands, so they get no single figure.
  const isOneOrNothing = getMarketType(market) === MarketTypes.CATEGORICAL || outcomeToken.symbol === "SER-INVALID";
  const payoutLine =
    swapType === "buy" && market.type === "Generic" && isOneOrNothing && receivedAmount > 0
      ? `If ${outcomeText} wins, these ${displayNumber(receivedAmount)} shares pay ${displayNumber(
          isSecondaryCollateral ? receivedAmount * sharesToAssets : receivedAmount,
        )} ${selectedCollateral.symbol}.`
      : undefined;

  const resetInputs = () => {
    // defaultValue "": the form defaults were seeded from the draft, so resetting a
    // field to its default would bring the restored amount back instead of clearing it.
    resetField("amount", { defaultValue: "" });
    resetField("amountOut", { defaultValue: "" });
  };

  const renderButtons = () => {
    if (!account) {
      // Renders the connect prompt: there is no connected chain to match.
      return <SwitchChainButtonWrapper chainId={market.chainId}>{null}</SwitchChainButtonWrapper>;
    }
    if (amountErrorMessage && amountErrorMessage !== "This field is required.") {
      return <Button variant="primary" className="w-full" type="button" disabled={true} text={amountErrorMessage} />;
    }
    if (effectiveQuote?.trade) {
      return (
        <SwapButtons
          account={account}
          trade={effectiveQuote.trade}
          isDisabled={
            isUndefined(effectiveQuote?.value) ||
            effectiveQuote?.value === 0n ||
            !account ||
            !isValid ||
            tradeTokens.isPending ||
            isPriceTooHigh ||
            (hasShortfall && !isMintToCover)
          }
          text={isMintToCover ? "Mint & Sell" : actionLabel}
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
    return <Button variant="primary" className="w-full" type="button" disabled={true} text="Enter an amount" />;
  };

  // useEffects

  useEffect(() => {
    // Re-validate once the balance is known. An amount restored from the draft was
    // never typed, so it is not dirty: check the value itself, or the Swap button
    // would stay disabled until the user touches the field.
    if (!isFetchingBalance && (dirtyFields["amount"] || amount)) {
      trigger("amount");
    }
  }, [balance, isFetchingBalance, collateralBalance, canMintShortfall]);

  useEffect(() => {
    setDraft({ market: { outcomeToken: outcomeToken.address, swapType, tradeType, amount, amountOut } });
  }, [outcomeToken.address, swapType, tradeType, amount, amountOut, setDraft]);

  // Clear the inputs when the traded pair changes, but never on the first render:
  // that would throw away the draft we just restored.
  const pairKey = `${swapType}-${selectedCollateral.address}-${outcomeToken.address}`;
  const pairKeyRef = useRef(pairKey);
  useEffect(() => {
    if (pairKeyRef.current === pairKey) {
      return;
    }
    pairKeyRef.current = pairKey;
    resetInputs();
  }, [pairKey]);

  const hasQuotedRef = useRef(false);
  useEffect(() => {
    // Before the first quote lands there is nothing to derive from: leave the restored
    // draft alone instead of blanking it out.
    if (!hasQuotedRef.current && isUndefined(quoteData?.value)) {
      return;
    }
    hasQuotedRef.current = true;
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
        title={`${swapType === "buy" ? "Buy" : "Sell"} ${outcomeText}`}
        content={
          <SwapTokensConfirmation
            trade={effectiveQuote?.trade}
            quoteData={effectiveQuote}
            closeModal={closeConfirmSwapModal}
            reset={() => reset()}
            isLoading={tradeTokens.isPending}
            onSubmit={onSubmit}
            collateral={selectedCollateral}
            originalAmount={amount}
            isTradingCredits={isTradingCreditsCollateral}
            outcomeToken={outcomeToken}
            confirmText={actionLabel}
            payoutLine={payoutLine}
          />
        }
      />
      <form onSubmit={handleSubmit(openConfirmSwapModal)} className="space-y-5">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <TradeSideToggle
              value={swapType}
              outcomeText={outcomeText}
              onChange={(side) => {
                if (side === swapType) {
                  return;
                }
                setSwapType(side);
                setFocusContainer(0);
              }}
            />
          </div>
          {orderTypeControl}
        </div>
        <div className="space-y-2">
          <div
            onClick={() => {
              setFocusContainer(0);
              setFocus("amount");
            }}
            className={clsx(
              "seer-swap-amount rounded-surface p-4 space-y-2 cursor-pointer border",
              account && "h-[137px]",
              focusContainer === 0
                ? "border-[var(--seer-border)]"
                : "border-transparent bg-base-200/80 hover:bg-base-300/60",
            )}
          >
            <label htmlFor={amountInputId} className="block text-base-content/70">
              {swapType === "buy" ? "You pay" : "You sell"}
            </label>
            <div className="flex justify-between items-start gap-2">
              <div className="min-w-0 flex-1">
                <Input
                  id={amountInputId}
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

                      // Without a wallet there is no balance to check against: the quote still shows,
                      // and the button asks to connect instead.
                      if (account && val > balance && !canMintShortfallRef.current) {
                        return NOT_ENOUGH_BALANCE_ERROR;
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
                  className="w-full min-w-[50px] p-0 h-auto text-[24px] !bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none border-0 focus:outline-transparent focus:ring-0 focus:border-0"
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
                  onOutcomeChange,
                }}
              />
            </div>
            <div className={clsx("flex justify-end", !account && "hidden")}>
              {isFetchingBalance ? (
                <div className="shimmer-container w-[80px] h-[13px]" />
              ) : (
                <div className="flex items-center gap-1">
                  <p className="text-[14px] font-semibold text-base-content/70">
                    {displayBalance(balance, sellToken.decimals)} {sellToken.symbol}
                  </p>
                  <button
                    type="button"
                    aria-label={`Use your full ${sellToken.symbol} balance`}
                    className="text-[14px] font-semibold text-[var(--seer-muted)] rounded-control border border-[var(--seer-border)] py-1 px-[6px] bg-[var(--seer-surface-raised)] hover:text-[var(--seer-text)]"
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
                    Max
                  </button>
                </div>
              )}
            </div>
          </div>
          <div
            onClick={() => {
              setFocusContainer(1);
              setFocus("amountOut");
            }}
            className={clsx(
              "seer-swap-amount rounded-surface p-4 space-y-2 cursor-pointer border",
              account && "h-[137px]",
              focusContainer === 1
                ? "border-[var(--seer-border)]"
                : "border-transparent bg-base-200/80 hover:bg-base-300/60",
            )}
          >
            <label htmlFor={amountOutInputId} className="block text-base-content/70">
              {swapType === "buy" ? "You get" : "You receive"}
            </label>
            <div className="flex justify-between items-start gap-2">
              <div className="min-w-0 flex-1">
                <Input
                  id={amountOutInputId}
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
                  className="w-full p-0 h-auto text-[24px] !bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none border-0 focus:outline-transparent focus:ring-0 focus:border-0"
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
                  onOutcomeChange,
                }}
              />
            </div>
            {isMintToCover && mintToCoverLeftovers.length > 0 && (
              // The card is a fixed height, so this one stays a single summary line; the full
              // breakdown is in the notice below and in the confirmation.
              <p className="text-[12px] text-black-secondary truncate" title={formatLeftoverList(mintToCoverLeftovers)}>
                + {summarizeLeftovers(mintToCoverLeftovers)}
              </p>
            )}
          </div>
        </div>
        {showBridgeLink && <BridgeWidget toChainId={market.chainId} />}
        {hasAmount && (
          <div className="space-y-1">
            <div className="flex justify-between text-black-secondary-fg text-[14px]">
              Avg price
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
                <div className="flex items-center gap-2">
                  {displayNumber(collateralPerShare)} {selectedCollateral.symbol}
                  {isSecondaryCollateral && (
                    <span className="tooltip">
                      <p className="tooltiptext">
                        {(collateralPerShare * assetsToShares).toFixed(3)} {primaryCollateral.symbol}
                      </p>
                      <QuestionIcon fill="#7D33FF" />
                    </span>
                  )}
                </div>
              )}
            </div>

            {!!limitPriceFromVolume && (
              <div className="flex justify-between text-black-secondary-fg text-[14px]">
                Price after {swapType}
                {quoteIsLoading || isFetching ? (
                  <div className="shimmer-container ml-2 w-[100px]" />
                ) : (
                  <div className="flex items-center gap-2">
                    {(isSecondaryCollateral ? limitPriceFromVolume * sharesToAssets : limitPriceFromVolume).toFixed(3)}{" "}
                    {selectedCollateral.symbol}
                    {isSecondaryCollateral && (
                      <span className="tooltip">
                        <p className="tooltiptext">
                          {limitPriceFromVolume.toFixed(3)} {primaryCollateral.symbol}
                        </p>
                        <QuestionIcon fill="#7D33FF" />
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
        )}

        <MintToCoverNotice status={mintToCover} collateral={selectedCollateral} outcomeText={outcomeText} />
        {isPriceTooHigh && (
          <Alert type="warning">
            Price exceeds 1 {isSecondaryCollateral ? primaryCollateral.symbol : selectedCollateral.symbol} per share.
            Try to reduce the input amount.
          </Alert>
        )}
        {quoteError && <QuoteErrorAlert error={quoteError} swapType={swapType} outcomeText={outcomeText} />}

        <div className="flex justify-between flex-wrap gap-4">
          {market.type === "Futarchy" && (
            <FutarchyTokenSwitch market={market} outcomeIndex={outcomeIndex} onOutcomeChange={onOutcomeChange} />
          )}
          <SlippageButton maxSlippage={maxSlippage} onClick={() => setShowMaxSlippage(true)} />
        </div>
        {renderButtons()}
      </form>
    </>
  );
}
