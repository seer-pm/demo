import { useQuoteTrade, useTrade } from "@/hooks/trade";
import { useSDaiDaiRatio } from "@/hooks/trade/handleSDAI";
import useDebounce from "@/hooks/useDebounce";
import { useGlobalState } from "@/hooks/useGlobalState";
import { Market } from "@/hooks/useMarket";
import { useModal } from "@/hooks/useModal";
import { useSearchParams } from "@/hooks/useSearchParams";
import { useTokenBalance } from "@/hooks/useTokenBalance";
import { useWrappedToken } from "@/hooks/useWrappedToken";
import { COLLATERAL_TOKENS, getLiquidityUrlByMarket } from "@/lib/config";
import { Parameter, QuestionIcon } from "@/lib/icons";
import { FUTARCHY_LP_PAIRS_MAPPING } from "@/lib/market";
import { Token, getSelectedCollateral, getSharesInfo } from "@/lib/tokens";
import { displayBalance, displayNumber, isUndefined } from "@/lib/utils";
import { CoWTrade, SwaprV3Trade, UniswapTrade } from "@swapr/sdk";
import clsx from "clsx";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Address, formatUnits, parseUnits } from "viem";
import { Alert } from "../../Alert";
import Button from "../../Form/Button";
import Input from "../../Form/Input";
import AltCollateralSwitch from "../AltCollateralSwitch";
import { OutcomeImage } from "../OutcomeImage";
import { SwapTokensConfirmation } from "./SwapTokensConfirmation";
import SwapTokensMaxSlippage from "./SwapTokensMaxSlippage";
import { PotentialReturn } from "./components/PotentialReturn";
import SwapButtons from "./components/SwapButtons";

interface SwapFormValues {
  type: "buy" | "sell";
  amount: string;
  useAltCollateral: boolean;
}

interface SwapTokensProps {
  account: Address | undefined;
  market: Market;
  outcomeIndex: number;
  outcomeToken: Token;
  hasEnoughLiquidity?: boolean;
  outcomeImage?: string;
  fixedCollateral: Token | undefined;
}

function FutarchyTokenSwitch({ market, outcomeIndex }: { market: Market; outcomeIndex: number }) {
  const [, setSearchParams] = useSearchParams();

  const collateralPair = [outcomeIndex, FUTARCHY_LP_PAIRS_MAPPING[outcomeIndex]]
    .sort()
    .map((collateralIndex) => market.wrappedTokens[collateralIndex]) as [Address, Address];

  return (
    <AltCollateralSwitch
      key={collateralPair.join("-")}
      onChange={() =>
        setSearchParams(
          { outcome: market.outcomes[FUTARCHY_LP_PAIRS_MAPPING[outcomeIndex]] },
          { overwriteLastHistoryEntry: true, keepScrollPosition: true },
        )
      }
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

export function SwapTokens({
  account,
  market,
  outcomeIndex,
  outcomeToken,
  hasEnoughLiquidity,
  outcomeImage,
  fixedCollateral,
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

  const isUseWrappedToken = useWrappedToken(account, market.chainId);
  const selectedCollateral =
    fixedCollateral || getSelectedCollateral(market.chainId, useAltCollateral, isUseWrappedToken);
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

  const debouncedAmount = useDebounce(amount, 500);

  const {
    data: quoteData,
    isLoading: quoteIsLoading,
    fetchStatus: quoteFetchStatus,
    error: quoteError,
  } = useQuoteTrade(market.chainId, account, debouncedAmount, outcomeToken, selectedCollateral, swapType);
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
    });
  };
  const sDAI = COLLATERAL_TOKENS[market.chainId].primary;

  // convert sell result to xdai or wxdai if using multisteps swap
  const isCollateralDai = selectedCollateral.address !== sDAI.address && isUndefined(fixedCollateral);

  const { isFetching, sDaiToDai, daiToSDai } = useSDaiDaiRatio(market.chainId);

  // calculate price per share
  const receivedAmount = quoteData ? Number(formatUnits(quoteData.value, quoteData.decimals)) : 0;
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
        <form onSubmit={handleSubmit(openConfirmSwapModal)} className="space-y-5 bg-white p-[24px] shadow-md">
          <div className="flex items-center space-x-[12px]">
            <div>
              <OutcomeImage
                image={outcomeImage}
                isInvalidOutcome={market.type === "Generic" && outcomeIndex === market.wrappedTokens.length - 1}
                title={outcomeText}
              />
            </div>
            <div className="text-[16px]">{outcomeText}</div>
          </div>

          {hasEnoughLiquidity === false && (
            <Alert type="warning">
              This outcome lacks sufficient liquidity for trading. You can mint tokens or{" "}
              <a
                href={getLiquidityUrlByMarket(market, outcomeIndex)}
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
            <div className="space-y-1">
              <div className="flex justify-between text-[#828282] text-[14px]">
                Avg price
                {quoteIsLoading || isFetching ? (
                  <div className="shimmer-container ml-2 w-[100px]" />
                ) : market.type === "Futarchy" ? (
                  <FutarchyPricePerShare {...{ swapType, collateralPerShare, buyToken, sellToken, outcomeIndex }} />
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
              <div className="flex justify-between text-[#828282] text-[14px]">
                {swapType === "buy" ? "Shares" : "Est. amount received"}
                {quoteIsLoading || isFetching ? (
                  <div className="shimmer-container ml-2 w-[100px]" />
                ) : (
                  <div className="text-right">
                    {receivedAmount.toFixed(3)} {buyToken.symbol}
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
                }}
              />
            </div>

            {isPriceTooHigh && (
              <Alert type="warning">
                Price exceeds 1 {isCollateralDai ? "sDAI" : selectedCollateral.symbol} per share. Try to reduce the
                input amount.
              </Alert>
            )}
            {quoteError && <Alert type="error">{quoteError.message ?? "Error when quoting price"}</Alert>}

            <div className="flex justify-between flex-wrap gap-4">
              {market.type === "Generic" && isUndefined(fixedCollateral) && (
                <AltCollateralSwitch
                  {...register("useAltCollateral")}
                  market={market}
                  isUseWrappedToken={isUseWrappedToken}
                />
              )}
              {market.type === "Futarchy" && <FutarchyTokenSwitch market={market} outcomeIndex={outcomeIndex} />}
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
            {isCowFastQuote ? (
              <Button
                variant="primary"
                type="button"
                disabled={true}
                isLoading={true}
                text="Calculating best price..."
              />
            ) : quoteData?.trade ? (
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
                  (!isUndefined(quoteData?.value) && quoteData.value > 0n && quoteIsLoading) ||
                  isFetching
                }
              />
            ) : quoteIsLoading && quoteFetchStatus === "fetching" ? (
              <Button variant="primary" type="button" disabled={true} isLoading={true} text="" />
            ) : null}
          </div>
        </form>
      )}
      {isShowMaxSlippage && <SwapTokensMaxSlippage onReturn={() => setShowMaxSlippage(false)} />}
    </>
  );
}
