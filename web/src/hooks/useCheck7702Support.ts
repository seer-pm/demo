import { Address, Hex } from "viem";

export type Execution = {
  to: Address;
  value: bigint;
  data: Hex;
};

export function useCheck7702Support(): boolean {
  return false;
  // const { chainId } = useAccount();
  // const { data: capabilities } = useCapabilities();

  // if (!chainId || !capabilities) {
  //   return false;
  // }

  // return capabilities[chainId].atomic?.status === "ready" || capabilities[chainId].atomic?.status === "supported";
}
