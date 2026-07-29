import {
  type CancelLimitOrderParams,
  type WithdrawLimitOrderParams,
  buildCancelLimitOrderCalls,
  buildWithdrawLimitOrderCalls,
} from "@seer-pm/order-book/v4";
import type { Execution, TxNotifierFn } from "@seer-pm/sdk";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Config } from "@wagmi/core";
import { sendCalls, sendTransaction } from "@wagmi/core";
import { useConfig } from "wagmi";

async function sendExecutions(
  config: Config,
  calls: Execution[],
  chainId: number,
  supports7702: boolean,
  txNotifier: TxNotifierFn,
  messages: { txSent: string; txSuccess: string },
) {
  if (calls.length === 0) {
    throw new Error("No orders to process");
  }

  if (supports7702) {
    const result = await txNotifier(
      () =>
        sendCalls(config, {
          calls,
          chainId,
        }),
      {
        txSent: { title: messages.txSent },
        txSuccess: { title: messages.txSuccess },
      },
    );
    if (!result.status) {
      throw result.error;
    }
    return result.receipt.transactionHash;
  }

  let lastHash: `0x${string}` | undefined;
  for (let i = 0; i < calls.length; i++) {
    const isLast = i === calls.length - 1;
    const result = await txNotifier(() => sendTransaction(config, calls[i]), {
      txSent: {
        title: calls.length === 1 ? messages.txSent : `Sending ${i + 1}/${calls.length}...`,
      },
      txSuccess: {
        title: isLast ? messages.txSuccess : `Transaction ${i + 1}/${calls.length} sent.`,
      },
    });
    if (!result.status) {
      throw result.error;
    }
    lastHash = result.receipt.transactionHash;
  }

  return lastHash!;
}

export function useCancelV4LimitOrders(txNotifier: TxNotifierFn, supports7702: boolean) {
  const config = useConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orders: CancelLimitOrderParams[]) => {
      const calls = buildCancelLimitOrderCalls(orders);
      const chainId = orders[0]?.chainId;
      if (chainId == null) {
        throw new Error("No orders to cancel");
      }
      return sendExecutions(config, calls, chainId, supports7702, txNotifier, {
        txSent: orders.length === 1 ? "Cancelling order..." : "Cancelling orders...",
        txSuccess: orders.length === 1 ? "Order cancelled." : "Orders cancelled.",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["limitOrderHookUserOrders"] });
    },
  });
}

export function useWithdrawV4LimitOrders(txNotifier: TxNotifierFn, supports7702: boolean) {
  const config = useConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orders: WithdrawLimitOrderParams[]) => {
      const calls = buildWithdrawLimitOrderCalls(orders);
      const chainId = orders[0]?.chainId;
      if (chainId == null) {
        throw new Error("No orders to withdraw");
      }
      return sendExecutions(config, calls, chainId, supports7702, txNotifier, {
        txSent: orders.length === 1 ? "Withdrawing..." : "Withdrawing orders...",
        txSuccess: orders.length === 1 ? "Withdraw completed." : "Withdraws completed.",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["limitOrderHookUserOrders"] });
      queryClient.invalidateQueries({ queryKey: ["limitOrderWithdrawAmounts"] });
      queryClient.invalidateQueries({ queryKey: ["useTokenBalance"] });
    },
  });
}
