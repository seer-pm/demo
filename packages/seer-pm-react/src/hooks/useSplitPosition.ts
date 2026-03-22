import type { Market } from "@seer-pm/sdk";
import { type Execution, type TxNotifierFn, getApprovals7702, getSplitExecution } from "@seer-pm/sdk";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Config } from "@wagmi/core";
import { sendCalls, sendTransaction } from "@wagmi/core";
import type { Address } from "viem";
import type { TransactionReceipt } from "viem";
import { useConfig } from "wagmi";
import type { UseMissingApprovalsProps } from "./useMissingApprovals";
import { useMissingApprovals } from "./useMissingApprovals";

export interface SplitPositionProps {
  router: Address;
  market: Market;
  collateralToken: Address | undefined;
  outcomeSlotCount: number;
  amount: bigint;
}

async function splitPosition(
  props: SplitPositionProps,
  txNotifier: TxNotifierFn,
  config: Config,
): Promise<TransactionReceipt> {
  const result = await txNotifier(
    () =>
      sendTransaction(
        config,
        getSplitExecution({
          router: props.router,
          market: props.market,
          collateralToken: props.collateralToken,
          amount: props.amount,
        }),
      ),
    { txSent: { title: "Minting tokens..." }, txSuccess: { title: "Tokens minted!" } },
  );

  if (!result.status) {
    throw result.error;
  }

  return result.receipt;
}

export function useSplitPositionLegacy(
  approvalsConfig: UseMissingApprovalsProps,
  onSuccess: (data: TransactionReceipt) => unknown,
  txNotifier: TxNotifierFn,
) {
  const config = useConfig();
  const queryClient = useQueryClient();
  const approvals = useMissingApprovals(approvalsConfig);

  return {
    approvals,
    splitPosition: useMutation({
      mutationFn: (props: SplitPositionProps) => splitPosition(props, txNotifier, config),
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

async function splitPosition7702(
  approvalsConfig: UseMissingApprovalsProps,
  props: SplitPositionProps,
  txNotifier: TxNotifierFn,
  config: Config,
): Promise<TransactionReceipt> {
  const calls: Execution[] = getApprovals7702(approvalsConfig);

  calls.push(
    getSplitExecution({
      router: props.router,
      market: props.market,
      collateralToken: props.collateralToken,
      amount: props.amount,
    }),
  );

  const result = await txNotifier(
    () =>
      sendCalls(config, {
        calls,
        chainId: props.market.chainId,
      }),
    {
      txSent: { title: "Minting tokens..." },
      txSuccess: { title: "Tokens minted!" },
    },
  );

  if (!result.status) {
    throw result.error;
  }

  return result.receipt;
}

function useSplitPosition7702(
  approvalsConfig: UseMissingApprovalsProps,
  onSuccess: (data: TransactionReceipt) => unknown,
  txNotifier: TxNotifierFn,
) {
  const config = useConfig();
  const queryClient = useQueryClient();
  const approvals = {
    data: [],
    isLoading: false,
  };

  return {
    approvals,
    splitPosition: useMutation({
      mutationFn: (props: SplitPositionProps) => splitPosition7702(approvalsConfig, props, txNotifier, config),
      onSuccess: (data: TransactionReceipt) => {
        queryClient.invalidateQueries({ queryKey: ["useMarketPositions"] });
        queryClient.invalidateQueries({ queryKey: ["useTokenBalances"] });
        queryClient.invalidateQueries({ queryKey: ["useTokenBalance"] });
        onSuccess(data);
      },
    }),
  };
}

export function useSplitPosition(
  approvalsConfig: UseMissingApprovalsProps,
  onSuccess: (data: TransactionReceipt) => unknown,
  supports7702: boolean,
  txNotifier: TxNotifierFn,
) {
  const split7702 = useSplitPosition7702(approvalsConfig, onSuccess, txNotifier);
  const splitLegacy = useSplitPositionLegacy(approvalsConfig, onSuccess, txNotifier);

  return supports7702 ? split7702 : splitLegacy;
}
