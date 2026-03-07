import { queryClient } from "@/lib/query-client";
import { toastifySendCallsTx, toastifyTx } from "@/lib/toastify";
import { config } from "@/wagmi";
import { UseMissingApprovalsProps, useMissingApprovals } from "@seer-pm/react";
import { Market } from "@seer-pm/sdk";
import { type Execution, getRedeemExecution } from "@seer-pm/sdk";
import { getApprovals7702 } from "@seer-pm/sdk";
import { useMutation } from "@tanstack/react-query";
import { sendTransaction } from "@wagmi/core";
import { Address, TransactionReceipt } from "viem";
import { useCheck7702Support } from "./useCheck7702Support";

interface RedeemPositionProps {
  market: Market;
  collateralToken: Address | undefined;
  parentOutcome: bigint;
  outcomeIndexes: bigint[];
  amounts: bigint[];
  isRedeemToParentCollateral: boolean;
}

async function redeemPositions(props: RedeemPositionProps): Promise<TransactionReceipt> {
  const result = await toastifyTx(
    () =>
      sendTransaction(
        config,
        getRedeemExecution({
          market: props.market,
          collateralToken: props.collateralToken,
          parentOutcome: props.parentOutcome,
          outcomeIndexes: props.outcomeIndexes,
          amounts: props.amounts,
          isRedeemToParentCollateral: props.isRedeemToParentCollateral,
        }),
      ),
    {
      txSent: { title: "Redeeming tokens..." },
      txSuccess: { title: "Tokens redeemed!" },
    },
  );

  if (!result.status) {
    throw result.error;
  }

  return result.receipt;
}

export const useRedeemPositionsLegacy = (approvalsConfig: UseMissingApprovalsProps, onSuccess?: () => void) => {
  const approvals = useMissingApprovals(approvalsConfig);

  return {
    approvals,
    redeemPositions: useMutation({
      mutationFn: redeemPositions,
      onSuccess: async (/*data: TransactionReceipt*/) => {
        queryClient.invalidateQueries({ queryKey: ["useTokenBalances"] });
        queryClient.invalidateQueries({ queryKey: ["useTokenBalance"] });
        // have to wait for market positions to finish invalidate
        await queryClient.invalidateQueries({ queryKey: ["useMarketPositions"] });
        queryClient.invalidateQueries({ queryKey: ["useWinningPositions"] });
        queryClient.invalidateQueries({ queryKey: ["usePositions"] });
        onSuccess?.();
      },
    }),
  };
};

async function redeemPositions7702(
  approvalsConfig: UseMissingApprovalsProps,
  props: RedeemPositionProps,
): Promise<TransactionReceipt> {
  const calls: Execution[] = getApprovals7702(approvalsConfig);

  calls.push(
    getRedeemExecution({
      market: props.market,
      collateralToken: props.collateralToken,
      parentOutcome: props.parentOutcome,
      outcomeIndexes: props.outcomeIndexes,
      amounts: props.amounts,
      isRedeemToParentCollateral: props.isRedeemToParentCollateral,
    }),
  );

  const result = await toastifySendCallsTx(calls, props.market.chainId, config, {
    txSent: { title: "Redeeming tokens..." },
    txSuccess: { title: "Tokens redeemed!" },
  });

  if (!result.status) {
    throw result.error;
  }

  return result.receipt;
}

const useRedeemPositions7702 = (approvalsConfig: UseMissingApprovalsProps, onSuccess?: () => unknown) => {
  const approvals = {
    data: [],
    isLoading: false,
  };

  return {
    approvals,
    redeemPositions: useMutation({
      mutationFn: (props: RedeemPositionProps) => redeemPositions7702(approvalsConfig, props),
      onSuccess: async () => {
        queryClient.invalidateQueries({ queryKey: ["useTokenBalances"] });
        queryClient.invalidateQueries({ queryKey: ["useTokenBalance"] });
        // have to wait for market positions to finish invalidate
        await queryClient.invalidateQueries({ queryKey: ["useMarketPositions"] });
        queryClient.invalidateQueries({ queryKey: ["useWinningPositions"] });
        queryClient.invalidateQueries({ queryKey: ["usePositions"] });
        onSuccess?.();
      },
    }),
  };
};

export const useRedeemPositions = (approvalsConfig: UseMissingApprovalsProps, onSuccess?: () => void) => {
  const supports7702 = useCheck7702Support();
  const redeem7702 = useRedeemPositions7702(approvalsConfig, onSuccess);
  const redeemLegacy = useRedeemPositionsLegacy(approvalsConfig, onSuccess);

  return supports7702 ? redeem7702 : redeemLegacy;
};
