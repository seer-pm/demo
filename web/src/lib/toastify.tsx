import { Execution } from "@/hooks/useCheck7702Support";
import { config as wagmiConfig } from "@/wagmi";
import {
  Config,
  ConnectorNotConnectedError,
  SendCallsReturnType,
  getTransactionReceipt,
  sendCalls,
  waitForCallsStatus,
  waitForTransactionReceipt,
} from "@wagmi/core";
import { Theme, ToastOptions, ToastPosition, toast } from "react-toastify";
import {
  TransactionNotFoundError,
  TransactionReceipt,
  TransactionReceiptNotFoundError,
  WaitForTransactionReceiptTimeoutError,
} from "viem";
import { SupportedChain } from "./chains";
import SEER_ENV from "./env";
import { CheckCircleIcon, CloseCircleIcon, LoadingIcon } from "./icons";

export const DEFAULT_TOAST_OPTIONS = {
  position: "top-center" as ToastPosition,
  autoClose: 5000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
  theme: "light" as Theme,
};

type ToastifyReturn<T> =
  | {
      status: true;
      data: T;
    }
  | {
      status: false;
      error: Error;
    };

type ToastifyTxReturn =
  | {
      status: true;
      receipt: TransactionReceipt;
    }
  | {
      status: false;
      error: Error;
    };

type ToastifyConfig = {
  txSent?: {
    title: string;
    subtitle?: string;
  };
  txSuccess?: {
    title: string;
    subtitle?: string;
  };
  txError?: {
    title: string;
    subtitle?: string;
  };
  options?: ToastOptions;
};

type ToastifyFn<T> = (execute: () => Promise<T>, config?: ToastifyConfig) => Promise<ToastifyReturn<T>>;

type ToastifyTxFn = (
  contractWrite: () => Promise<`0x${string}` | SendCallsReturnType>,
  config?: ToastifyConfig,
) => Promise<ToastifyTxReturn>;

type ToastifySendCalls = (
  calls: Execution[],
  chainId: SupportedChain,
  wagmiConfig: Config,
  config?: ToastifyConfig,
) => Promise<ToastifyTxReturn>;

interface ToastContentType {
  title: string;
  subtitle?: string;
  options?: ToastOptions;
}

function toastContent(title: string, subtitle: string) {
  return (
    <>
      <div className="text-[16px] font-semibold">{title}</div>
      {subtitle && <div className="text-[14px] font-normal">{subtitle}</div>}
    </>
  );
}

export function toastInfo({ title, subtitle = "", options }: ToastContentType) {
  toast.info(toastContent(title, subtitle), { ...{ ...DEFAULT_TOAST_OPTIONS, ...options }, icon: <LoadingIcon /> });
}

export function toastSuccess({ title, subtitle = "", options }: ToastContentType) {
  toast.success(toastContent(title, subtitle), {
    ...{ ...DEFAULT_TOAST_OPTIONS, ...options },
    icon: <CheckCircleIcon width={32} height={32} />,
  });
}

export function toastError({ title, subtitle = "", options }: ToastContentType) {
  toast.error(toastContent(title, subtitle), {
    ...{ ...DEFAULT_TOAST_OPTIONS, ...options },
    icon: <CloseCircleIcon />,
  });
}

// biome-ignore lint/suspicious/noExplicitAny:
export const toastify: ToastifyFn<any> = async (execute, config) => {
  toastInfo({ title: config?.txSent?.title || "Sending transaction...", subtitle: config?.txSent?.subtitle });

  try {
    const result = await execute();

    toastSuccess({ title: config?.txSuccess?.title || "Transaction sent!", subtitle: config?.txSent?.subtitle });

    return { status: true, data: result };
    // biome-ignore lint/suspicious/noExplicitAny:
  } catch (error: any) {
    toastError({ title: error.reason ?? error.shortMessage ?? error.body?.description ?? error.message });

    return { status: false, error };
  }
};

