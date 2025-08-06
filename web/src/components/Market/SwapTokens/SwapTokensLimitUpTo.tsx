import { tickToPrice } from "@/hooks/liquidity/getLiquidityChartData";
import { useTicksData } from "@/hooks/liquidity/useTicksData";
import { getTargetTickFromPrice, useVolumeUntilPrice } from "@/hooks/liquidity/useVolumeUntilPrice";
import { useQuoteTrade, useTrade } from "@/hooks/trade";
import { useSDaiDaiRatio } from "@/hooks/trade/handleSDAI";
import useDebounce from "@/hooks/useDebounce";
import { useGlobalState } from "@/hooks/useGlobalState";
import { useMarket } from "@/hooks/useMarket";
import { useModal } from "@/hooks/useModal";
import { useTokenBalance } from "@/hooks/useTokenBalance";
import { useWrappedToken } from "@/hooks/useWrappedToken";
import { COLLATERAL_TOKENS } from "@/lib/config";
import { ArrowSwap, Parameter, QuestionIcon } from "@/lib/icons";
import { FUTARCHY_LP_PAIRS_MAPPING, Market } from "@/lib/market";
import { paths } from "@/lib/paths";
import { Token, getSelectedCollateral, getSharesInfo } from "@/lib/tokens";
import { NATIVE_TOKEN, displayBalance, isTwoStringsEqual, isUndefined } from "@/lib/utils";
import { CoWTrade, SwaprV3Trade, TradeType, UniswapTrade } from "@swapr/sdk";
import clsx from "clsx";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { formatUnits, parseUnits } from "viem";
import { gnosis } from "viem/chains";
import { useAccount } from "wagmi";
import { Alert } from "../../Alert";
import Button from "../../Form/Button";
import Input from "../../Form/Input";
import AltCollateralSwitch from "../AltCollateralSwitch";
import { OutcomeImage } from "../OutcomeImage";
import { SwapTokensConfirmation } from "./SwapTokensConfirmation";
import { FutarchyTokenSwitch } from "./SwapTokensMarket";
import { PotentialReturn } from "./components/PotentialReturn";
import SwapButtons from "./components/SwapButtons";

