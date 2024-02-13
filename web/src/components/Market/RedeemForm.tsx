import { Card } from "@/components/Card";
import Button from "@/components/Form/Button";
import { useCollateralsInfo } from "@/hooks/useCollateralsInfo";
import { useRedeemPositions } from "@/hooks/useRedeemPositions";
import { useWinningPositions } from "@/hooks/useWinningPositions";
import { generateWinningIndexSet } from "@/lib/conditional-tokens";
import { CHAIN_ROUTERS } from "@/lib/config";
import { useForm } from "react-hook-form";
import { Address, TransactionReceipt } from "viem";
import { useAccount } from "wagmi";
import { Spinner } from "../Spinner";
import AltCollateralSwitch from "./AltCollateralSwitch";

export interface RedeemFormValues {
  useAltCollateral: boolean;
}

interface RedeemFormProps {
  account?: Address;
  router: Address;
  conditionId: `0x${string}`;
  conditionalTokens: Address;
  collateralToken: Address;
  outcomeSlotCount: number;
}

export function RedeemForm({
  account,
  router,
  conditionId,
  conditionalTokens,
  collateralToken,
  outcomeSlotCount,
}: RedeemFormProps) {
  const { chainId } = useAccount();
  const { register, handleSubmit } = useForm<RedeemFormValues>({
    mode: "all",
    defaultValues: {
      useAltCollateral: false,
    },
  });

  const { data: collaterals = [] } = useCollateralsInfo(chainId);

  const altCollateralEnabled = collaterals.length > 1;

  const { data: winningPositions = [] } = useWinningPositions(
    account,
    router,
    conditionId,
    conditionalTokens,
    collateralToken,
    outcomeSlotCount,
  );

  const winningIndexSet = generateWinningIndexSet(winningPositions);

  const redeemPositions = useRedeemPositions((_receipt: TransactionReceipt) => {
    alert("Position redeemed!");
  });

  if (winningIndexSet.length === 0) {
    return null;
  }

  if (collaterals.length === 0) {
    return <Spinner />;
  }

  const onSubmit = async (values: RedeemFormValues) => {
    await redeemPositions.mutateAsync({
      account: account!,
      router,
      conditionId,
      collateralToken,
      indexSets: winningIndexSet,
      isMainCollateral: !values.useAltCollateral,
      routerType: CHAIN_ROUTERS[chainId!],
    });
  };

  return (
    <Card title="Redeem">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {altCollateralEnabled && (
          <AltCollateralSwitch {...register("useAltCollateral")} altCollateral={collaterals[1]} />
        )}

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
