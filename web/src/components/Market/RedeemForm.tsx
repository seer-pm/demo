import Button from "@/components/Form/Button";
import { conditionalRouterAddress } from "@/hooks/contracts/generated";
import { Market } from "@/hooks/useMarket";
import { useMissingApprovals } from "@/hooks/useMissingApprovals";
import { useRedeemConditionalPositions, useRedeemPositions } from "@/hooks/useRedeemPositions";
import { useWinningPositions } from "@/hooks/useWinningPositions";
import { DEFAULT_CHAIN, SupportedChain } from "@/lib/chains";
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
  const { data: winningPositionsData, isPending } = useWinningPositions(account, market, router);
  const { winningPositions = [], winningOutcomeIndexes = [] } = winningPositionsData || {};

  const redeemPositions = useRedeemPositions(successCallback);
  const redeemConditionalPositions = useRedeemConditionalPositions(successCallback);

  const redeemAmounts = winningPositions.map((wp) => wp.balance);

  let { data: missingApprovals, isLoading: isLoadingApprovals } = useMissingApprovals(
    winningPositions.map((wp) => wp.tokenId),
    account,
    router,
    redeemAmounts,
    market.chainId,
  );

  const { data: missingConditionalApprovals, isLoading: isLoadingConditionalApprovals } = useMissingApprovals(
    winningPositions.map((wp) => wp.tokenId),
    account,
    conditionalRouterAddress[chainId as SupportedChain],
    redeemAmounts,
    market.chainId,
  );

  const isParentPayout =
    market.parentMarket.payoutReported && market.parentMarket.payoutNumerators[Number(market.parentOutcome)] > 0n;
  const isConditionalRedeemToCollateral =
    market.parentMarket.id !== zeroAddress && isParentPayout && !isRedeemToCollateral;
  isLoadingApprovals = isLoadingApprovals || isLoadingConditionalApprovals;
  missingApprovals = isConditionalRedeemToCollateral ? missingConditionalApprovals : missingApprovals;

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
      market,
      outcomeIndexes: winningOutcomeIndexes,
      amounts: redeemAmounts,
      isMainCollateral: !values.useAltCollateral,
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

  if (!winningPositions || winningOutcomeIndexes.length === 0) {
    return <Alert type="warning">There's nothing to redeem.</Alert>;
  }
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {market.type === "Generic" && <AltCollateralSwitch {...register("useAltCollateral")} market={market} />}
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
