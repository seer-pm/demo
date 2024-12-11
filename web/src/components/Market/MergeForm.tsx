import Button from "@/components/Form/Button";
import Input from "@/components/Form/Input";
import AltCollateralSwitch from "@/components/Market/AltCollateralSwitch";
import { Market } from "@/hooks/useMarket";
import { Position, useMarketPositions } from "@/hooks/useMarketPositions";
import { useMergePositions } from "@/hooks/useMergePositions";
import { useMissingApprovals } from "@/hooks/useMissingApprovals";
import { useSelectedCollateral } from "@/hooks/useSelectedCollateral";
import { useTokenBalance } from "@/hooks/useTokenBalance";
import { displayBalance } from "@/lib/utils";
import clsx from "clsx";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Address, formatUnits, parseUnits } from "viem";
import { Alert } from "../Alert";
import { ApproveButton } from "../Form/ApproveButton";
import { SwitchChainButtonWrapper } from "../Form/SwitchChainButtonWrapper";

export interface MergeFormValues {
  amount: string;
  useAltCollateral: boolean;
}

interface MergeFormProps {
  account?: Address;
  market: Market;
  router: Address;
}

function getMergePositions(market: Market, positions: Position[], useAltCollateral: boolean) {
  if (positions.length === 0) {
    return [];
  }

  if (market.type === "Generic") {
    return positions;
  }

  // in a futarchy market we merge the first or the last two tokens
  return !useAltCollateral ? [positions[0], positions[1]] : [positions[2], positions[3]];
}

export function MergeForm({ account, market, router }: MergeFormProps) {
  const useFormReturn = useForm<MergeFormValues>({
    mode: "all",
    defaultValues: {
      amount: "",
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

  const { data: _positions = [], isFetching: isFetchingPositions } = useMarketPositions(account, market);
  // in a futarchy market we merge the first or the last two tokens
  const positions = getMergePositions(market, _positions, useAltCollateral);
  const selectedCollateral = useSelectedCollateral(market, useAltCollateral);
  const { data: balance = BigInt(0) } = useTokenBalance(account, selectedCollateral?.address, market.chainId);

  const parsedAmount = parseUnits(amount ?? "0", selectedCollateral.decimals);

  const tokensToMerge = positions.map((position) => position.tokenId);

  const { data: missingApprovals, isLoading: isLoadingApprovals } = useMissingApprovals(
    tokensToMerge,
    account,
    router,
    parsedAmount,
    market.chainId,
  );

  useEffect(() => {
    dirtyFields["amount"] && trigger("amount");
  }, [balance]);

  const mergePositions = useMergePositions((/*receipt: TransactionReceipt*/) => {
    reset();
  });

  const onSubmit = async (/*values: MergeFormValues*/) => {
    await mergePositions.mutateAsync({
      router,
      market: market,
      amount: parsedAmount,
      isMainCollateral: !useAltCollateral,
    });
  };

  const maxPositionAmount = positions.reduce(
    (min, curr) => (min < curr.balance ? min : curr.balance),
    positions?.[0]?.balance ?? 0n,
  );
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div>
        <div className="mb-4">
          <Alert type="info">
            <p className="text-[14px]">To merge, provide an equal number of tokens for each outcome.</p>
          </Alert>
        </div>
        <div className="flex justify-between items-center">
          <div className="text-[14px]">Amount</div>
          <div
            className="text-purple-primary cursor-pointer"
            onClick={() => {
              setValue("amount", formatUnits(maxPositionAmount, selectedCollateral.decimals), {
                shouldValidate: true,
                shouldDirty: true,
              });
            }}
          >
            Max
          </div>
        </div>
        <div
          className={clsx(
            "text-[12px] text-black-secondary mb-2 flex gap-1",
            isFetchingPositions ? "items-center" : "",
          )}
        >
          Balance:{" "}
          <div>
            {isFetchingPositions ? (
              <div className="shimmer-container w-[80px] h-[13px]" />
            ) : (
              <div className="max-h-[80px] overflow-y-auto custom-scrollbar">
                {positions.length > 0
                  ? positions.map((position) => {
                      return (
                        <div key={position.tokenId}>
                          {displayBalance(position.balance, Number(position.decimals))} {position.symbol}
                        </div>
                      );
                    })
                  : 0}
              </div>
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
              if (parseUnits(String(v), selectedCollateral.decimals) > maxPositionAmount) {
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
          {missingApprovals.length === 0 && (
            <Button
              variant="primary"
              type="submit"
              disabled={!isValid || parsedAmount === 0n || mergePositions.isPending || !account}
              isLoading={mergePositions.isPending || isLoadingApprovals}
              text="Merge"
            />
          )}
          {missingApprovals.length > 0 && parsedAmount <= maxPositionAmount && (
            <div className="space-y-[8px]">
              {missingApprovals.map((approval) => (
                <ApproveButton
                  key={approval.address}
                  tokenAddress={approval.address}
                  tokenName={approval.name}
                  spender={approval.spender}
                  amount={parsedAmount}
                />
              ))}
            </div>
          )}
        </SwitchChainButtonWrapper>
      )}
    </form>
  );
}
