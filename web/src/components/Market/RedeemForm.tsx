import { Card } from "@/components/Card";
import Button from "@/components/Form/Button";
import { useRedeemPositions } from "@/hooks/useRedeemPositions";
import { useWinningPositions } from "@/hooks/useWinningPositions";
import { generateWinningIndexSet } from "@/lib/conditional-tokens";
import { Address, TransactionReceipt } from "viem";

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

  const onSubmit = async () => {
    await redeemPositions.mutateAsync({
      account: account!,
      router,
      conditionId,
      collateralToken,
      indexSets: winningIndexSet,
    });
  };

  if (winningIndexSet.length === 0) {
    return null;
  }

  return (
    <Card title="Redeem">
      <div className="space-y-5">
        <Button
          className="btn btn-primary"
          type="button"
          onClick={onSubmit}
          disabled={redeemPositions.isPending || !account}
          isLoading={redeemPositions.isPending}
          text="Submit"
        />
      </div>
    </Card>
  );
}
