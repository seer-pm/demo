import Button from "@/components/Form/Button";
import { conditionalRouterAddress } from "@/hooks/contracts/generated";
import { Market } from "@/hooks/useMarket";
import { useMissingApprovals } from "@/hooks/useMissingApprovals";
import { useRedeemConditionalPositions, useRedeemPositions } from "@/hooks/useRedeemPositions";
import { useWinningPositions } from "@/hooks/useWinningPositions";
import { DEFAULT_CHAIN, SupportedChain } from "@/lib/chains";
import { generateWinningOutcomeIndexes } from "@/lib/conditional-tokens";
import { CHAIN_ROUTERS, COLLATERAL_TOKENS } from "@/lib/config";
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
  isRedeemToCollateral: boolean;
}

interface RedeemFormProps {
  account?: Address;
  market: Market;
  router: Address;
  successCallback?: () => void;
}

export function RedeemForm({ account, market, router, successCallback }: RedeemFormProps) {
  const { chainId = DEFAULT_CHAIN } = useAccount();
  const { register, handleSubmit, watch } = useForm<RedeemFormValues>({
    mode: "all",
    defaultValues: {
      useAltCollateral: false,
      isRedeemToCollateral: false,
    },
  });

  const isRedeemToCollateral = watch("isRedeemToCollateral");
  const { data: winningPositions = [], isPending } = useWinningPositions(account, market, router);

  const winningOutcomeIndexes = generateWinningOutcomeIndexes(winningPositions);

  const filteredWinningPositions = winningPositions.filter((wp) => wp.balance > 0n);

  const redeemAmounts = filteredWinningPositions.map((wp) => wp.balance);

  const {
    redeemPositions,
    approvals: { data: missingApprovalsBase = [], isLoading: isLoadingApprovalsBase },
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
  const redeemConditionalPositions = useRedeemConditionalPositions(successCallback);

  const { data: missingConditionalApprovals = [], isLoading: isLoadingConditionalApprovals = false } =
    useMissingApprovals({
      tokensAddresses: filteredWinningPositions.map((wp) => wp.tokenId),
      account,
      spender: conditionalRouterAddress[chainId as SupportedChain],
      amounts: redeemAmounts,
      chainId: market.chainId,
    });

  const isParentPayout =
    market.parentMarket.payoutReported && market.parentMarket.payoutNumerators[Number(market.parentOutcome)] > 0n;
  const isConditionalRedeemToCollateral =
    market.parentMarket.id !== zeroAddress && isParentPayout && !isRedeemToCollateral;
  const isLoadingApprovals = isLoadingApprovalsBase || isLoadingConditionalApprovals;
  const missingApprovals = isConditionalRedeemToCollateral ? missingConditionalApprovals : missingApprovalsBase;

  const onSubmit = async (values: RedeemFormValues) => {
    if (market.parentMarket.id !== zeroAddress && isParentPayout && !values.isRedeemToCollateral) {
      return await redeemConditionalPositions.mutateAsync({
        market: market.id,
        collateralToken: COLLATERAL_TOKENS[market.chainId].primary.address,
        outcomeIndexes: winningOutcomeIndexes,
        parentOutcomeIndexes: [market.parentOutcome],
        amounts: redeemAmounts,
      });
    }
    await redeemPositions.mutateAsync({
      router,
      market: market.id,
      collateralToken: COLLATERAL_TOKENS[market.chainId].primary.address,
      outcomeIndexes: winningOutcomeIndexes,
      amounts: redeemAmounts,
      isMainCollateral: !values.useAltCollateral,
      routerType: CHAIN_ROUTERS[market.chainId],
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
      {market.parentMarket.id !== zeroAddress && isParentPayout && (
        <div className="flex space-x-2">
          <div>sDAI</div>
          <Toggle {...register("isRedeemToCollateral")} />
          <div>Parent Token</div>
        </div>
      )}

      {missingApprovals && (
        <SwitchChainButtonWrapper chainId={market.chainId}>
          {missingApprovals.length === 0 && (
            <Button
              variant="primary"
              type="submit"
              disabled={redeemPositions.isPending || redeemConditionalPositions.isPending || !account}
              isLoading={redeemPositions.isPending || redeemConditionalPositions.isPending || isLoadingApprovals}
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
