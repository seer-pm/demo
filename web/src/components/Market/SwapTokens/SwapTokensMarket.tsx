import { useQuoteTrade, useTrade } from "@/hooks/trade";
import useDebounce from "@/hooks/useDebounce";
import { useModal } from "@/hooks/useModal";

import { usePriceFromVolume } from "@/hooks/liquidity/usePriceUntilVolume";
import { useTradeConditions } from "@/hooks/trade/useTradeConditions";
import { useGlobalState } from "@/hooks/useGlobalState";
import { COLLATERAL_TOKENS, isSeerCredits } from "@/lib/config";
import { ArrowDown, Parameter, QuestionIcon } from "@/lib/icons";
import { FUTARCHY_LP_PAIRS_MAPPING, Market } from "@/lib/market";
import { Token, getCollateralPerShare, getOutcomeTokenVolume } from "@/lib/tokens";
import { displayBalance, displayNumber, isUndefined } from "@/lib/utils";
import { CoWTrade, SwaprV3Trade, TradeType, UniswapTrade } from "@swapr/sdk";
import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
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
  const [focusContainer, setFocusContainer] = useState(0);
  const setPreferredCollateral = useGlobalState((state) => state.setPreferredCollateral);
  const primaryCollateral = COLLATERAL_TOKENS[market.chainId].primary;
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
    if (amountErrorMessage && amountErrorMessage !== "This field is required.") {
      return <Button variant="primary" className="w-full" type="button" disabled={true} text={amountErrorMessage} />;
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
      return <Button variant="primary" type="button" className="w-full" disabled={true} isLoading={true} text="" />;
    }
    return <Button variant="primary" className="w-full" type="button" disabled={true} text="Enter an amount" />;
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
          <div
            onClick={() => {
              setFocusContainer(0);
              setFocus("amount");
            }}
            className={clsx(
              "rounded-[12px] p-4 space-y-2 cursor-pointer h-[137px]",
              focusContainer === 0 ? "border border-[#2222220d]" : "bg-base-200/80 hover:bg-base-300/60",
            )}
          >
            <p className="text-base-content/70">You pay</p>
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
                }}
              />
            </div>
            <div className="flex justify-end">
              {isFetchingBalance ? (
                <div className="shimmer-container w-[80px] h-[13px]" />
              ) : (
                <div className="flex items-center gap-1">
                  <p className="text-[14px] font-semibold text-base-content/70">
                    {displayBalance(balance, sellToken.decimals)} {sellToken.symbol}
                  </p>
                  <button
                    type="button"
                    className="text-[14px] font-semibold text-base-content/70 rounded-[12px] border border-[#2222220d] py-1 px-[6px] bg-base-200/80 hover:bg-base-300/60"
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
          <div className="my-1 relative">
            <button
              type="button"
              onClick={() => {
                setSwapType((state) => (state === "buy" ? "sell" : "buy"));
                setFocusContainer(0);
                setFocus("amount");
              }}
              className="absolute border-[4px] border-base-100 rounded-[16px] p-2 bg-base-200/80 hover:bg-base-300/60 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
            >
              <ArrowDown fill="currentColor" />
            </button>
          </div>
          <div
            onClick={() => {
              setFocusContainer(1);
              setFocus("amountOut");
            }}
            className={clsx(
              "rounded-[12px] p-4 space-y-2 h-[137px] cursor-pointer",
              focusContainer === 1 ? "border border-[#2222220d]" : "bg-base-200/80 hover:bg-base-300/60",
            )}
          >
            <p className="text-base-content/70">You will get</p>
            <div className="flex justify-between items-start">
              <div>
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
                {collateralPerShare.toFixed(3)} {selectedCollateral.symbol}
                {isSecondaryCollateral && (
                  <span className="tooltip">
                    <p className="tooltiptext">
                      {(collateralPerShare * assetsToShares).toFixed(3)} {primaryCollateral.symbol}
                    </p>
                    <QuestionIcon fill="#9747FF" />
                  </span>
                )}
              </div>
            )}
          </div>

          {!!limitPriceFromVolume && (
            <div className="flex justify-between text-[#828282] text-[14px]">
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
                      <QuestionIcon fill="#9747FF" />
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

        <div className="flex justify-between flex-wrap gap-4">
          {market.type === "Futarchy" && (
            <FutarchyTokenSwitch market={market} outcomeIndex={outcomeIndex} onOutcomeChange={onOutcomeChange} />
          )}
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
