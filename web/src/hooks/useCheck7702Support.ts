import { Address, Hex } from "viem";
import { gnosis } from "viem/chains";
import { useAccount, useCapabilities } from "wagmi";

export type Execution = {
  to: Address;
  value: bigint;
  data: Hex;
};

export function useCheck7702Support(): boolean {
  const { chainId } = useAccount();
  const { data: capabilities } = useCapabilities();

  if (!chainId || !capabilities) {
    return false;
  }

  if (chainId === gnosis.id) {
    // metamask doesn't work on gnosis
    return false;
  }

  return capabilities[chainId]?.atomic?.status === "ready" || capabilities[chainId]?.atomic?.status === "supported";
}
