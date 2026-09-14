import {
  type CancelLimitOrderParams,
  type WithdrawLimitOrderParams,
  buildCancelLimitOrderCalls,
  buildWithdrawLimitOrderCalls,
} from "@seer-pm/order-book/v4";
import type { TxNotifierFn } from "@seer-pm/sdk";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useConfig } from "wagmi";
import { sendExecutions } from "./sendExecutions";

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
      // The liquidity chart drew the cancelled orders as pool liquidity.
      queryClient.invalidateQueries({ queryKey: ["useTicksData"] });
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
