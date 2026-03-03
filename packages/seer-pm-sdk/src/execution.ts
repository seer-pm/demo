import type { Address, Hex } from "viem";

/**
 * Encoded transaction ready to be sent (e.g. for 7702 batch or direct send).
 *
 * TChainId defaults to number, but callers can specialize it
 * (e.g. to a SupportedChain union) to get stricter typing.
 */
export type Execution<TChainId extends number = number> = {
  to: Address;
  value: bigint;
  data: Hex;
  chainId: TChainId;
};
