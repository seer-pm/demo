import Button from "@/components/Form/Button";
import { Market } from "@/hooks/useMarket";
import { getRedeemRouter, useRedeemPositions } from "@/hooks/useRedeemPositions";
import { useWinningPositions } from "@/hooks/useWinningPositions";
import { DEFAULT_CHAIN } from "@/lib/chains";
import { generateWinningOutcomeIndexes } from "@/lib/conditional-tokens";
import { COLLATERAL_TOKENS } from "@/lib/config";
import { useForm } from "react-hook-form";
import { Address, zeroAddress } from "viem";
import { useAccount } from "wagmi";
import { Alert } from "../Alert";
import { ApproveButton } from "../Form/ApproveButton";
import { SwitchChainButtonWrapper } from "../Form/SwitchChainButtonWrapper";
import Toggle from "../Form/Toggle";
import AltCollateralSwitch from "./AltCollateralSwitch";

export interface RedeemFormValues {
  useAltCollateral: boolean;
  isRedeemToParentCollateral: boolean;
}

interface RedeemFormProps {
  account?: Address;
  market: Market;
  successCallback?: () => void;
}

export function RedeemForm({ account, market, successCallback }: RedeemFormProps) {
  const { chainId = DEFAULT_CHAIN } = useAccount();
  const { register, handleSubmit, watch } = useForm<RedeemFormValues>({
    mode: "all",
    defaultValues: {
      useAltCollateral: false,
      isRedeemToParentCollateral: true,
    },
  });
  const isRedeemToParentCollateral = watch("isRedeemToParentCollateral");
  const isParentPayoutReported =
    market.parentMarket.payoutReported && market.parentMarket.payoutNumerators[Number(market.parentOutcome)] > 0n;

  const router = getRedeemRouter(isRedeemToParentCollateral && isParentPayoutReported, market.chainId);

  const { data: winningPositions = [], isPending } = useWinningPositions(account, market, router);

  const winningOutcomeIndexes = generateWinningOutcomeIndexes(winningPositions);

  const filteredWinningPositions = winningPositions.filter((wp) => wp.balance > 0n);

  const redeemAmounts = filteredWinningPositions.map((wp) => wp.balance);

  const {
    redeemPositions,
    approvals: { data: missingApprovals = [], isLoading: isLoadingApprovals },
  } = useRedeemPositions(
    {
      tokensAddresses: filteredWinningPositions.map((wp) => wp.tokenId),
      account,
      spender: router,
      amounts: redeemAmounts,
      chainId: market.chainId,
    },
    successCallback,
  );

  const onSubmit = async (values: RedeemFormValues) => {
    await redeemPositions.mutateAsync({
      market: market.id,
      chainId: market.chainId,
      parentOutcome: market.parentOutcome,
      collateralToken: COLLATERAL_TOKENS[market.chainId].primary.address,
      outcomeIndexes: winningOutcomeIndexes,
      amounts: redeemAmounts,
      isMainCollateral: !values.useAltCollateral,
      isRedeemToParentCollateral: isParentPayoutReported && values.isRedeemToParentCollateral,
    });
  };
  if (isPending) {
    if (chainId !== market.chainId) {
      return (
        <SwitchChainButtonWrapper chainId={market.chainId}>
          <div></div>
        </SwitchChainButtonWrapper>
      );
    }
    return <div className="shimmer-container w-full h-6"></div>;
  }

  if (winningOutcomeIndexes.length === 0) {
    return <Alert type="warning">There's nothing to redeem.</Alert>;
  }
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {market.parentMarket.id === zeroAddress && (
        <AltCollateralSwitch {...register("useAltCollateral")} chainId={market.chainId} />
      )}
      {market.parentMarket.id !== zeroAddress && isParentPayoutReported && (
        <div className="flex space-x-2">
          <div>Parent Token</div>
          <Toggle {...register("isRedeemToParentCollateral")} />
          <div>sDAI</div>
        </div>
      )}

      {missingApprovals && (
        <SwitchChainButtonWrapper chainId={market.chainId}>
          {missingApprovals.length === 0 && (
            <Button
              variant="primary"
              type="submit"
              disabled={redeemPositions.isPending || !account}
              isLoading={redeemPositions.isPending || isLoadingApprovals}
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
        </SwitchChainButtonWrapper>
      )}
    </form>
  );
}
