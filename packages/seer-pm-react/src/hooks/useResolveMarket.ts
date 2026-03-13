import type { Market } from "@seer-pm/sdk";
import { type TxNotifierFn, getResolveMarketExecution } from "@seer-pm/sdk";
import { useMutation } from "@tanstack/react-query";
import { sendTransaction } from "@wagmi/core";
import type { TransactionReceipt } from "viem";
import { useConfig } from "wagmi";

export interface ResolveMarketProps {
  market: Market;
}

export interface UseResolveMarketOptions {
  /** Transaction notifier (e.g. toast) for sent/success/error. */
  txNotifier: TxNotifierFn;
  /** Called with the transaction receipt on success. */
  onSuccess?: (data: TransactionReceipt) => void;
}

async function resolveMarket(
  props: ResolveMarketProps,
  txNotifier: TxNotifierFn,
  config: Parameters<typeof sendTransaction>[0],
): Promise<TransactionReceipt> {
  const execution = getResolveMarketExecution(props.market.id, props.market.chainId);
  const result = await txNotifier(() => sendTransaction(config, execution), {
    txSent: { title: "Resolving market..." },
    txSuccess: { title: "Market resolved!" },
  });
  if (!result.status) throw result.error;
  return result.receipt;
}

/**
 * Mutation hook to resolve a Seer market (call resolve on the Market contract).
 */
export function useResolveMarket({ txNotifier, onSuccess }: UseResolveMarketOptions) {
  const config = useConfig();
  return useMutation({
    mutationFn: (props: ResolveMarketProps) => resolveMarket(props, txNotifier, config),
    onSuccess,
  });
}
