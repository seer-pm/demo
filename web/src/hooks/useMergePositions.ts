import { Market } from "@/lib/market";
import { queryClient } from "@/lib/query-client";
import { toastifySendCallsTx, toastifyTx } from "@/lib/toastify";
import { config } from "@/wagmi";
import { getMergeExecution } from "@seer-pm/sdk";
import { useMutation } from "@tanstack/react-query";
import { sendTransaction } from "@wagmi/core";
import { Address, TransactionReceipt } from "viem";
import { Execution, useCheck7702Support } from "./useCheck7702Support";
import { UseMissingApprovalsProps, getApprovals7702, useMissingApprovals } from "./useMissingApprovals";

interface MergePositionProps {
  router: Address;
  market: Market;
  amount: bigint;
  collateralToken: Address | undefined;
}

async function mergePositions(props: MergePositionProps): Promise<TransactionReceipt> {
  const result = await toastifyTx(
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

const useMergePositionsLegacy = (
  approvalsConfig: UseMissingApprovalsProps,
  onSuccess: (data: TransactionReceipt) => unknown,
) => {
  const approvals = useMissingApprovals(approvalsConfig);

  return {
    approvals,
    mergePositions: useMutation({
      mutationFn: mergePositions,
      onSuccess: (data: TransactionReceipt) => {
        queryClient.invalidateQueries({ queryKey: ["useMarketPositions"] });
        queryClient.invalidateQueries({ queryKey: ["useTokenBalances"] });
        queryClient.invalidateQueries({ queryKey: ["useTokenBalance"] });
        onSuccess(data);
      },
    }),
  };
};

async function mergePositions7702(
  approvalsConfig: UseMissingApprovalsProps,
  props: MergePositionProps,
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

  const result = await toastifySendCallsTx(calls, props.market.chainId, config, {
    txSent: { title: "Merging tokens..." },
    txSuccess: { title: "Tokens merged!" },
  });

  if (!result.status) {
    throw result.error;
  }

  return result.receipt;
}

const useMergePositions7702 = (
  approvalsConfig: UseMissingApprovalsProps,
  onSuccess: (data: TransactionReceipt) => unknown,
) => {
  const approvals = {
    data: [],
    isLoading: false,
  };

  return {
    approvals,
    mergePositions: useMutation({
      mutationFn: (props: MergePositionProps) => mergePositions7702(approvalsConfig, props),
      onSuccess: (data: TransactionReceipt) => {
        queryClient.invalidateQueries({ queryKey: ["useMarketPositions"] });
        queryClient.invalidateQueries({ queryKey: ["useTokenBalances"] });
        queryClient.invalidateQueries({ queryKey: ["useTokenBalance"] });
        queryClient.invalidateQueries({ queryKey: ["useMissingApprovals"] });

        onSuccess(data);
      },
    }),
  };
};

export const useMergePositions = (
  approvalsConfig: UseMissingApprovalsProps,
  onSuccess: (data: TransactionReceipt) => unknown,
) => {
  const supports7702 = useCheck7702Support();
  const merge7702 = useMergePositions7702(approvalsConfig, onSuccess);
  const mergeLegacy = useMergePositionsLegacy(approvalsConfig, onSuccess);

  return supports7702 ? merge7702 : mergeLegacy;
};
