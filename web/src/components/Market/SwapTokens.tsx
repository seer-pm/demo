import { useMissingTradeApproval, useQuoteTrade, useTrade } from "@/hooks/trade";
import { useGetTradeInfo } from "@/hooks/trade/useGetTradeInfo";
import { useDaiToSDai, useSDaiToDai } from "@/hooks/useSDaiToDai";
import { useTokenBalance } from "@/hooks/useTokenBalance";
import { SupportedChain } from "@/lib/chains";
import { COLLATERAL_TOKENS } from "@/lib/config";
import { Token, hasAltCollateral } from "@/lib/tokens";
import { NATIVE_TOKEN, VALID_WXDAI_BALANCE, displayBalance, isUndefined } from "@/lib/utils";
import { ChainId, Trade, WXDAI } from "@swapr/sdk";
import clsx from "clsx";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Address, formatUnits, parseUnits } from "viem";
import { Alert } from "../Alert";
import { ApproveButton } from "../Form/ApproveButton";
import Button from "../Form/Button";
import Input from "../Form/Input";
import { useModal } from "../Modal";
import AltCollateralSwitch from "./AltCollateralSwitch";
import { OutcomeImage } from "./OutcomeImage";
import { SwapTokensConfirmation } from "./SwapTokensConfirmation";
import { WrapXDAIModalContent } from "./WrapXDAIModalContent";

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
}

function getSelectedCollateral(chainId: SupportedChain, useAltCollateral: boolean, useWrappedToken: boolean): Token {
  if (hasAltCollateral(COLLATERAL_TOKENS[chainId].secondary) && useAltCollateral) {
    if (useWrappedToken && COLLATERAL_TOKENS[chainId].secondary?.wrapped) {
      return COLLATERAL_TOKENS[chainId].secondary?.wrapped as Token;
    }

    return COLLATERAL_TOKENS[chainId].secondary as Token;
  }

  return COLLATERAL_TOKENS[chainId].primary;
}

