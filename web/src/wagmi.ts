import { createWeb3Modal } from "@web3modal/wagmi/react";
import { http, createConfig } from "wagmi";
import { Chain, bsc, gnosis, goerli, hardhat, mainnet } from "wagmi/chains";
import { coinbaseWallet, injected, walletConnect } from "wagmi/connectors";
import { SUPPORTED_CHAINS } from "./lib/config";

export const config = createConfig({
  chains: Object.values(SUPPORTED_CHAINS) as [Chain, ...Chain[]],
  connectors: [
    injected(),
    coinbaseWallet({ appName: "Seer" }),
    walletConnect({ projectId: import.meta.env.VITE_WC_PROJECT_ID }),
  ],
  transports: {
    [gnosis.id]: http(),
    [mainnet.id]: http(),
    [bsc.id]: http(),
    [goerli.id]: http(),
    [hardhat.id]: http(),
  },
});

createWeb3Modal({
  wagmiConfig: config,
  projectId: import.meta.env.VITE_WC_PROJECT_ID,
  enableAnalytics: true,
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
