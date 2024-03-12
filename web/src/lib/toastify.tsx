import { config as wagmiConfig } from "@/wagmi";
import { waitForTransactionReceipt } from "@wagmi/core";
import { Theme, ToastOptions, ToastPosition, toast } from "react-toastify";
import { TransactionReceipt } from "viem";
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

type ToastifyFn<T> = (execute: () => Promise<T>, config?: ToastifyConfig) => Promise<T>;

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

    return result;
    // biome-ignore lint/suspicious/noExplicitAny:
  } catch (error: any) {
    toastError({ title: error.shortMessage ?? error.message });
  }
};

export const toastifyTx: ToastifyTxFn = async (contractWrite, config) => {
  try {
    const hash = await contractWrite();

    toastInfo({ title: config?.txSent?.title || "Sending transaction...", subtitle: config?.txSent?.subtitle });

    const receipt = await waitForTransactionReceipt(wagmiConfig, {
      hash,
      confirmations: 2,
    });

    toastSuccess({ title: config?.txSuccess?.title || "Transaction sent!", subtitle: config?.txSent?.subtitle });

    return { status: true, receipt: receipt };
    // biome-ignore lint/suspicious/noExplicitAny:
  } catch (error: any) {
    toastError({ title: error.shortMessage ?? error.message, subtitle: config?.txSent?.subtitle });

    return { status: false, error };
  }
};
