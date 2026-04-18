import type { Market } from "@seer-pm/sdk";
import {
  type Execution,
  type TxBatchNotifierFn,
  type TxNotifierFn,
  getApprovals7702,
  getRedeemExecution,
} from "@seer-pm/sdk";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Config } from "@wagmi/core";
import { sendTransaction } from "@wagmi/core";
import type { Address } from "viem";
import type { TransactionReceipt } from "viem";
import { useConfig } from "wagmi";
import type { UseMissingApprovalsProps } from "./useMissingApprovals";
import { useMissingApprovals } from "./useMissingApprovals";

export interface RedeemPositionProps {
  market: Market;
  collateralToken: Address | undefined;
  parentOutcome: bigint;
  outcomeIndexes: bigint[];
  amounts: bigint[];
  isRedeemToParentCollateral: boolean;
}

async function redeemPositions(
  props: RedeemPositionProps,
  txNotifier: TxNotifierFn,
  config: Config,
): Promise<TransactionReceipt> {
  const result = await txNotifier(
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

export function useRedeemPositionsLegacy(
  approvalsConfig: UseMissingApprovalsProps,
  onSuccess: (() => void) | undefined,
  txNotifier: TxNotifierFn,
) {
  const config = useConfig();
  const queryClient = useQueryClient();
  const approvals = useMissingApprovals(approvalsConfig);

  return {
    approvals,
    redeemPositions: useMutation({
      mutationFn: (props: RedeemPositionProps) => redeemPositions(props, txNotifier, config),
      onSuccess: async () => {
        queryClient.invalidateQueries({ queryKey: ["useTokenBalances"] });
        queryClient.invalidateQueries({ queryKey: ["useTokenBalance"] });
        await queryClient.invalidateQueries({ queryKey: ["useMarketPositions"] });
        queryClient.invalidateQueries({ queryKey: ["useWinningPositions"] });
        queryClient.invalidateQueries({ queryKey: ["usePortfolioPositions"] });
        onSuccess?.();
      },
    }),
  };
}

async function redeemPositions7702(
  approvalsConfig: UseMissingApprovalsProps,
  props: RedeemPositionProps,
  batchNotifier: TxBatchNotifierFn,
  config: Config,
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

  const result = await batchNotifier(calls, props.market.chainId, config, {
    txSent: { title: "Redeeming tokens..." },
    txSuccess: { title: "Tokens redeemed!" },
  });

  if (!result.status) {
    throw result.error;
  }

  return result.receipt;
}

function useRedeemPositions7702(
  approvalsConfig: UseMissingApprovalsProps,
  onSuccess: (() => unknown) | undefined,
  batchNotifier: TxBatchNotifierFn,
) {
  const config = useConfig();
  const queryClient = useQueryClient();
  const approvals = {
    data: [],
    isLoading: false,
  };

  return {
    approvals,
    redeemPositions: useMutation({
      mutationFn: (props: RedeemPositionProps) => redeemPositions7702(approvalsConfig, props, batchNotifier, config),
      onSuccess: async () => {
        queryClient.invalidateQueries({ queryKey: ["useTokenBalances"] });
        queryClient.invalidateQueries({ queryKey: ["useTokenBalance"] });
        await queryClient.invalidateQueries({ queryKey: ["useMarketPositions"] });
        queryClient.invalidateQueries({ queryKey: ["useWinningPositions"] });
        queryClient.invalidateQueries({ queryKey: ["usePortfolioPositions"] });
        onSuccess?.();
      },
    }),
  };
}

export function useRedeemPositions(
  approvalsConfig: UseMissingApprovalsProps,
  onSuccess: (() => void) | undefined,
  supports7702: boolean,
  txNotifier: TxNotifierFn,
  batchNotifier: TxBatchNotifierFn,
) {
  const redeem7702 = useRedeemPositions7702(approvalsConfig, onSuccess, batchNotifier);
  const redeemLegacy = useRedeemPositionsLegacy(approvalsConfig, onSuccess, txNotifier);

  return supports7702 ? redeem7702 : redeemLegacy;
}
