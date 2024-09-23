import Button from "@/components/Form/Button";
import Input from "@/components/Form/Input";
import AltCollateralSwitch from "@/components/Market/AltCollateralSwitch";
import { Market } from "@/hooks/useMarket";
import { Position, useMarketPositions } from "@/hooks/useMarketPositions";
import { useMergePositions } from "@/hooks/useMergePositions";
import { useMissingApprovals } from "@/hooks/useMissingApprovals";
import { useSelectedCollateral } from "@/hooks/useSelectedCollateral";
import { useTokenBalance } from "@/hooks/useTokenBalance";
import { SupportedChain } from "@/lib/chains";
import { CHAIN_ROUTERS, COLLATERAL_TOKENS } from "@/lib/config";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Address, formatUnits, parseUnits, zeroAddress } from "viem";
import { ApproveButton } from "../Form/ApproveButton";

export interface MergeFormValues {
  amount: number;
  useAltCollateral: boolean;
}

interface MergeFormProps {
  account?: Address;
  market: Market;
  chainId: SupportedChain;
  router: Address;
}

export function MergeForm({ account, market, chainId, router }: MergeFormProps) {
  const { data: positions = [] } = useMarketPositions(account, market);

  const useFormReturn = useForm<MergeFormValues>({
    mode: "all",
    defaultValues: {
      amount: 0,
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

  const selectedCollateral = useSelectedCollateral(market, chainId, useAltCollateral);
  const { data: balance = BigInt(0) } = useTokenBalance(account, selectedCollateral?.address);

  const parsedAmount = parseUnits(String(amount || 0), selectedCollateral.decimals);
  const { data: missingApprovals } = useMissingApprovals(market.wrappedTokens, account, router, parsedAmount);

  useEffect(() => {
    dirtyFields["amount"] && trigger("amount");
  }, [balance]);

  const mergePositions = useMergePositions((/*receipt: TransactionReceipt*/) => {
    reset();
  });

  const onSubmit = async (/*values: MergeFormValues*/) => {
    await mergePositions.mutateAsync({
      router,
      market: market.id,
      collateralToken: COLLATERAL_TOKENS[chainId].primary.address,
      outcomeSlotCount: market.outcomes.length,
      amount: parsedAmount,
      isMainCollateral: !useAltCollateral,
      routerType: CHAIN_ROUTERS[chainId!],
    });
  };

  const maxPositionAmount = positions.reduce((acum, curr: Position) => {
    if (acum === 0n || curr.balance < acum) {
      // biome-ignore lint/style/noParameterAssign:
      acum = curr.balance;
    }
    return acum;
  }, BigInt(0));
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <div className="text-[14px]">Amount</div>
          <div
            className="text-purple-primary cursor-pointer"
            onClick={() => {
              // round down maxPositionAmount
              const maxJsDecimals = 16;
              const roundTo =
                selectedCollateral.decimals > maxJsDecimals
                  ? BigInt(10 ** (selectedCollateral.decimals - maxJsDecimals))
                  : 1n;
              const max = Number(formatUnits((maxPositionAmount / roundTo) * roundTo, selectedCollateral.decimals));
              setValue("amount", max, {
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
          min="0"
          step="any"
          {...register("amount", {
            required: "This field is required.",
            valueAsNumber: true,
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

      {market.parentMarket === zeroAddress && (
        <AltCollateralSwitch {...register("useAltCollateral")} chainId={chainId} />
      )}

      {missingApprovals && (
        <div>
          {missingApprovals.length === 0 && (
            <Button
              variant="primary"
              type="submit"
              disabled={!isValid || parsedAmount === 0n || mergePositions.isPending || !account}
              isLoading={mergePositions.isPending}
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
        </div>
      )}
    </form>
  );
}
