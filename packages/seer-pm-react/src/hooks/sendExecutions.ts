import type { Execution, TxNotifierFn } from "@seer-pm/sdk";
import type { Config } from "@wagmi/core";
import { sendCalls, sendTransaction } from "@wagmi/core";
import type { Hex } from "viem";

/**
 * Sends a list of executions: one `sendCalls` batch when the wallet supports EIP-7702,
 * otherwise sequential transactions with progress toasts.
 */
export async function sendExecutions(
  config: Config,
  calls: Execution[],
  chainId: number,
  supports7702: boolean,
  txNotifier: TxNotifierFn,
  messages: { txSent: string; txSuccess: string },
): Promise<Hex> {
  if (calls.length === 0) {
    throw new Error("Nothing to send");
  }

  if (supports7702 && calls.length > 1) {
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

  let lastHash: Hex | undefined;
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

  return lastHash as Hex;
}
