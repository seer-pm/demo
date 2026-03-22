import { useAccount, useCapabilities } from "wagmi";

export function useCheck7702Support(useSmartAccount: boolean): boolean {
  const { chainId } = useAccount();
  const { data: capabilities } = useCapabilities();

  if (!chainId || !capabilities || !useSmartAccount) {
    return false;
  }

  const status = capabilities[chainId]?.atomic?.status;

  return status === "ready" || status === "supported";
}
