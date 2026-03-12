import type { NotifierFn, TxBatchNotifierFn, TxNotificationConfig, TxNotifierFn } from "@seer-pm/sdk";
import {
  ConnectorNotConnectedError,
  getTransactionReceipt,
  sendCalls,
  waitForCallsStatus,
  waitForTransactionReceipt,
} from "@wagmi/core";
import type { Config } from "@wagmi/core";
import { Theme, type ToastOptions, type ToastPosition, toast } from "react-toastify";
import {
  TransactionNotFoundError,
  type TransactionReceipt,
  TransactionReceiptNotFoundError,
  WaitForTransactionReceiptTimeoutError,
} from "viem";

/**
 * Example toastify integration for Seer sites.
 *
 * To enable it in a Stitch-generated app you need to:
 *
 * 1. Install react-toastify:
 *    - npm: `npm install react-toastify`
 *    - yarn: `yarn add react-toastify`
 *
 * 2. Import the CSS once in your app entry:
 *    - `import "react-toastify/dist/ReactToastify.css";`
 *
 * 3. Render a `<ToastContainer />` near the root of your React tree.
 *
 * 4. Wire `toastify` and `toastifyTx` into the Seer SDK hooks that
 *    expect a `NotifierFn` / `TxNotifierFn` (e.g. `useTrade`, `useApproveTokens`).
 */

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

type ToastifyConfig = TxNotificationConfig & {
  options?: ToastOptions;
};

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
  toast.info(toastContent(title, subtitle), { ...{ ...DEFAULT_TOAST_OPTIONS, ...options } });
}

export function toastSuccess({ title, subtitle = "", options }: ToastContentType) {
  toast.success(toastContent(title, subtitle), {
    ...{ ...DEFAULT_TOAST_OPTIONS, ...options },
  });
}

export function toastError({ title, subtitle = "", options }: ToastContentType) {
  toast.error(toastContent(title, subtitle), {
    ...{ ...DEFAULT_TOAST_OPTIONS, ...options },
  });
}

export const toastify: NotifierFn = async (execute, config) => {
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

export const toastifyTx: TxNotifierFn = async (contractWrite, config) => {
  const toastConfig = config as ToastifyConfig | undefined;
  let hash: `0x${string}` | undefined = undefined;

  const wagmiConfig = (toastConfig?.options?.wagmiConfig as Config | undefined)!;

  try {
    const result = await contractWrite();

    toastInfo({
      title: toastConfig?.txSent?.title || "Sending transaction...",
      subtitle: toastConfig?.txSent?.subtitle,
      options: toastConfig?.options,
    });

    let receipt: TransactionReceipt;
    if (typeof result === "string") {
      hash = result;

      receipt = await waitForTransactionReceipt(wagmiConfig, {
        hash,
        confirmations: Number(toastConfig?.options?.txConfirmations ?? 0),
        timeout: 20000,
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
        confirmations: Number(toastConfig?.options?.txConfirmations ?? 0),
        timeout: 20000,
      });
    }

    toastSuccess({
      title: toastConfig?.txSuccess?.title || "Transaction sent!",
      subtitle: toastConfig?.txSent?.subtitle,
      options: toastConfig?.options,
    });

    return { status: true, receipt: receipt };
    // biome-ignore lint/suspicious/noExplicitAny:
  } catch (error: any) {
    if (
      hash &&
      (error instanceof WaitForTransactionReceiptTimeoutError ||
        error instanceof TransactionNotFoundError ||
        error instanceof TransactionReceiptNotFoundError)
    ) {
      const newReceipt = await pollForTransactionReceipt(wagmiConfig, hash);
      if (newReceipt) {
        toastSuccess({
          title: toastConfig?.txSuccess?.title || "Transaction sent!",
          subtitle: toastConfig?.txSent?.subtitle,
          options: toastConfig?.options,
        });
        return { status: true, receipt: newReceipt };
      }
    }
    toastError({
      title: getErrorMessage(error),
      subtitle: toastConfig?.txSent?.subtitle,
      options: toastConfig?.options,
    });

    return { status: false, error };
  }
};

export const toastifySendCallsTx: TxBatchNotifierFn = async (calls, chainId, wagmiConfig, config) => {
  const baseConfig = config as ToastifyConfig | undefined;
  const BATCH_SIZE = 10;
  const batches = [];

  for (let i = 0; i < calls.length; i += BATCH_SIZE) {
    batches.push(calls.slice(i, i + BATCH_SIZE));
  }

  const isSingleBatch = batches.length === 1;

  if (!isSingleBatch) {
    toastInfo({
      title: "Processing multiple batches",
      subtitle: `Due to wallet limitations, ${calls.length} calls will be processed in ${batches.length} batches of up to ${BATCH_SIZE} calls each.`,
      options: { autoClose: 8000 },
    });
  }

  let lastReceipt: TransactionReceipt | undefined;

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    const isLastBatch = i === batches.length - 1;

    const mergedConfig: ToastifyConfig | undefined = isSingleBatch
      ? baseConfig
      : {
          txSent: {
            title: baseConfig?.txSent?.title || `Sending batch ${i + 1}/${batches.length}...`,
            subtitle: baseConfig?.txSent?.subtitle,
          },
          txSuccess: {
            title: isLastBatch
              ? baseConfig?.txSuccess?.title || "All transactions sent!"
              : `Batch ${i + 1}/${batches.length} sent!`,
            subtitle: baseConfig?.txSuccess?.subtitle,
          },
          txError: {
            title: baseConfig?.txError?.title || `Failed to send batch ${i + 1}/${batches.length}`,
            subtitle: baseConfig?.txError?.subtitle,
          },
          options: baseConfig?.options,
        };

    const result = await toastifyTx(() => sendCalls(wagmiConfig, { calls: batch, chainId }), mergedConfig);

    if (!result.status) {
      return result;
    }

    lastReceipt = result.receipt;
  }

  return { status: true, receipt: lastReceipt! };
};

async function pollForTransactionReceipt(wagmiConfig: Config, hash: `0x${string}`, maxAttempts = 7, initialInterval = 500) {
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
    const jitter = Math.round(Math.random() * 1000);
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
