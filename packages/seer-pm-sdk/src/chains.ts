import { base, optimism } from "viem/chains";
import { marketFactoryAddress } from "../generated/contracts/market-factory";

/** Chain IDs for which the protocol has a market factory (and thus markets). */
export type SupportedChain = keyof typeof marketFactoryAddress;

/** Partial map from supported chain ID to a value (e.g. wagmi Chain). */
export type SupportedChains<T = unknown> = Partial<Record<SupportedChain, T>>;

/**
 * Returns true if the chain is an OP Stack chain (Optimism or Base).
 */
export function isOpStack(chainId: number): boolean {
  return chainId === optimism.id || chainId === base.id;
}