export const toastifyTx: ToastifyTxFn = async (contractWrite, config) => {
  let hash: `0x${string}` | undefined = undefined;
  try {
    const result = await contractWrite();

    toastInfo({ title: config?.txSent?.title || "Sending transaction...", subtitle: config?.txSent?.subtitle });

    let receipt: TransactionReceipt;
    if (typeof result === "string") {
      hash = result;

      receipt = await waitForTransactionReceipt(wagmiConfig, {
        hash,
        confirmations: Number(SEER_ENV.VITE_TX_CONFIRMATIONS) || 0,
        timeout: 20000, //20 seconds timeout, then we poll manually
      });
    } else {
      const { receipts = [] } = await waitForCallsStatus(wagmiConfig, {
        id: result.id,
      });

      if (!receipts.length || !receipts[0].transactionHash) {
        throw new Error("No transaction hash found in call results");
      }

      hash = receipts[0].transactionHash;

      receipt = await waitForTransactionReceipt(wagmiConfig, {
        hash,
        confirmations: Number(SEER_ENV.VITE_TX_CONFIRMATIONS) || 0,
        timeout: 20000, //20 seconds timeout, then we poll manually
      });
    }

    toastSuccess({ title: config?.txSuccess?.title || "Transaction sent!", subtitle: config?.txSent?.subtitle });

    return { status: true, receipt: receipt };
    // biome-ignore lint/suspicious/noExplicitAny:
  } catch (error: any) {
    // timeout so we poll manually
    if (
      hash &&
      (error instanceof WaitForTransactionReceiptTimeoutError ||
        error instanceof TransactionNotFoundError ||
        error instanceof TransactionReceiptNotFoundError)
    ) {
      const newReceipt = await pollForTransactionReceipt(hash);
      if (newReceipt) {
        toastSuccess({ title: config?.txSuccess?.title || "Transaction sent!", subtitle: config?.txSent?.subtitle });
        return { status: true, receipt: newReceipt };
      }
    }
    toastError({ title: getErrorMessage(error), subtitle: config?.txSent?.subtitle });

    return { status: false, error };
  }
};

export const toastifySendCallsTx: ToastifySendCalls = async (calls, chainId, wagmiConfig, config) => {
  const BATCH_SIZE = 10;
  const batches = [];

  // Split calls into batches of 10
  for (let i = 0; i < calls.length; i += BATCH_SIZE) {
    batches.push(calls.slice(i, i + BATCH_SIZE));
  }

  const isSingleBatch = batches.length === 1;

  // Show initial info about batching
  if (!isSingleBatch) {
    toastInfo({
      title: "Processing multiple batches",
      subtitle: `Due to wallet limitations, ${calls.length} calls will be processed in ${batches.length} batches of up to ${BATCH_SIZE} calls each.`,
      options: { autoClose: 8000 },
    });
  }

  let lastReceipt: TransactionReceipt | undefined;

  // Process each batch sequentially
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    const isLastBatch = i === batches.length - 1;

    const result = await toastifyTx(
      () => sendCalls(wagmiConfig, { calls: batch, chainId }),
      isSingleBatch
        ? config
        : {
            txSent: {
              title: config?.txSent?.title || `Sending batch ${i + 1}/${batches.length}...`,
              subtitle: config?.txSent?.subtitle,
            },
            txSuccess: {
              title: isLastBatch
                ? config?.txSuccess?.title || "All transactions sent!"
                : `Batch ${i + 1}/${batches.length} sent!`,
              subtitle: config?.txSuccess?.subtitle,
            },
            txError: {
              title: config?.txError?.title || `Failed to send batch ${i + 1}/${batches.length}`,
              subtitle: config?.txError?.subtitle,
            },
            options: config?.options,
          },
    );

    // If any batch fails, abort the entire process and return the error
    if (!result.status) {
      return result;
    }

    lastReceipt = result.receipt;
  }

  return { status: true, receipt: lastReceipt! };
};

async function pollForTransactionReceipt(hash: `0x${string}`, maxAttempts = 7, initialInterval = 500) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const txReceipt = await getTransactionReceipt(wagmiConfig, { hash });
      if (txReceipt?.blockNumber) {
        return txReceipt;
      }
    } catch (e) {
      console.warn(`Failed to get transaction receipt for ${hash}, attempt ${i + 1}:`, e);
    }
    const backoffTime = initialInterval * 2 ** i;
    const jitter = Math.round(Math.random() * 1000); // Add some randomness to prevent synchronized retries
    await new Promise((resolve) => setTimeout(resolve, backoffTime + jitter));
  }

  return null;
}

// biome-ignore lint/suspicious/noExplicitAny:
function getErrorMessage(error: any): string {
  if (error instanceof ConnectorNotConnectedError) {
    return "Please connect your wallet.";
  }

  return error.shortMessage ?? error.message;
}
