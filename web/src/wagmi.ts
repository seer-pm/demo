import { createWeb3Modal } from "@web3modal/wagmi/react";
import { http, createConfig } from "wagmi";
import { goerli, hardhat, mainnet } from "wagmi/chains";
import { coinbaseWallet, injected, walletConnect } from "wagmi/connectors";

export const config = createConfig({
  chains: [mainnet, goerli, hardhat],
  connectors: [
    injected(),
    coinbaseWallet({ appName: "Create Wagmi" }),
    walletConnect({ projectId: import.meta.env.VITE_WC_PROJECT_ID }),
  ],
  transports: {
    [mainnet.id]: http(),
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
