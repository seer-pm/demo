import {
  BASE_RPC as FALLBACK_BASE_RPC,
  GNOSIS_RPC as FALLBACK_GNOSIS_RPC,
  MAINNET_RPC as FALLBACK_MAINNET_RPC,
  OPTIMISM_RPC as FALLBACK_OPTIMISM_RPC,
} from "@/lib/rpc.ts";
import { configurePublicRpcUrls, initApiHost } from "@seer-pm/sdk";
import {
  http,
  type Chain,
  type PrivateKeyAccount,
  type PublicClient,
  createPublicClient,
  createWalletClient,
} from "viem";
import { base, gnosis, mainnet, optimism, sepolia } from "viem/chains";

export { gnosis, mainnet, optimism, base };

// Prod sets PRIVATE_RPC_*; the fallbacks are the same dRPC endpoints the frontend uses, so a missing
// env var still lands on an endpoint that answers. Callers that swallow RPC errors — such as
// `getChallengePeriodDuration` — return a degraded result rather than failing, so an unreachable
// fallback is not something a run would report.
const GNOSIS_RPC = process.env.PRIVATE_RPC_GNOSIS || FALLBACK_GNOSIS_RPC;
const MAINNET_RPC = process.env.PRIVATE_RPC_MAINNET || FALLBACK_MAINNET_RPC;
const OPTIMISM_RPC = process.env.PRIVATE_RPC_OPTIMISM || FALLBACK_OPTIMISM_RPC;
const BASE_RPC = process.env.PRIVATE_RPC_BASE || FALLBACK_BASE_RPC;

initApiHost(process.env.API_HOST || process.env.URL || "https://app.seer.pm");

configurePublicRpcUrls({
  [gnosis.id]: GNOSIS_RPC,
  [mainnet.id]: MAINNET_RPC,
  [optimism.id]: OPTIMISM_RPC,
  [base.id]: BASE_RPC,
});

const SEPOLIA_RPC = process.env.PRIVATE_RPC_SEPOLIA || "https://ethereum-sepolia-rpc.publicnode.com";

const CHAIN_BY_ID = {
  [mainnet.id]: mainnet,
  [sepolia.id]: sepolia,
  [gnosis.id]: gnosis,
  [optimism.id]: optimism,
  [base.id]: base,
} as const satisfies Record<number, Chain>;

const RPC_URL_BY_CHAIN_ID: Record<number, string> = {
  [mainnet.id]: MAINNET_RPC,
  [sepolia.id]: SEPOLIA_RPC,
  [gnosis.id]: GNOSIS_RPC,
  [optimism.id]: OPTIMISM_RPC,
  [base.id]: BASE_RPC,
};

export function getChainById(chainId: number): Chain {
  const chain = CHAIN_BY_ID[chainId as keyof typeof CHAIN_BY_ID];
  if (!chain) {
    throw new Error(`Unsupported chain id: ${chainId}`);
  }
  return chain;
}

export function getRpcUrlByChainId(chainId: number): string {
  const rpcUrl = RPC_URL_BY_CHAIN_ID[chainId];
  if (!rpcUrl) {
    throw new Error(`Missing RPC URL for chain id: ${chainId}`);
  }
  return rpcUrl;
}

export const publicClients = Object.fromEntries(
  Object.entries(CHAIN_BY_ID).map(([chainId, chain]) => [
    Number(chainId),
    createPublicClient({
      chain,
      transport: http(getRpcUrlByChainId(Number(chainId)), { batch: true }),
    }),
  ]),
);

export function getPublicClientByChainId(chainId: number | undefined): PublicClient {
  if (!chainId) {
    throw new Error("Missing chainId");
  }
  const client = publicClients[chainId];
  if (!client) {
    throw new Error(`No public client configured for chain id: ${chainId}`);
  }
  return client as PublicClient;
}

export function getWalletClientForNetwork(account: PrivateKeyAccount, chainId: number) {
  return createWalletClient({
    account,
    chain: getChainById(chainId),
    transport: http(getRpcUrlByChainId(chainId), { batch: true }),
  });
}

export const chainIds = [mainnet.id, gnosis.id, optimism.id, base.id, sepolia.id] as const;
