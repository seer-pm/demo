import type { Address } from "viem";
import { base, gnosis, mainnet, optimism } from "viem/chains";

/** Block explorer base URL per chain (e.g. https://gnosisscan.io). */
const BLOCK_EXPLORER_URLS: Partial<Record<number, string>> = {
  [gnosis.id]: "https://gnosisscan.io",
  [mainnet.id]: "https://etherscan.io",
  [optimism.id]: "https://optimistic.etherscan.io",
  [base.id]: "https://basescan.org",
};

/** Pool explorer / info page URL per chain. */
const POOL_URL_BY_CHAIN: Partial<Record<number, (poolId: string) => string>> = {
  [gnosis.id]: (poolId) => `https://v3.swapr.eth.limo/#/info/pools/${poolId}`,
  [mainnet.id]: (poolId) => `https://bunni.pro/pools/ethereum/${poolId}`,
  [optimism.id]: (poolId) => `https://app.uniswap.org/explore/pools/optimism/${poolId}`,
  [base.id]: (poolId) => `https://app.uniswap.org/explore/pools/base/${poolId}`,
};

/**
 * Block explorer base URL for the given chain.
 * Returns "#" if the chain is not configured.
 */
export function getBlockExplorerUrl(chainId: number): string {
  return BLOCK_EXPLORER_URLS[chainId] ?? "#";
}

/**
 * URL to view a token contract on the block explorer.
 */
export function getTokenExplorerUrl(chainId: number, tokenAddress: Address): string {
  const baseUrl = getBlockExplorerUrl(chainId);
  return baseUrl === "#" ? "#" : `${baseUrl}/token/${tokenAddress}`;
}
/**
 * URL to the pool info/explorer page for the given pool id.
 * Returns "#" if the chain is not configured.
 */
export function getPoolExplorerUrl(chainId: number, poolId: Address | string): string {
  const fn = POOL_URL_BY_CHAIN[chainId];
  return fn ? fn(String(poolId)) : "#";
}
