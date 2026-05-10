import { createWeb3Modal } from "@web3modal/wagmi/react";
import SEER_ENV from "./lib/env";
import { ARBITRUM_RPC, BASE_RPC, GNOSIS_RPC, MAINNET_RPC, OPTIMISM_RPC, config } from "./wagmiConfig";

export { ARBITRUM_RPC, BASE_RPC, GNOSIS_RPC, MAINNET_RPC, OPTIMISM_RPC, config };
export { connectors } from "./wagmiConfig";

if (typeof window !== "undefined") {
  import("@seer-pm/sdk").then(({ configureRpcProviders, ChainId }) => {
    configureRpcProviders({
      [ChainId.XDAI]: GNOSIS_RPC,
      [ChainId.MAINNET]: MAINNET_RPC,
      [ChainId.OPTIMISM_MAINNET]: OPTIMISM_RPC,
      [ChainId.BASE]: BASE_RPC,
    });
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
