import { base, optimism } from "viem/chains";

/**
 * Returns true if the chain is an OP Stack chain (Optimism or Base).
 */
export function isOpStack(chainId: number): boolean {
  return chainId === optimism.id || chainId === base.id;
}
