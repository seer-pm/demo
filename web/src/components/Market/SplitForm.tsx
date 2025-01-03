import Button from "@/components/Form/Button";
import Input from "@/components/Form/Input";
import AltCollateralSwitch from "@/components/Market/AltCollateralSwitch";
import { Market } from "@/hooks/useMarket";
import { useMissingApprovals } from "@/hooks/useMissingApprovals";
import { useSelectedCollateral } from "@/hooks/useSelectedCollateral";
import { useSplitPosition } from "@/hooks/useSplitPosition";
import { useTokenBalance } from "@/hooks/useTokenBalance";
import { NATIVE_TOKEN, displayBalance } from "@/lib/utils";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Address, formatUnits, parseUnits } from "viem";
import { ApproveButton } from "../Form/ApproveButton";
import { SwitchChainButtonWrapper } from "../Form/SwitchChainButtonWrapper";

export interface SplitFormValues {
  amount: string;
  useAltCollateral: boolean;
}

interface SplitFormProps {
  account?: Address;
  router: Address;
  market: Market;
}

export function SplitForm({ account, router, market }: SplitFormProps) {
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
  const { data: missingApprovals = [], isLoading: isLoadingApprovals } = useMissingApprovals(
    selectedCollateral.address !== NATIVE_TOKEN ? [selectedCollateral.address] : [],
    account,
    router,
    parsedAmount,
    market.chainId,
  );

  useEffect(() => {
    dirtyFields["amount"] && trigger("amount");
  }, [balance, useAltCollateral]);

  const splitPosition = useSplitPosition((/*receipt: TransactionReceipt*/) => {
    reset();
  });

  const onSubmit = async (/*values: SplitFormValues*/) => {
    await splitPosition.mutateAsync({
      router: router,
      market: market,
      amount: parsedAmount,
      isMainCollateral: !useAltCollateral,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div>
        <div className="flex justify-between items-center">
          <div className="text-[14px]">Amount</div>
          <div
            className="text-purple-primary cursor-pointer"
            onClick={() => {
              setValue("amount", formatUnits(balance, selectedCollateral.decimals), {
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
                {displayBalance(balance, selectedCollateral.decimals)} {selectedCollateral.symbol}
              </>
            )}
          </div>
        </div>
        <Input
          autoComplete="off"
          type="number"
          min="0"
          step="any"
          {...register("amount", {
            required: "This field is required.",
            // valueAsNumber: true,
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
            />
          )}
        </SwitchChainButtonWrapper>
      )}
    </form>
  );
}
