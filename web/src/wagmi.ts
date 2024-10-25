import { createWeb3Modal } from "@web3modal/wagmi/react";
import { defaultWagmiConfig } from "@web3modal/wagmi/react/config";
import { http } from "wagmi";
import { Chain, sepolia } from "wagmi/chains";
import { coinbaseWallet, injected, walletConnect } from "wagmi/connectors";
import { SUPPORTED_CHAINS, gnosis, hardhat, mainnet } from "./lib/chains";

const metadata = {
  name: "Seer",
  description: "Prediction Markets",
  url: "https://web3modal.com",
  icons: ["https://avatars.githubusercontent.com/u/37784886"],
};

export const config = defaultWagmiConfig({
  metadata,
  projectId: import.meta.env.VITE_WC_PROJECT_ID,
  chains: Object.values(SUPPORTED_CHAINS) as unknown as [Chain, ...Chain[]],
  connectors: [
    injected(),
    coinbaseWallet({ appName: "Seer" }),
    walletConnect({ projectId: import.meta.env.VITE_WC_PROJECT_ID, showQrModal: false }),
  ],
  transports: {
    [gnosis.id]: http(),
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [hardhat.id]: http(),
  },
  ssr: true,
});

createWeb3Modal({
  wagmiConfig: config,
  projectId: import.meta.env.VITE_WC_PROJECT_ID,
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
