/**
 * Shared viem PublicClient factory with optional per-chain RPC URL configuration.
 */

import type { PublicClient } from "viem";
import { http, createPublicClient } from "viem";
import { base, gnosis, mainnet, optimism } from "viem/chains";
import { ChainId, configureRpcProviders } from "./swapr";

const CHAIN_BY_ID = {
  [gnosis.id]: gnosis,
  [mainnet.id]: mainnet,
  [optimism.id]: optimism,
  [base.id]: base,
} as const;

let rpcUrlsByChainId: Partial<Record<number, string>> = {};
const publicClientsByChainId = new Map<number, PublicClient>();

/**
 * Set public RPC URLs for SDK PublicClients and Swapr providers.
 * Replaces any prior configuration; omitted chains fall back to defaults.
 */
export function configurePublicRpcUrls(urls: Partial<Record<number, string>>): void {
  rpcUrlsByChainId = { ...urls };
  publicClientsByChainId.clear();
  configureRpcProviders(urls as Partial<Record<ChainId, string>>);
}

export function isPublicClientChainSupported(chainId: number): boolean {
  return chainId in CHAIN_BY_ID;
}

export function getPublicClientForChain(chainId: number): PublicClient {
  const cached = publicClientsByChainId.get(chainId);
  if (cached) {
    return cached;
  }

  const chain = CHAIN_BY_ID[chainId as keyof typeof CHAIN_BY_ID];
  if (!chain) {
    throw new Error(`Unsupported chain for public client: ${chainId}`);
  }

  const rpcUrl = rpcUrlsByChainId[chainId];
  const client = createPublicClient({
    chain,
    transport: rpcUrl ? http(rpcUrl) : http(),
  }) as PublicClient;
  publicClientsByChainId.set(chainId, client);
  return client;
}
