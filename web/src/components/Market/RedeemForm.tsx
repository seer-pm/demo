import { Card } from "@/components/Card";
import Button from "@/components/Form/Button";
import { useRedeemPositions } from "@/hooks/useRedeemPositions";
import { useWinningPositions } from "@/hooks/useWinningPositions";
import { generateWinningIndexSet } from "@/lib/conditional-tokens";
import { CHAIN_ROUTERS, COLLATERAL_TOKENS } from "@/lib/config";
import { useForm } from "react-hook-form";
import { Address, TransactionReceipt } from "viem";
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

  const redeemPositions = useRedeemPositions((_receipt: TransactionReceipt) => {
    alert("Position redeemed!");
  });

  if (winningIndexSet.length === 0) {
    return null;
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
    <Card title="Redeem">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <AltCollateralSwitch {...register("useAltCollateral")} chainId={chainId} />

        <Button
          className="btn btn-primary"
          type="submit"
          disabled={redeemPositions.isPending || !account}
          isLoading={redeemPositions.isPending}
          text="Submit"
        />
      </form>
    </Card>
  );
}
