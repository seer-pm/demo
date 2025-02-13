import { createWeb3Modal } from "@web3modal/wagmi/react";
import { defaultWagmiConfig } from "@web3modal/wagmi/react/config";
import { http, fallback } from "wagmi";
import { Chain, sepolia } from "wagmi/chains";
import { injected, walletConnect } from "wagmi/connectors";
import { SUPPORTED_CHAINS, gnosis, hardhat, mainnet } from "./lib/chains";
import SEER_ENV from "./lib/env";

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
    [gnosis.id]: fallback([
      http("https://gnosis-pokt.nodies.app"),
      http("https://rpc.gnosischain.com"),
      http("https://rpc.ankr.com/gnosis"),
    ]),
    [mainnet.id]: http("https://eth-pokt.nodies.app"),
    [sepolia.id]: http(),
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
