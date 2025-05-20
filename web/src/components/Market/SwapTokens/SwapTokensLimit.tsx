import { Alert } from "@/components/Alert";
import { Dropdown } from "@/components/Dropdown";
import { useCowLimitOrder } from "@/hooks/trade";
import { useSDaiDaiRatio } from "@/hooks/trade/handleSDAI";
import { Market } from "@/hooks/useMarket";
import { useModal } from "@/hooks/useModal";
import { useTokenBalance } from "@/hooks/useTokenBalance";
import { useWrappedToken } from "@/hooks/useWrappedToken";
import { SupportedChain } from "@/lib/chains";
import { COLLATERAL_TOKENS } from "@/lib/config";
import { QuestionIcon } from "@/lib/icons";
import { paths } from "@/lib/paths";
import { Token, getSelectedCollateral } from "@/lib/tokens";
import { NATIVE_TOKEN, displayBalance, isUndefined } from "@/lib/utils";
import { OrderKind, UnsignedOrder } from "@cowprotocol/cow-sdk";
import { ChainId, CoWTrade } from "@swapr/sdk";
import { addHours, formatDate } from "date-fns";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { formatUnits, parseUnits } from "viem";
import { gnosis } from "viem/chains";
import { useAccount } from "wagmi";
import Input from "../../Form/Input";
import AltCollateralSwitch from "../AltCollateralSwitch";
import { LimitOrderConfirmation } from "./LimitOrderConfirmation";
import OrderExpireDatePicker from "./components/OrderExpireDatePicker";
import { PotentialReturn } from "./components/PotentialReturn";
import SwapButtonsLimitOrder from "./components/SwapButtonsLimitOrder";

interface SwapFormValues {
  type: "buy" | "sell";
  amount: string;
  useAltCollateral: boolean;
  limitPrice: string;
  validTo: string;
  partiallyFillable: boolean;
}

interface SwapTokensLimitProps {
  market: Market;
  outcomeText: string;
  outcomeToken: Token;
  parentCollateral: Token | undefined;
  swapType: "buy" | "sell";
}

