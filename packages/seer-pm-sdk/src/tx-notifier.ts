import type { Config, SendCallsReturnType } from "@wagmi/core";
import type { TransactionReceipt } from "viem";
import type { SupportedChain } from "./chains";
import type { Execution } from "./execution";

export type TxNotificationMessage = {
  title: string;
  subtitle?: string;
};

/**
 * Generic, UI-agnostic configuration for transaction lifecycle messages.
 * Concrete UIs (e.g. React Toastify) can extend this type with extra fields.
 */
export type TxNotificationConfig = {
  txSent?: TxNotificationMessage;
  txSuccess?: TxNotificationMessage;
  txError?: TxNotificationMessage;
};

export type TxNotificationResult =
  | {
      status: true;
      receipt: TransactionReceipt;
    }
  | {
      status: false;
      error: Error;
    };

/**
 * Single-transaction notifier (hash or batched calls handle) with lifecycle messages.
 * Implementations are responsible for sending the transaction and waiting for the receipt.
 */
export type TxNotifierFn = (
  contractWrite: () => Promise<`0x${string}` | SendCallsReturnType>,
  config?: TxNotificationConfig,
) => Promise<TxNotificationResult>;

/**
 * Helper type for notifiers that work directly on a list of encoded calls,
 * a chain id and a wagmi config (e.g. 7702 batched executions).
 */
export type TxBatchNotifierFn = (
  calls: Execution[],
  chainId: SupportedChain,
  wagmiConfig: Config,
  config?: TxNotificationConfig,
) => Promise<TxNotificationResult>;
