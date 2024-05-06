import Button from "@/components/Form/Button";
import Input from "@/components/Form/Input";
import AltCollateralSwitch from "@/components/Market/AltCollateralSwitch";
import { useApproveTokens } from "@/hooks/useApproveTokens";
import { useMergePositions } from "@/hooks/useMergePositions";
import { useMissingApprovals } from "@/hooks/useMissingApprovals";
import { useTokenBalance } from "@/hooks/useTokenBalance";
import { Position, useUserPositions } from "@/hooks/useUserPositions";
import { useWrappedAddresses } from "@/hooks/useWrappedAddresses";
import { SupportedChain } from "@/lib/chains";
import { CHAIN_ROUTERS, COLLATERAL_TOKENS } from "@/lib/config";
import { Token, hasAltCollateral } from "@/lib/tokens";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Address, formatUnits, parseUnits } from "viem";

export interface MergeFormValues {
  amount: number;
  useAltCollateral: boolean;
}

interface MergeFormProps {
  account?: Address;
  chainId: SupportedChain;
  router: Address;
  conditionId: `0x${string}`;
  outcomeSlotCount: number;
}

function ApproveButton({
  tokenAddress,
  tokenName,
  router,
  amount,
}: { tokenAddress: Address; tokenName: string; router: Address; amount: bigint }) {
  const approveTokens = useApproveTokens();

  const approveTokensHandler = async () => {
    return await approveTokens.mutateAsync({
      tokenAddress: tokenAddress,
      spender: router,
      amount: amount,
    });
  };

  return (
    <Button
      variant="primary"
      type="button"
      onClick={approveTokensHandler}
      isLoading={approveTokens.isPending}
      text={`Approve ${tokenName}`}
      className="w-full"
    />
  );
}

export function MergeForm({ account, chainId, router, conditionId, outcomeSlotCount }: MergeFormProps) {
  const { data: positions = [] } = useUserPositions(account, chainId, router, conditionId, outcomeSlotCount);

  const { data: wrappedAddresses = [] } = useWrappedAddresses(chainId, router, conditionId, outcomeSlotCount);

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

  const selectedCollateral = (
    hasAltCollateral(COLLATERAL_TOKENS[chainId].secondary) && useAltCollateral
      ? COLLATERAL_TOKENS[chainId].secondary
      : COLLATERAL_TOKENS[chainId].primary
  ) as Token;
  const { data: balance = BigInt(0) } = useTokenBalance(account, selectedCollateral?.address);

  const parsedAmount = parseUnits(String(amount || 0), selectedCollateral.decimals);
  const { data: missingApprovals } = useMissingApprovals(wrappedAddresses, account, router, parsedAmount);

  useEffect(() => {
    dirtyFields["amount"] && trigger("amount");
  }, [balance]);

  const mergePositions = useMergePositions((/*receipt: TransactionReceipt*/) => {
    reset();
  });

  const onSubmit = async (/*values: MergeFormValues*/) => {
    await mergePositions.mutateAsync({
      router,
      conditionId,
      collateralToken: selectedCollateral.address,
      outcomeSlotCount,
      amount: parsedAmount,
      isMainCollateral: !useAltCollateral,
      routerType: CHAIN_ROUTERS[chainId!],
    });
  };

  const minPositionAmount = positions.reduce((acum, curr: Position) => {
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
            onClick={() =>
              setValue("amount", Number(formatUnits(minPositionAmount, selectedCollateral.decimals)), {
                shouldValidate: true,
                shouldDirty: true,
              })
            }
          >
            Max
          </div>
        </div>
        <Input
          autoComplete="off"
          type="text"
          {...register("amount", {
            required: "This field is required.",
            valueAsNumber: true,
            validate: (v) => {
              if (Number.isNaN(Number(v)) || Number(v) <= 0) {
                return "Amount must be greater than 0.";
              }

              if (parseUnits(String(v), selectedCollateral.decimals) > minPositionAmount) {
                return "Not enough balance.";
              }

              return true;
            },
          })}
          className="w-full"
          useFormReturn={useFormReturn}
        />
      </div>

      <AltCollateralSwitch {...register("useAltCollateral")} chainId={chainId} />

      {missingApprovals && (
        <div>
          {missingApprovals.length === 0 && (
            <Button
              variant="primary"
              type="submit"
              disabled={!isValid || mergePositions.isPending || !account}
              isLoading={mergePositions.isPending}
              text="Merge"
            />
          )}
          {missingApprovals.length > 0 && (
            <div className="space-y-[8px]">
              {missingApprovals.map((approval) => (
                <ApproveButton
                  key={approval.address}
                  tokenAddress={approval.address}
                  tokenName={approval.name}
                  router={router}
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