export function SwapTokensLimit({
  market,
  outcomeText,
  outcomeToken,
  swapType,
  parentCollateral,
}: SwapTokensLimitProps) {
  const { address: account } = useAccount();
  const useFormReturn = useForm<SwapFormValues>({
    mode: "all",
    defaultValues: {
      type: "buy",
      amount: "0",
      limitPrice: "0",
      useAltCollateral: false,
      validTo: addHours(new Date(), 1).toString(),
      partiallyFillable: true,
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

  const [amount, useAltCollateral, limitPrice, validTo, partiallyFillable] = watch([
    "amount",
    "useAltCollateral",
    "limitPrice",
    "validTo",
    "partiallyFillable",
  ]);
  const { Modal, openModal, closeModal } = useModal("confirm-limit-order-modal");
  const {
    Modal: DatePickerModal,
    openModal: openDatePickerModal,
    closeModal: closeDatePickerModal,
  } = useModal("date-picker-modal", true);

  const isUseWrappedToken = useWrappedToken(account, market.chainId);
  const selectedCollateral =
    parentCollateral || getSelectedCollateral(market.chainId, useAltCollateral, isUseWrappedToken);
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

  useEffect(() => {
    dirtyFields["amount"] && trigger("amount");
  }, [balance]);
  useEffect(() => {
    if (swapType === "buy") {
      setValue("useAltCollateral", false);
    }
  }, [swapType]);
  const receivedAmount =
    Number(limitPrice) && !Number.isNaN(limitPrice)
      ? swapType === "buy"
        ? Number(amount) / Number(limitPrice)
        : Number(amount) * Number(limitPrice)
      : 0;
  const order: UnsignedOrder | undefined = account
    ? {
        appData: CoWTrade.getAppData(market.chainId as ChainId).ipfsHashInfo.appData,
        buyAmount: parseUnits(receivedAmount.toString(), 18).toString(),
        buyToken: swapType === "buy" ? outcomeToken.address : selectedCollateral.address,
        feeAmount: "0",
        kind: OrderKind.SELL,
        partiallyFillable,
        sellAmount: parseUnits(amount, 18).toString(),
        sellToken: swapType === "buy" ? selectedCollateral.address : outcomeToken.address,
        validTo: Math.floor((validTo ? new Date(validTo) : addHours(new Date(), 1)).getTime() / 1000),
        receiver: account,
      }
    : undefined;
  const createLimitOrder = useCowLimitOrder(async () => {
    reset();
    closeModal();
  });

  const onSubmit = async () => {
    await createLimitOrder.mutateAsync({
      order: order!,
      chainId: market.chainId,
    });
  };
  const sDAI = COLLATERAL_TOKENS[market.chainId].primary;

  // convert sell result to xdai or wxdai if using multisteps swap
  const isCollateralDai = selectedCollateral.address !== sDAI.address && isUndefined(parentCollateral);

  const { isFetching, sDaiToDai } = useSDaiDaiRatio(market.chainId);
  const collateralPerShare = receivedAmount
    ? swapType === "buy"
      ? Number(amount) / receivedAmount
      : receivedAmount / Number(amount)
    : 0;
  if (!isUndefined(parentCollateral)) {
    return (
      <Alert type="warning">
        <p>Limit order is not supported for this pair.</p>
      </Alert>
    );
  }
  return (
    <>
      {order && (
        <Modal
          title="Confirm Limit Order"
          content={
            <LimitOrderConfirmation
              closeModal={closeModal}
              reset={() => reset()}
              onSubmit={onSubmit}
              order={order!}
              buyTokenSymbol={swapType === "buy" ? outcomeToken.symbol : selectedCollateral.symbol}
              sellTokenSymbol={swapType === "sell" ? outcomeToken.symbol : selectedCollateral.symbol}
              limitPrice={Number(limitPrice)}
              isLoading={createLimitOrder.isPending}
            />
          }
        />
      )}
      <DatePickerModal
        title="Valid To"
        className="w-[410px]"
        content={
          <OrderExpireDatePicker
            initialDate={validTo}
            onSave={(date) => {
              setValue("validTo", (date ?? addHours(new Date(), 1)).toString());
              closeDatePickerModal();
            }}
          />
        }
      />
      <form onSubmit={handleSubmit(openModal)} className="space-y-5">
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
        <div>
          <p className="text-[14px] mb-2">Limit Price ({selectedCollateral.symbol})</p>
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
                const isPriceTooHigh = isCollateralDai ? Number(v) > sDaiToDai : Number(v) > 1;
                if (isPriceTooHigh) {
                  return `Limit price exceeds 1 ${isCollateralDai ? "sDAI" : selectedCollateral.symbol} per share.`;
                }
                return true;
              },
            })}
            className="w-full"
            useFormReturn={useFormReturn}
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-1 text-[14px]">
            Order expires in
            <span className="tooltip">
              <p className="tooltiptext min-w-[200px]">
                If your order has not been filled by this date & time, it will expire
              </p>
              <QuestionIcon fill="#9747FF" />
            </span>
            <button type="button" onClick={openDatePickerModal} className="hover:underline ml-auto whitespace-nowrap">
              {formatDate(validTo, "yyyy-MM-dd HH:mm")}
            </button>
          </div>
          <div className="flex items-center gap-1 text-[14px]">
            Order type
            <span className="tooltip">
              <p className="tooltiptext !text-left min-w-[200px]">
                <p>Partially fillable: This order can be partially filled</p>
                <p>Fill or kill: This order will either be filled completely or not filled.</p>
              </p>
              <QuestionIcon fill="#9747FF" />
            </span>
            <div className="ml-auto">
              <Dropdown
                defaultLabel="Order Type"
                options={[
                  { value: true, text: "Partially fillable" },
                  { value: false, text: "Fill or kill" },
                ]}
                value={partiallyFillable}
                onClick={(value) => setValue("partiallyFillable", value)}
              />
            </div>
          </div>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-[#828282] text-[14px]">
            {swapType === "buy" ? "Shares" : "Est. amount received"}
            <div className="text-right">
              {receivedAmount.toFixed(3)} {buyToken.symbol}
            </div>
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
              quoteIsLoading: false,
              isFetching,
              amount,
              receivedAmount,
              collateralPerShare,
            }}
          />
        </div>

        <div className="flex items-center flex-wrap gap-1">
          {isUndefined(parentCollateral) && (
            <AltCollateralSwitch
              {...register("useAltCollateral")}
              chainId={market.chainId}
              isUseWrappedToken={isUseWrappedToken}
              disabled={swapType === "buy" && market.chainId === gnosis.id}
            />
          )}
          {swapType === "buy" && market.chainId === gnosis.id && (
            <span className="tooltip">
              <p className="tooltiptext !text-left min-w-[200px]">
                <p>The chain's native token cannot be used as sell token in limit order.</p>
              </p>
              <QuestionIcon fill="#9747FF" />
            </span>
          )}
        </div>
        {Number(amount) > 0 && Number(limitPrice) > 0 && order && (
          <SwapButtonsLimitOrder
            chainId={market.chainId as SupportedChain}
            isDisabled={!account || !isValid}
            isLoading={createLimitOrder.isPending}
            amount={amount}
            sellToken={swapType === "buy" ? selectedCollateral.address : outcomeToken.address}
            swapType={swapType}
            account={account}
          />
        )}
      </form>
    </>
  );
}