function SwapButtons({
  account,
  trade,
  swapType,
  isDisabled,
  isLoading,
  chainId,
}: {
  account?: Address;
  trade: Trade;
  swapType: "buy" | "sell";
  isDisabled: boolean;
  isLoading: boolean;
  chainId: ChainId;
}) {
  const {
    Modal: WrapXDAIModal,
    openModal: openWrapXDAIModal,
    closeModal: closeWrapXDAIModal,
  } = useModal("wrap-xdai-modal");
  const missingApprovals = useMissingTradeApproval(account!, trade);
  const isBuyWithNative = trade.inputAmount.currency.address?.toLowerCase() === NATIVE_TOKEN;
  if (!missingApprovals && !isBuyWithNative) {
    return null;
  }

  return (
    <div>
      {!missingApprovals?.length && (
        <>
          <Button
            variant="primary"
            type="submit"
            disabled={isDisabled}
            isLoading={isLoading}
            text={swapType === "buy" ? "Buy" : "Sell"}
          />
          <WrapXDAIModal
            title="Wrap xDAI"
            content={<WrapXDAIModalContent closeModal={closeWrapXDAIModal} chainId={chainId} />}
          />
          {isBuyWithNative && (
            <div className="mt-2">
              <Button variant="primary" type="button" text="Wrap XDAI" className="mb-2" onClick={openWrapXDAIModal} />
              <Alert type="info">
                You can buy outcome tokens with wxDAI once you have {VALID_WXDAI_BALANCE} or more wxDAI.
                <br />
                Benefit of using wxDAI instead of xDAI:
                <br />
                <ul className="list-disc">
                  <li>Lower overall network costs</li>
                  <li>Lower Slippage</li>
                  <li>Protection against failed transactions</li>
                </ul>
              </Alert>
            </div>
          )}
        </>
      )}
      {!!missingApprovals?.length && missingApprovals.length > 0 && (
        <div className="space-y-[8px]">
          {missingApprovals.map((approval) => (
            <ApproveButton
              key={approval.address}
              tokenAddress={approval.address}
              tokenName={approval.name}
              spender={approval.spender}
              amount={approval.amount}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function SwapTokens({
  account,
  chainId,
  outcomeText,
  outcomeToken,
  hasEnoughLiquidity,
  outcomeImage,
  isInvalidResult,
}: SwapTokensProps) {
  const [swapType, setSwapType] = useState<"buy" | "sell">("buy");
  const tabClick = (type: "buy" | "sell") => () => setSwapType(type);

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
  const { data: wxDAIBalance = BigInt(0) } = useTokenBalance(account, WXDAI[chainId].address as `0x${string}`);
  const useWrappedToken = wxDAIBalance > parseUnits(VALID_WXDAI_BALANCE, WXDAI[chainId].decimals);

  const selectedCollateral = getSelectedCollateral(chainId, useAltCollateral, useWrappedToken);
  const sellToken = swapType === "buy" ? selectedCollateral : outcomeToken;
  const { data: balance = BigInt(0) } = useTokenBalance(account, sellToken.address);

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

  const onSubmit = async () => {
    await tradeTokens.mutateAsync({
      trade: quoteData?.trade!,
      account: account!,
    });
  };

  const { data: sDaiAmount } = useDaiToSDai(
    parseUnits(amount, selectedCollateral.decimals),
    chainId,
    selectedCollateral.symbol !== "sDAI",
  );
  const { data: daiAmount } = useSDaiToDai(parseUnits("1", selectedCollateral.decimals), chainId);
  const tradeInfo = useGetTradeInfo(quoteData?.trade);
  const shares = quoteData ? displayBalance(quoteData.value, quoteData.decimals) : 0;
  const sDaiPerShare =
    selectedCollateral.symbol === "sDAI"
      ? Number(amount) / Number(shares)
      : Number(formatUnits(sDaiAmount ?? 0n, selectedCollateral.decimals)) / Number(shares);
  const maxCollateralPerShare =
    selectedCollateral.symbol === "sDAI" ? 1 : Number(formatUnits(daiAmount ?? 0n, selectedCollateral.decimals));
  const isPriceTooHigh = Number(shares) > 0 && sDaiPerShare > 1 && swapType === "buy";
  return (
    <form onSubmit={handleSubmit(openConfirmSwapModal)} className="space-y-5 bg-white p-[24px] drop-shadow">
      <ConfirmSwapModal
        title="Confirm Swap"
        content={
          <SwapTokensConfirmation
            trade={quoteData?.trade}
            closeModal={closeConfirmSwapModal}
            isLoading={tradeTokens.isPending}
            onSubmit={onSubmit}
          />
        }
      />
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
            href={`https://v3.swapr.eth.limo/#/add/${outcomeToken.address}/${COLLATERAL_TOKENS[chainId].primary.address}/enter-amounts`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-primary"
          >
            provide liquidity.
          </a>
        </Alert>
      )}

      <div className={clsx("space-y-5", hasEnoughLiquidity === false && "grayscale pointer-events-none")}>
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

        <div className="space-y-2">
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

        <div className="flex space-x-2 text-purple-primary">
          {swapType === "buy" ? "Expected shares" : "Expected amount"} = {shares}
        </div>

        {isPriceTooHigh && (
          <Alert type="warning">
            Current price exceeds {maxCollateralPerShare.toFixed(2)} {selectedCollateral.symbol} per share.
          </Alert>
        )}
        {quoteIsError && <Alert type="error">Not enough liquidity</Alert>}

        <div className="flex justify-between">
          <AltCollateralSwitch {...register("useAltCollateral")} chainId={chainId} useWrappedToken={useWrappedToken} />
          <div className="text-[12px] text-[#999999]">Max slippage: {tradeInfo?.maximumSlippage ?? 0}%</div>
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
              tradeTokens.isPending || (!isUndefined(quoteData?.value) && quoteData.value > 0n && quoteIsPending)
            }
            chainId={chainId}
          />
        ) : quoteIsPending && quoteFetchStatus === "fetching" ? (
          <Button variant="primary" type="button" disabled={true} isLoading={true} text="" />
        ) : null}
      </div>
    </form>
  );
}
