import type { CreateMarketProps } from "@seer-pm/sdk";
import { type TxNotifierFn, getCreateMarketExecution, getCreateProposalExecution } from "@seer-pm/sdk";
import { useMutation } from "@tanstack/react-query";
import { sendTransaction } from "@wagmi/core";
import type { TransactionReceipt } from "viem";
import { useConfig } from "wagmi";

export interface UseCreateMarketOptions {
  /** Transaction notifier (e.g. toast) for sent/success/error. */
  txNotifier: TxNotifierFn;
  /** If true, create a futarchy proposal; otherwise create a regular market. */
  isFutarchyMarket: boolean;
  /** Called with the transaction receipt on success. */
  onSuccess?: (data: TransactionReceipt) => void;
}

async function createMarket(
  props: CreateMarketProps,
  txNotifier: TxNotifierFn,
  config: Parameters<typeof sendTransaction>[0],
): Promise<TransactionReceipt> {
  const execution = getCreateMarketExecution(props);
  const result = await txNotifier(() => sendTransaction(config, execution), {
    txSent: { title: "Creating market..." },
    txSuccess: { title: "Market created!" },
  });
  if (!result.status) throw result.error;
  return result.receipt;
}

async function createProposal(
  props: CreateMarketProps,
  txNotifier: TxNotifierFn,
  config: Parameters<typeof sendTransaction>[0],
): Promise<TransactionReceipt> {
  const execution = getCreateProposalExecution(props);
  const result = await txNotifier(() => sendTransaction(config, execution), {
    txSent: { title: "Creating proposal..." },
    txSuccess: { title: "Proposal created!" },
  });
  if (!result.status) throw result.error;
  return result.receipt;
}

/**
 * Mutation hook to create a Seer market or futarchy proposal.
 * Pass full CreateMarketProps to the mutation.
 */
export function useCreateMarket({ txNotifier, isFutarchyMarket, onSuccess }: UseCreateMarketOptions) {
  const config = useConfig();
  return useMutation({
    mutationFn: (props: CreateMarketProps) =>
      isFutarchyMarket ? createProposal(props, txNotifier, config) : createMarket(props, txNotifier, config),
    onSuccess,
  });
}
