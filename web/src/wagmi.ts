import { createWeb3Modal } from "@web3modal/wagmi/react";
import { defaultWagmiConfig } from "@web3modal/wagmi/react/config";
import { http, fallback } from "wagmi";
import { Chain, sepolia } from "wagmi/chains";
import { injected, walletConnect } from "wagmi/connectors";
import { SUPPORTED_CHAINS, gnosis, hardhat, mainnet, optimism } from "./lib/chains";
import SEER_ENV from "./lib/env";

const GNOSIS_RPC = import.meta.env.PRIVATE_RPC_GNOSIS || "https://gnosis-pokt.nodies.app";
const MAINNET_RPC = import.meta.env.PRIVATE_RPC_MAINNET || "https://eth-pokt.nodies.app";
const OPTIMISM_RPC = import.meta.env.PRIVATE_RPC_OPTIMISM || "https://mainnet.optimism.io";

if (typeof window !== "undefined") {
  import("@swapr/sdk").then(({ configureRpcProviders, ChainId }) => {
    configureRpcProviders({
      [ChainId.XDAI]: GNOSIS_RPC,
      [ChainId.MAINNET]: MAINNET_RPC,
      [ChainId.OPTIMISM_MAINNET]: OPTIMISM_RPC,
    });
  });
}

const metadata = {
  name: "Seer",
  description: "Prediction Markets",
  url: "https://web3modal.com",
  icons: ["https://avatars.githubusercontent.com/u/37784886"],
};

export const config = defaultWagmiConfig({
  metadata,
  projectId: SEER_ENV.VITE_WC_PROJECT_ID!,
  chains: Object.values(SUPPORTED_CHAINS) as unknown as [Chain, ...Chain[]],
  connectors: [injected(), walletConnect({ projectId: SEER_ENV.VITE_WC_PROJECT_ID!, showQrModal: false })],
  enableCoinbase: false,
  transports: {
    [gnosis.id]: fallback([http(GNOSIS_RPC), http("https://rpc.gnosischain.com")]),
    [mainnet.id]: fallback([http(MAINNET_RPC), http("https://eth-pokt.nodies.app")]),
    [optimism.id]: fallback([http(OPTIMISM_RPC), http("https://mainnet.optimism.io")]),
    [sepolia.id]: http("https://ethereum-sepolia-rpc.publicnode.com"),
    [hardhat.id]: http(),
  },
  ssr: true,
});

createWeb3Modal({
  wagmiConfig: config,
  projectId: SEER_ENV.VITE_WC_PROJECT_ID!,
  enableAnalytics: true,
  themeVariables: {
    "--w3m-z-index": 1000,
  },
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
