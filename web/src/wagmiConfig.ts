import { defaultWagmiConfig } from "@web3modal/wagmi/react/config";
import { http, fallback } from "wagmi";
import { type Chain, sepolia } from "wagmi/chains";
import { injected, walletConnect } from "wagmi/connectors";
import { SUPPORTED_CHAINS, base, gnosis, hardhat, mainnet, optimism } from "./lib/chains";
import SEER_ENV from "./lib/env";
import { ARBITRUM_RPC, BASE_RPC, GNOSIS_RPC, MAINNET_RPC, OPTIMISM_RPC } from "./lib/rpc";

export { ARBITRUM_RPC, BASE_RPC, GNOSIS_RPC, MAINNET_RPC, OPTIMISM_RPC };

const metadata = {
  name: "Seer",
  description: "Prediction Markets",
  url: "https://web3modal.com",
  icons: ["https://avatars.githubusercontent.com/u/37784886"],
};

export const connectors = [injected(), walletConnect({ projectId: SEER_ENV.VITE_WC_PROJECT_ID!, showQrModal: false })];

/**
 * Reads arrive in bursts (one table row per wallet), and ungrouped each one pays its own round trip.
 * `wait` catches the calls that miss the same tick: at 0 only what shares a microtask flush groups.
 * `batchSize` stays well under viem's default because an endpoint that refuses an oversized batch
 * fails every call in it, and the fallbacks below are public endpoints with differing tolerances.
 */
const BATCH = { wait: 16, batchSize: 100 } as const;

const rpc = (url?: string) => http(url, { batch: BATCH });

export const config = defaultWagmiConfig({
  metadata,
  projectId: SEER_ENV.VITE_WC_PROJECT_ID!,
  chains: Object.values(SUPPORTED_CHAINS) as unknown as [Chain, ...Chain[]],
  connectors,
  enableCoinbase: false,
  transports: {
    [gnosis.id]: fallback([rpc(GNOSIS_RPC), rpc("https://rpc.gnosischain.com")]),
    [mainnet.id]: fallback([rpc(MAINNET_RPC), rpc("https://eth-pokt.nodies.app")]),
    [optimism.id]: fallback([rpc(OPTIMISM_RPC), rpc("https://mainnet.optimism.io")]),
    [base.id]: fallback([rpc(BASE_RPC), rpc("https://base.llamarpc.com")]),
    [sepolia.id]: rpc("https://ethereum-sepolia-rpc.publicnode.com"),
    [hardhat.id]: rpc(),
  },
  ssr: true,
});
