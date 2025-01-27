import { config as wagmiConfig } from "@/wagmi";
import { ConnectorNotConnectedError, getTransactionReceipt, waitForTransactionReceipt } from "@wagmi/core";
import { Theme, ToastOptions, ToastPosition, toast } from "react-toastify";
import {
  TransactionNotFoundError,
  TransactionReceipt,
  TransactionReceiptNotFoundError,
  WaitForTransactionReceiptTimeoutError,
} from "viem";
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

type ToastifyTxFn = (contractWrite: () => Promise<`0x${string}`>, config?: ToastifyConfig) => Promise<ToastifyTxReturn>;

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
    hash = await contractWrite();
    toastInfo({ title: config?.txSent?.title || "Sending transaction...", subtitle: config?.txSent?.subtitle });
    const receipt = await waitForTransactionReceipt(wagmiConfig, {
      hash,
      confirmations: Number(SEER_ENV.VITE_TX_CONFIRMATIONS) || 0,
      timeout: 20000, //20 seconds timeout, then we poll manually
    });
    toastSuccess({ title: config?.txSuccess?.title || "Transaction sent!", subtitle: config?.txSent?.subtitle });

    return { status: true, receipt: receipt };
    // biome-ignore lint/suspicious/noExplicitAny:
  } catch (error: any) {
    // timeout so we poll manually
    if (
      hash &&
      error instanceof
        (WaitForTransactionReceiptTimeoutError || TransactionNotFoundError || TransactionReceiptNotFoundError)
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

async function pollForTransactionReceipt(hash: `0x${string}`, maxAttempts = 7, initialInterval = 500) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const txReceipt = await getTransactionReceipt(wagmiConfig, { hash });
      if (txReceipt?.blockNumber) {
        return txReceipt;
      }
    } catch (e) {}
    const backoffTime = initialInterval * 2 ** i;
    const jitter = Math.round(Math.random() * 1000); // Add some randomness to prevent synchronized retries
    await new Promise((resolve) => setTimeout(resolve, backoffTime + jitter));
  }
}

// biome-ignore lint/suspicious/noExplicitAny:
function getErrorMessage(error: any): string {
  if (error instanceof ConnectorNotConnectedError) {
    return "Please connect your wallet.";
  }

  return error.shortMessage ?? error.message;
}
