import Button from "@/components/Form/Button";
import Input from "@/components/Form/Input";
import AltCollateralSwitch from "@/components/Market/AltCollateralSwitch";
import { getSplitMergeRedeemCollateral, useSelectedCollateral } from "@/hooks/useSelectedCollateral";
import { useSplitPosition } from "@/hooks/useSplitPosition";
import { useTokenUsdPrice } from "@/hooks/useTokenUsdPrice";
import { displayBalance } from "@/lib/utils";
import { useTokenBalance } from "@seer-pm/react";
import { Market } from "@seer-pm/sdk";
import { NATIVE_TOKEN, getRouterAddress } from "@seer-pm/sdk";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Address, formatUnits, parseUnits, zeroAddress } from "viem";
import { ApproveButton } from "../Form/ApproveButton";
import { SwitchChainButtonWrapper } from "../Form/SwitchChainButtonWrapper";

export interface SplitFormValues {
  amount: string;
  useAltCollateral: boolean;
}

interface SplitFormProps {
  account?: Address;
  market: Market;
}

export function SplitForm({ account, market }: SplitFormProps) {
  const router = getRouterAddress(market);

  const useFormReturn = useForm<SplitFormValues>({
    mode: "all",
    defaultValues: {
      amount: "",
      useAltCollateral: false,
    },
  });

  const {
    register,
    reset,
    formState: { isValid, dirtyFields },
    handleSubmit,
    watch,
    trigger,
    setValue,
  } = useFormReturn;

  const [useAltCollateral, amount] = watch(["useAltCollateral", "amount"]);

  const selectedCollateral = useSelectedCollateral(market, useAltCollateral);
  const { data: balance = BigInt(0), isFetching: isFetchingBalance } = useTokenBalance(
    account,
    selectedCollateral?.address,
    market.chainId,
  );

  const parsedAmount = parseUnits(amount ?? "0", selectedCollateral.decimals);

  useEffect(() => {
    dirtyFields["amount"] && trigger("amount");
  }, [balance, useAltCollateral]);

  const {
    splitPosition,
    approvals: { data: missingApprovals = [], isLoading: isLoadingApprovals },
  } = useSplitPosition(
    {
      tokensAddresses: selectedCollateral.address !== NATIVE_TOKEN ? [selectedCollateral.address] : [],
      account,
      spender: router,
      amounts: parsedAmount,
      chainId: market.chainId,
    },
    () => {
      reset();
    },
  );

  const usdPrice = useTokenUsdPrice(selectedCollateral?.symbol);
  const showDollar = market.parentMarket.id === zeroAddress;

  const currentAmountFloat = (): number => {
    const n = Number(amount);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  };
  const balanceTokens = (): number => Number(formatUnits(balance, selectedCollateral.decimals));
  const setAmountTokens = (next: number) => {
    const max = balanceTokens();
    const clamped = Math.max(0, Math.min(next, max));
    const formatted = clamped.toFixed(selectedCollateral.decimals).replace(/\.?0+$/, "") || "0";
    const dot = formatted.indexOf(".");
    const truncated = dot === -1 ? formatted : formatted.slice(0, dot + 3);
    setValue("amount", truncated, { shouldValidate: true, shouldDirty: true });
  };
  const addPercentOfBalance = (pct: number) => {
    setAmountTokens(currentAmountFloat() + balanceTokens() * (pct / 100));
  };
  const addUsdAmount = (usd: number) => {
    const price = usdPrice && usdPrice > 0 ? usdPrice : 1;
    setAmountTokens(currentAmountFloat() + usd / price);
  };

  const onSubmit = async (/*values: SplitFormValues*/) => {
    await splitPosition.mutateAsync({
      router: router,
      market: market,
      collateralToken: getSplitMergeRedeemCollateral(market, selectedCollateral, useAltCollateral),
      outcomeSlotCount: market.outcomes.length,
      amount: parsedAmount,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div>
        <div className="text-[14px] mb-2">Amount</div>
        <div className="flex justify-between items-center gap-2">
          <div className="text-[12px] text-black-secondary flex items-center gap-1">
            Balance:{" "}
            <div>
              {isFetchingBalance ? (
                <div className="shimmer-container w-[80px] h-[13px]" />
              ) : (
                <>
                  {displayBalance(balance, selectedCollateral.decimals)} {selectedCollateral.symbol}
                </>
              )}
            </div>
          </div>
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
              onClick={() => setAmountTokens(balanceTokens())}
            >
              MAX
            </button>
          </div>
        </div>
        <div className="io-quick-actions mb-2">
          <div className="quick-group">
            {[1, 5, 10].map((n) => (
              <button
                key={`amount-${n}`}
                type="button"
                className="quick-btn quick-btn--dollar"
                onClick={() => (showDollar ? addUsdAmount(n) : setAmountTokens(currentAmountFloat() + n))}
              >
                {showDollar ? `+$${n}` : `+${n}`}
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
        <Input
          autoComplete="off"
          type="number"
          min="0"
          step="any"
          {...register("amount", {
            required: "This field is required.",
            validate: (v) => {
              if (Number.isNaN(Number(v)) || Number(v) < 0) {
                return "Amount must be greater than 0.";
              }
              if (parseUnits(String(v), selectedCollateral.decimals) > balance) {
                return "Not enough balance.";
              }

              return true;
            },
          })}
          className="w-full"
          useFormReturn={useFormReturn}
        />
      </div>

      <AltCollateralSwitch {...register("useAltCollateral")} market={market} />

      {missingApprovals && (
        <SwitchChainButtonWrapper chainId={market.chainId}>
          {missingApprovals.length === 0 || !isValid ? (
            <Button
              variant="primary"
              type="submit"
              disabled={!isValid || parsedAmount === 0n || splitPosition.isPending || !account}
              isLoading={splitPosition.isPending || isLoadingApprovals}
              text="Mint"
            />
          ) : (
            <ApproveButton
              tokenAddress={missingApprovals[0].address}
              tokenName={missingApprovals[0].name}
              spender={missingApprovals[0].spender}
              amount={parsedAmount}
              chainId={market.chainId}
            />
          )}
        </SwitchChainButtonWrapper>
      )}
    </form>
  );
}