interface SwapFormValues {
  type: "buy" | "sell";
  amount: string;
  amountOut: string;
  useAltCollateral: boolean;
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
  const { address: account } = useAccount();
  const { data: parentMarket } = useMarket(market.parentMarket.id, market.chainId);
  const [swapType, setSwapType] = useState<"buy" | "sell">("buy");
  const [tradeType, setTradeType] = useState(TradeType.EXACT_INPUT);
  const maxSlippage = useGlobalState((state) => state.maxSlippage);
  const isInstantSwap = useGlobalState((state) => state.isInstantSwap);
  const { data: ticksByPool } = useTicksData(
    market,
    market.wrappedTokens.findIndex((x) => isTwoStringsEqual(x, outcomeToken.address)),
  );
  const poolInfo = ticksByPool ? Object.values(ticksByPool)[0].poolInfo : undefined;
  const currentPrice = poolInfo
    ? Number(tickToPrice(poolInfo.tick)[isTwoStringsEqual(poolInfo.token0, outcomeToken.address) ? 0 : 1])
    : 0;
  const useFormReturn = useForm<SwapFormValues>({
    mode: "all",
    defaultValues: {
      type: "buy",
      amount: "",
      amountOut: "",
      useAltCollateral: false,
      limitPrice: "",
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
  } = useFormReturn;

  const [amount, amountOut, limitPrice, useAltCollateral] = watch([
    "amount",
    "amountOut",
    "limitPrice",
    "useAltCollateral",
  ]);
  const {
    Modal: ConfirmSwapModal,
    openModal: openConfirmSwapModal,
    closeModal: closeConfirmSwapModal,
  } = useModal("confirm-swap-modal");

  const isUseWrappedToken = useWrappedToken(account, market.chainId);
  const selectedCollateral =
    fixedCollateral || getSelectedCollateral(market.chainId, useAltCollateral, isUseWrappedToken);
  const sDAI = COLLATERAL_TOKENS[market.chainId].primary;
  const isCollateralDai = selectedCollateral.address !== sDAI.address && isUndefined(fixedCollateral);
  const { isFetching, sDaiToDai, daiToSDai } = useSDaiDaiRatio(market.chainId);

  const [buyToken, sellToken] =
    swapType === "buy" ? [outcomeToken, selectedCollateral] : [selectedCollateral, outcomeToken];
  const { data: balance = BigInt(0), isFetching: isFetchingBalance } = useTokenBalance(
    account,
    sellToken.address,
    market.chainId,
  );
  const { data: nativeBalance = BigInt(0), isFetching: isFetchingNativeBalance } = useTokenBalance(
    account,
    NATIVE_TOKEN,
    market.chainId,
  );

  const isShowXDAIBridgeLink =
    account &&
    market.chainId === gnosis.id &&
    !isFetchingBalance &&
    !isFetchingNativeBalance &&
    ((nativeBalance === 0n && balance === 0n) || errors.amount?.message === "Not enough balance.");
  const isBuyExactOutputNative =
    swapType === "buy" &&
    isTwoStringsEqual(selectedCollateral.address, NATIVE_TOKEN) &&
    tradeType === TradeType.EXACT_OUTPUT &&
    market.chainId === gnosis.id;

  const debouncedAmount = useDebounce(amount, 500);
  const debouncedAmountOut = useDebounce(amountOut, 500);
  const debounceLimitPrice = useDebounce(limitPrice, 500);

  const volume = useVolumeUntilPrice(
    market,
    outcomeToken.address,
    swapType,
    debounceLimitPrice ? Number(debounceLimitPrice) : undefined,
  );

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
  const tradeTokens = useTrade(async () => {
    reset();
    closeConfirmSwapModal();
  });

  const onSubmit = async (trade: CoWTrade | SwaprV3Trade | UniswapTrade) => {
    await tradeTokens.mutateAsync({
      trade,
      account: account!,
      isBuyExactOutputNative,
    });
  };

  // calculate price per share
  const receivedAmount =
    tradeType === TradeType.EXACT_INPUT
      ? quoteData
        ? Number(formatUnits(quoteData.value, quoteData.decimals))
        : 0
      : Number(amountOut);
  const { collateralPerShare, avgPrice } = getSharesInfo(
    swapType,
    selectedCollateral,
    quoteData,
    amount,
    receivedAmount,
    isCollateralDai,
    daiToSDai,
    sDaiToDai,
  );

  const outcomeText = market.outcomes[outcomeIndex];
  // check if current token price higher than 1 collateral per token
  const isPriceTooHigh = market.type === "Generic" && collateralPerShare > 1 && swapType === "buy";

  const resetInputs = () => {
    setValue("limitPrice", "", {
      shouldValidate: true,
      shouldDirty: true,
    });
    setValue("amount", "", {
      shouldValidate: true,
      shouldDirty: true,
    });
    setValue("amountOut", "", {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const renderTokenDisplay = (container: "buy" | "sell") => {
    const imageElement = (() => {
      const isTokenCollateral = isTwoStringsEqual(
        container === "sell" ? sellToken.address : buyToken.address,
        selectedCollateral.address,
      );
      if (isTokenCollateral) {
        if (isUndefined(fixedCollateral)) {
          return (
            <img
              className="w-full h-full"
              alt={selectedCollateral.symbol}
              src={paths.tokenImage(selectedCollateral.address, market.chainId)}
            />
          );
        }
        if (market.type === "Futarchy") {
          return (
            <OutcomeImage
              className="w-full h-full"
              image={market.images?.outcomes?.[FUTARCHY_LP_PAIRS_MAPPING[outcomeIndex]]}
              isInvalidOutcome={false}
              title={market.outcomes[FUTARCHY_LP_PAIRS_MAPPING[outcomeIndex]]}
            />
          );
        }
        if (!parentMarket) {
          return <div className="w-full h-full bg-purple-primary"></div>;
        }
        return (
          <OutcomeImage
            className="w-full h-full"
            image={parentMarket.images?.outcomes?.[Number(market.parentOutcome)]}
            isInvalidOutcome={
              parentMarket.type === "Generic" && Number(market.parentOutcome) === parentMarket.wrappedTokens.length - 1
            }
            title={parentMarket.outcomes[Number(market.parentOutcome)]}
          />
        );
      }
      return (
        <OutcomeImage
          className="w-full h-full"
          image={outcomeImage}
          isInvalidOutcome={isInvalidOutcome}
          title={outcomeText}
        />
      );
    })();
    return (
      <div className="flex items-center gap-1 rounded-full border border-[#f2f2f2] px-3 py-1 shadow-[0_0_10px_rgba(34,34,34,0.04)]">
        <div className="rounded-full w-6 h-6 overflow-hidden flex-shrink-0">{imageElement}</div>
        <p className="font-semibold text-[16px]">{container === "sell" ? sellToken.symbol : buyToken.symbol}</p>
      </div>
    );
  };

  const renderLimitTokenDisplay = () => {
    const imageElement = (() => {
      if (isUndefined(fixedCollateral)) {
        return (
          <img
            className="w-full h-full"
            alt={isCollateralDai ? "sDAI" : selectedCollateral.symbol}
            src={paths.tokenImage(isCollateralDai ? sDAI.address : selectedCollateral.address, market.chainId)}
          />
        );
      }
      if (market.type === "Futarchy") {
        return (
          <OutcomeImage
            className="w-full h-full"
            image={market.images?.outcomes?.[FUTARCHY_LP_PAIRS_MAPPING[outcomeIndex]]}
            isInvalidOutcome={false}
            title={market.outcomes[FUTARCHY_LP_PAIRS_MAPPING[outcomeIndex]]}
          />
        );
      }
      if (!parentMarket) {
        return <div className="w-full h-full bg-purple-primary"></div>;
      }
      return (
        <OutcomeImage
          className="w-full h-full"
          image={parentMarket.images?.outcomes?.[Number(market.parentOutcome)]}
          isInvalidOutcome={
            parentMarket.type === "Generic" && Number(market.parentOutcome) === parentMarket.wrappedTokens.length - 1
          }
          title={parentMarket.outcomes[Number(market.parentOutcome)]}
        />
      );
    })();
    return (
      <div className="flex items-center gap-1 rounded-full border border-[#f2f2f2] px-3 py-1 shadow-[0_0_10px_rgba(34,34,34,0.04)]">
        <div className="rounded-full w-6 h-6 overflow-hidden flex-shrink-0">{imageElement}</div>
        <p className="font-semibold text-[16px]">{isCollateralDai ? "sDAI" : selectedCollateral.symbol}</p>
      </div>
    );
  };

  // useEffects

  useEffect(() => {
    dirtyFields["amount"] && trigger("amount");
  }, [balance]);

  useEffect(() => {
    resetInputs();
  }, [swapType, useAltCollateral]);

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
    if (volume) {
      setTradeType(swapType === "buy" ? TradeType.EXACT_OUTPUT : TradeType.EXACT_INPUT);
      setValue(swapType === "buy" ? "amountOut" : "amount", volume.toString(), {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  }, [volume]);
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
          />
        }
      />
      <form onSubmit={handleSubmit(openConfirmSwapModal)} className="space-y-5">
        <div className="space-y-2">
          <div className={clsx("rounded-[12px] p-4 space-y-2 border border-[#2222220d]")}>
            <div className="flex items-center justify-between">
              <p className="text-[#131313a1]">{swapType === "buy" ? "Buy" : "Sell"} until the price reaches</p>
              <button
                type="button"
                className="hover:opacity-70"
                onClick={() => setSwapType((state) => (state === "buy" ? "sell" : "buy"))}
              >
                <ArrowSwap />
              </button>
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
                      const isPriceTooHigh = Number(v) > 1;
                      if (isPriceTooHigh) {
                        return `Limit price exceeds 1 ${isCollateralDai ? "sDAI" : selectedCollateral.symbol} per share.`;
                      }
                      const isPriceNotInRange =
                        currentPrice > 0 &&
                        (swapType === "buy" ? Number(v) <= currentPrice : Number(v) >= currentPrice);
                      if (isPriceNotInRange) {
                        return swapType === "buy"
                          ? "Limit price must be greater than current price."
                          : "Limit price must be less than current price.";
                      }
                      if (!poolInfo) return true;
                      const targetTick = getTargetTickFromPrice(
                        Number(v),
                        poolInfo.token0,
                        poolInfo.token1,
                        isTwoStringsEqual(poolInfo.token0, outcomeToken.address),
                        market.chainId,
                      );
                      if (targetTick === poolInfo.tick) {
                        return swapType === "buy"
                          ? "Not enough liquidity. Try to increase limit price."
                          : "Not enough liquidity. Try to decrease limit price.";
                      }
                      return true;
                    },
                  })}
                  className="w-full p-0 h-auto text-[24px] !bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none border-0 focus:outline-transparent focus:ring-0 focus:border-0"
                  placeholder="0"
                  useFormReturn={useFormReturn}
                />
              </div>
              {renderLimitTokenDisplay()}
            </div>
          </div>
          <div className={clsx("rounded-[12px] p-4 space-y-2 bg-[#f9f9f9] hover:bg-[#f2f2f2]")}>
            <p className="text-[#131313a1]">You will sell</p>
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
                  onChange={(e) => {
                    setTradeType(TradeType.EXACT_INPUT);
                    register("amount").onChange(e);
                  }}
                  disabled
                  className="w-full p-0 h-auto text-[24px] !bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none border-0 focus:outline-transparent focus:ring-0 focus:border-0"
                  placeholder="0"
                  useFormReturn={useFormReturn}
                />
              </div>
              {renderTokenDisplay("sell")}
            </div>
            <div className="flex justify-end">
              {isFetchingBalance ? (
                <div className="shimmer-container w-[80px] h-[13px]" />
              ) : (
                <div className="flex items-center gap-1">
                  <p className="text-[12px] font-semibold text-[#131313a1]">
                    {displayBalance(balance, sellToken.decimals)} {sellToken.symbol}
                  </p>
                </div>
              )}
            </div>
          </div>
          <div className={clsx("rounded-[12px] p-4 space-y-2 bg-[#f9f9f9] hover:bg-[#f2f2f2]")}>
            <p className="text-[#131313a1]">To receive</p>
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
                  className="w-full p-0 h-auto text-[24px] !bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none border-0 focus:outline-transparent focus:ring-0 focus:border-0"
                  placeholder="0"
                  disabled
                  useFormReturn={useFormReturn}
                />
              </div>
              {renderTokenDisplay("buy")}
            </div>
          </div>
        </div>
        {isShowXDAIBridgeLink && (
          <a
            target="_blank"
            rel="noopener noreferrer"
            href={paths.xDAIBridge()}
            className="text-purple-primary hover:underline text-[14px]"
          >
            Bridge xDAI
          </a>
        )}
        <div className="space-y-1">
          <div className="flex justify-between text-[#828282] text-[14px]">
            Avg price
            {quoteIsLoading || isFetching ? (
              <div className="shimmer-container ml-2 w-[100px]" />
            ) : (
              <div className="flex items-center gap-2">
                {avgPrice} {selectedCollateral.symbol}
                {isCollateralDai && (
                  <span className="tooltip">
                    <p className="tooltiptext">{collateralPerShare.toFixed(3)} sDAI</p>
                    <QuestionIcon fill="#9747FF" />
                  </span>
                )}
              </div>
            )}
          </div>
          <PotentialReturn
            {...{
              swapType,
              isCollateralDai,
              selectedCollateral,
              sDaiToDai,
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
            Price exceeds 1 {isCollateralDai ? "sDAI" : selectedCollateral.symbol} per share. Try to reduce the input
            amount.
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
          {market.type === "Generic" && isUndefined(fixedCollateral) && (
            <AltCollateralSwitch
              {...register("useAltCollateral")}
              market={market}
              isUseWrappedToken={isUseWrappedToken}
            />
          )}
          {market.type === "Futarchy" && <FutarchyTokenSwitch market={market} outcomeIndex={outcomeIndex} />}
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
        {isCowFastQuote ? (
          <Button variant="primary" type="button" disabled={true} isLoading={true} text="Calculating best price..." />
        ) : quoteData?.trade ? (
          <SwapButtons
            account={account}
            trade={quoteData.trade}
            swapType={swapType}
            isBuyExactOutputNative={isBuyExactOutputNative}
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
              (!isUndefined(quoteData?.value) && quoteData.value > 0n && quoteIsLoading) ||
              isFetching
            }
          />
        ) : quoteIsLoading && quoteFetchStatus === "fetching" ? (
          <Button variant="primary" type="button" disabled={true} isLoading={true} text="" />
        ) : null}
      </form>
    </>
  );
}
