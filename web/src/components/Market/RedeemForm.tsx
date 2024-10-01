import Button from "@/components/Form/Button";
import { Market } from "@/hooks/useMarket";
import { useMissingApprovals } from "@/hooks/useMissingApprovals";
import { useRedeemPositions } from "@/hooks/useRedeemPositions";
import { useWinningPositions } from "@/hooks/useWinningPositions";
import { generateWinningOutcomeIndexes } from "@/lib/conditional-tokens";
import { CHAIN_ROUTERS, COLLATERAL_TOKENS } from "@/lib/config";
import { useForm } from "react-hook-form";
import { Address, zeroAddress } from "viem";
import { Alert } from "../Alert";
import { ApproveButton } from "../Form/ApproveButton";
import AltCollateralSwitch from "./AltCollateralSwitch";

export interface RedeemFormValues {
  useAltCollateral: boolean;
}

interface RedeemFormProps {
  account?: Address;
  market: Market;
  chainId: number;
  router: Address;
}

export function RedeemForm({ account, market, chainId, router }: RedeemFormProps) {
  const { register, handleSubmit } = useForm<RedeemFormValues>({
    mode: "all",
    defaultValues: {
      useAltCollateral: false,
    },
  });

  const { data: winningPositions = [] } = useWinningPositions(account, market, router);

  const winningOutcomeIndexes = generateWinningOutcomeIndexes(winningPositions);

  const redeemPositions = useRedeemPositions();

  const filteredWinningPositions = winningPositions.filter((wp) => wp.balance > 0n);

  const redeemAmounts = filteredWinningPositions.map((wp) => wp.balance);

  const { data: missingApprovals } = useMissingApprovals(
    filteredWinningPositions.map((wp) => wp.tokenId),
    account,
    router,
    redeemAmounts,
  );

  if (winningOutcomeIndexes.length === 0) {
    return <Alert type="warning">There's nothing to redeem.</Alert>;
  }

  const onSubmit = async (values: RedeemFormValues) => {
    await redeemPositions.mutateAsync({
      router,
      market: market.id,
      collateralToken: COLLATERAL_TOKENS[chainId].primary.address,
      outcomeIndexes: winningOutcomeIndexes,
      amounts: redeemAmounts,
      isMainCollateral: !values.useAltCollateral,
      routerType: CHAIN_ROUTERS[chainId!],
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {market.parentMarket === zeroAddress && (
        <AltCollateralSwitch {...register("useAltCollateral")} chainId={chainId} />
      )}

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
