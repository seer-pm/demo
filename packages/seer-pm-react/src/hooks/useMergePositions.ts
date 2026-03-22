import type { Market } from "@seer-pm/sdk";
import {
  type Execution,
  type TxBatchNotifierFn,
  type TxNotifierFn,
  getApprovals7702,
  getMergeExecution,
} from "@seer-pm/sdk";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Config } from "@wagmi/core";
import { sendTransaction } from "@wagmi/core";
import type { Address } from "viem";
import type { TransactionReceipt } from "viem";
import { useConfig } from "wagmi";
import type { UseMissingApprovalsProps } from "./useMissingApprovals";
import { useMissingApprovals } from "./useMissingApprovals";

export interface MergePositionProps {
  router: Address;
  market: Market;
  amount: bigint;
  collateralToken: Address | undefined;
}

async function mergePositions(
  props: MergePositionProps,
  txNotifier: TxNotifierFn,
  config: Config,
): Promise<TransactionReceipt> {
  const result = await txNotifier(
    () =>
      sendTransaction(
        config,
        getMergeExecution({
          router: props.router,
          market: props.market,
          collateralToken: props.collateralToken,
          amount: props.amount,
        }),
      ),
    { txSent: { title: "Merging tokens..." }, txSuccess: { title: "Tokens merged!" } },
  );

  if (!result.status) {
    throw result.error;
  }

  return result.receipt;
}

export function useMergePositionsLegacy(
  approvalsConfig: UseMissingApprovalsProps,
  onSuccess: (data: TransactionReceipt) => unknown,
  txNotifier: TxNotifierFn,
) {
  const config = useConfig();
  const queryClient = useQueryClient();
  const approvals = useMissingApprovals(approvalsConfig);

  return {
    approvals,
    mergePositions: useMutation({
      mutationFn: (props: MergePositionProps) => mergePositions(props, txNotifier, config),
      onSuccess: (data: TransactionReceipt) => {
        queryClient.invalidateQueries({ queryKey: ["useMarketPositions"] });
        queryClient.invalidateQueries({ queryKey: ["useTokenBalances"] });
        queryClient.invalidateQueries({ queryKey: ["useTokenBalance"] });
        onSuccess(data);
      },
    }),
  };
}

async function mergePositions7702(
  approvalsConfig: UseMissingApprovalsProps,
  props: MergePositionProps,
  batchNotifier: TxBatchNotifierFn,
  config: Config,
): Promise<TransactionReceipt> {
  const calls: Execution[] = getApprovals7702(approvalsConfig);

  calls.push(
    getMergeExecution({
      router: props.router,
      market: props.market,
      collateralToken: props.collateralToken,
      amount: props.amount,
    }),
  );

  const result = await batchNotifier(calls, props.market.chainId, config, {
    txSent: { title: "Merging tokens..." },
    txSuccess: { title: "Tokens merged!" },
  });

  if (!result.status) {
    throw result.error;
  }

  return result.receipt;
}

function useMergePositions7702(
  approvalsConfig: UseMissingApprovalsProps,
  onSuccess: (data: TransactionReceipt) => unknown,
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
    mergePositions: useMutation({
      mutationFn: (props: MergePositionProps) => mergePositions7702(approvalsConfig, props, batchNotifier, config),
      onSuccess: (data: TransactionReceipt) => {
        queryClient.invalidateQueries({ queryKey: ["useMarketPositions"] });
        queryClient.invalidateQueries({ queryKey: ["useTokenBalances"] });
        queryClient.invalidateQueries({ queryKey: ["useTokenBalance"] });
        queryClient.invalidateQueries({ queryKey: ["useMissingApprovals"] });
        onSuccess(data);
      },
    }),
  };
}

export function useMergePositions(
  approvalsConfig: UseMissingApprovalsProps,
  onSuccess: (data: TransactionReceipt) => unknown,
  supports7702: boolean,
  txNotifier: TxNotifierFn,
  batchNotifier: TxBatchNotifierFn,
) {
  const merge7702 = useMergePositions7702(approvalsConfig, onSuccess, batchNotifier);
  const mergeLegacy = useMergePositionsLegacy(approvalsConfig, onSuccess, txNotifier);

  return supports7702 ? merge7702 : mergeLegacy;
}
