import Button from "@/components/Form/Button";
import { Market } from "@/hooks/useMarket";
import { useMissingApprovals } from "@/hooks/useMissingApprovals";
import { useRedeemPositions } from "@/hooks/useRedeemPositions";
import { useWinningPositions } from "@/hooks/useWinningPositions";
import { useForm } from "react-hook-form";
import { Address } from "viem";
import { Alert } from "../Alert";
import { ApproveButton } from "../Form/ApproveButton";
import { SwitchChainButtonWrapper } from "../Form/SwitchChainButtonWrapper";
import AltCollateralSwitch from "./AltCollateralSwitch";

export interface RedeemFormValues {
  useAltCollateral: boolean;
}

interface RedeemFormProps {
  account?: Address;
  market: Market;
  router: Address;
}

export function RedeemForm({ account, market, router }: RedeemFormProps) {
  const { register, handleSubmit } = useForm<RedeemFormValues>({
    mode: "all",
    defaultValues: {
      useAltCollateral: false,
    },
  });

  const { data: winningPositionsData } = useWinningPositions(account, market, router);
  const { winningPositions = [], winningOutcomeIndexes = [] } = winningPositionsData || {};

  const redeemPositions = useRedeemPositions();

  const redeemAmounts = winningPositions.map((wp) => wp.balance);

  const { data: missingApprovals } = useMissingApprovals(
    winningPositions.map((wp) => wp.tokenId),
    account,
    router,
    redeemAmounts,
    market.chainId,
  );

  if (!winningPositions || winningOutcomeIndexes.length === 0) {
    return <Alert type="warning">There's nothing to redeem.</Alert>;
  }

  const onSubmit = async (values: RedeemFormValues) => {
    await redeemPositions.mutateAsync({
      router,
      market: market,
      outcomeIndexes: winningOutcomeIndexes,
      amounts: redeemAmounts,
      isMainCollateral: !values.useAltCollateral,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {market.type === "Generic" && <AltCollateralSwitch {...register("useAltCollateral")} market={market} />}

      {missingApprovals && (
        <SwitchChainButtonWrapper chainId={market.chainId}>
          {missingApprovals.length === 0 && (
            <Button
              variant="primary"
              type="submit"
              disabled={redeemPositions.isPending || !account}
              isLoading={redeemPositions.isPending}
              text="Redeem"
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
        </SwitchChainButtonWrapper>
      )}
    </form>
  );
}
