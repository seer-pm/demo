import Toggle from "@/components/Form/Toggle";
import { tickToPrice } from "@/hooks/liquidity/getLiquidityChartData";
import { useTicksData } from "@/hooks/liquidity/useTicksData";
import { useVolumeUntilPrice } from "@/hooks/liquidity/useVolumeUntilPrice";
import { useQuoteTrade, useTrade } from "@/hooks/trade";
import { useSDaiDaiRatio } from "@/hooks/trade/handleSDAI";
import useDebounce from "@/hooks/useDebounce";
import { useGlobalState } from "@/hooks/useGlobalState";
import { useModal } from "@/hooks/useModal";
import { useTokenBalance } from "@/hooks/useTokenBalance";
import { useWrappedToken } from "@/hooks/useWrappedToken";
import { COLLATERAL_TOKENS } from "@/lib/config";
import { Parameter, QuestionIcon } from "@/lib/icons";
import { Market } from "@/lib/market";
import { paths } from "@/lib/paths";
import { Token, getSelectedCollateral, getSharesInfo } from "@/lib/tokens";
import { NATIVE_TOKEN, displayBalance, isTwoStringsEqual, isUndefined } from "@/lib/utils";
import { CoWTrade, SwaprV3Trade, TradeType, UniswapTrade } from "@swapr/sdk";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { formatUnits, parseUnits } from "viem";
import { gnosis } from "viem/chains";
import { useAccount } from "wagmi";
import { Alert } from "../../Alert";
import Button from "../../Form/Button";
import Input from "../../Form/Input";
import AltCollateralSwitch from "../AltCollateralSwitch";
import { SwapTokensConfirmation } from "./SwapTokensConfirmation";
import { PotentialReturn } from "./components/PotentialReturn";
import SwapButtons from "./components/SwapButtons";

interface SwapFormValues {
  type: "buy" | "sell";
  amount: string;
  amountOut: string;
  useAltCollateral: boolean;
  useLimitPrice: boolean;
  limitPrice: string;
}

interface SwapTokensMarketProps {
  market: Market;
  outcomeText: string;
  outcomeToken: Token;
  parentCollateral: Token | undefined;
  swapType: "buy" | "sell";
  setShowMaxSlippage: (isShow: boolean) => void;
}

export function SwapTokensMarket({
  market,
  outcomeText,
  outcomeToken,
  swapType,
  setShowMaxSlippage,
  parentCollateral,
}: SwapTokensMarketProps) {
  const { address: account } = useAccount();
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
      useLimitPrice: false,
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

  const [amount, amountOut, limitPrice, useAltCollateral, useLimitPrice] = watch([
    "amount",
    "amountOut",
    "limitPrice",
    "useAltCollateral",
    "useLimitPrice",
  ]);
  const {
    Modal: ConfirmSwapModal,
    openModal: openConfirmSwapModal,
    closeModal: closeConfirmSwapModal,
  } = useModal("confirm-swap-modal");

  const isUseWrappedToken = useWrappedToken(account, market.chainId);
  const selectedCollateral =
    parentCollateral || getSelectedCollateral(market.chainId, useAltCollateral, isUseWrappedToken);
  const sDAI = COLLATERAL_TOKENS[market.chainId].primary;
  const isCollateralDai = selectedCollateral.address !== sDAI.address && isUndefined(parentCollateral);
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
  // check if current token price higher than 1 collateral per token
  const isPriceTooHigh = collateralPerShare > 1 && swapType === "buy";

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
  // useEffects

  useEffect(() => {
    dirtyFields["amount"] && trigger("amount");
  }, [balance]);

  useEffect(() => {
    resetInputs();
  }, [swapType, useLimitPrice, useAltCollateral]);

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
    } else if (useLimitPrice) {
      setValue(swapType === "buy" ? "amountOut" : "amount", "", {
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
        <div className="space-y-3">
          <div>
            <div className="flex items-center gap-1 mb-2">
              <p>Use Limit Price ({isCollateralDai ? "sDAI" : selectedCollateral.symbol})</p>
              <div className="tooltip">
                <p className="tooltiptext w-[200px] !whitespace-break-spaces">
                  {swapType === "buy" ? "Buy" : "Sell"} up to a specified price. View pool details for volume
                  distribution.
                </p>
                <QuestionIcon fill="#9747FF" />
              </div>
              <Toggle
                className="checked:bg-purple-primary ml-3"
                checked={useLimitPrice}
                onChange={(e) => setValue("useLimitPrice", e.target.checked)}
              />
            </div>
            {useLimitPrice && (
              <Input
                autoComplete="off"
                type="number"
                step="any"
                min="0"
                {...register("limitPrice", {
                  ...(useLimitPrice && { required: "This field is required." }),
                  validate: (v) => {
                    if (Number.isNaN(Number(v)) || Number(v) < 0) {
                      return "Limit price must be greater than 0.";
                    }
                    const isPriceTooHigh = Number(v) > 1;
                    if (isPriceTooHigh) {
                      return `Limit price exceeds 1 ${isCollateralDai ? "sDAI" : selectedCollateral.symbol} per share.`;
                    }
                    const isPriceNotInRange =
                      currentPrice > 0 && (swapType === "buy" ? Number(v) <= currentPrice : Number(v) >= currentPrice);
                    if (isPriceNotInRange) {
                      return swapType === "buy"
                        ? "Limit price must be greater than current price."
                        : "Limit price must be less than current price.";
                    }
                    return true;
                  },
                })}
                className="w-full"
                useFormReturn={useFormReturn}
              />
            )}
          </div>
          <div>
            <div className="flex justify-between items-center">
              <div className="text-[14px]">From {sellToken.symbol}</div>
              {!useLimitPrice && (
                <div
                  className="text-purple-primary cursor-pointer"
                  onClick={() => {
                    setTradeType(TradeType.EXACT_INPUT);
                    setValue("amount", formatUnits(balance, sellToken.decimals), {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                  }}
                >
                  Max
                </div>
              )}
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
              onChange={(e) => {
                setTradeType(TradeType.EXACT_INPUT);
                register("amount").onChange(e);
              }}
              disabled={useLimitPrice}
              className="w-full"
              useFormReturn={useFormReturn}
            />
          </div>

          <div>
            <div className="text-[14px] mb-2">To {buyToken.symbol}</div>
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
              disabled={useLimitPrice}
              className="w-full"
              useFormReturn={useFormReturn}
            />
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
          {isUndefined(parentCollateral) && (
            <AltCollateralSwitch
              {...register("useAltCollateral")}
              market={market}
              isUseWrappedToken={isUseWrappedToken}
            />
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
