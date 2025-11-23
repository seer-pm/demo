import { Address, Hex } from "viem";
import { useAccount, useCapabilities } from "wagmi";
import { useGlobalState } from "./useGlobalState";

export type Execution = {
  to: Address;
  value: bigint;
  data: Hex;
  chainId: number;
};

export function useCheck7702Support(): boolean {
  const { chainId } = useAccount();
  const { data: capabilities } = useCapabilities();
  const useSmartAccount = useGlobalState((state) => state.useSmartAccount);

  if (!chainId || !capabilities || !useSmartAccount) {
    return false;
  }

  return capabilities[chainId]?.atomic?.status === "ready" || capabilities[chainId]?.atomic?.status === "supported";
}
