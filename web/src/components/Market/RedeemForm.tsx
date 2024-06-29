import Button from "@/components/Form/Button";
import { useMissingApprovals } from "@/hooks/useMissingApprovals";
import { useRedeemPositions } from "@/hooks/useRedeemPositions";
import { useWinningPositions } from "@/hooks/useWinningPositions";
import { generateWinningIndexSet } from "@/lib/conditional-tokens";
import { CHAIN_ROUTERS, COLLATERAL_TOKENS } from "@/lib/config";
import { useForm } from "react-hook-form";
import { Address } from "viem";
import { Alert } from "../Alert";
import { ApproveButton } from "../Form/ApproveButton";
import AltCollateralSwitch from "./AltCollateralSwitch";

export interface RedeemFormValues {
  useAltCollateral: boolean;
}

interface RedeemFormProps {
  account?: Address;
  chainId: number;
  router: Address;
  conditionId: `0x${string}`;
  outcomeSlotCount: number;
}

export function RedeemForm({ account, chainId, router, conditionId, outcomeSlotCount }: RedeemFormProps) {
  const { register, handleSubmit } = useForm<RedeemFormValues>({
    mode: "all",
    defaultValues: {
      useAltCollateral: false,
    },
  });

  const { data: winningPositions = [] } = useWinningPositions(account, chainId, router, conditionId, outcomeSlotCount);

  const winningIndexSet = generateWinningIndexSet(winningPositions);

  const redeemPositions = useRedeemPositions();

  const filteredWinningPositions = winningPositions.filter((wp) => wp.balance > 0n);

  const { data: missingApprovals } = useMissingApprovals(
    filteredWinningPositions.map((wp) => wp.tokenId),
    account,
    router,
    filteredWinningPositions.map((wp) => wp.balance),
  );

  if (winningIndexSet.length === 0) {
    return <Alert type="warning">There's nothing to redeem.</Alert>;
  }

  const onSubmit = async (values: RedeemFormValues) => {
    await redeemPositions.mutateAsync({
      account: account!,
      router,
      conditionId,
      collateralToken: COLLATERAL_TOKENS[chainId].primary.address,
      indexSets: winningIndexSet,
      isMainCollateral: !values.useAltCollateral,
      routerType: CHAIN_ROUTERS[chainId!],
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <AltCollateralSwitch {...register("useAltCollateral")} chainId={chainId} />

      {missingApprovals && (
        <div>
          {missingApprovals.length === 0 && (
            <Button
              variant="primary"
              type="submit"
              disabled={redeemPositions.isPending || !account}
              isLoading={redeemPositions.isPending}
              text="Submit"
            />
          )}
          {missingApprovals.length > 0 && (
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
      )}
    </form>
  );
}
