import { configurePublicRpcUrls } from "@seer-pm/sdk";
import { createWeb3Modal } from "@web3modal/wagmi/react";
import { base, gnosis, mainnet, optimism } from "viem/chains";
import SEER_ENV from "./lib/env";
import { ARBITRUM_RPC, BASE_RPC, GNOSIS_RPC, MAINNET_RPC, OPTIMISM_RPC, config } from "./wagmiConfig";

export { ARBITRUM_RPC, BASE_RPC, GNOSIS_RPC, MAINNET_RPC, OPTIMISM_RPC, config };
export { connectors } from "./wagmiConfig";

if (typeof window !== "undefined") {
  configurePublicRpcUrls({
    [gnosis.id]: GNOSIS_RPC,
    [mainnet.id]: MAINNET_RPC,
    [optimism.id]: OPTIMISM_RPC,
    [base.id]: BASE_RPC,
  });
}

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
    config: typeof import("./wagmiConfig").config;
  }
}
