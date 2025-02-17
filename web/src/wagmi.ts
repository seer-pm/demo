import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { AppKitNetwork } from "@reown/appkit/networks";
import { createAppKit } from "@reown/appkit/react";
import { http, fallback } from "wagmi";
import { injected, walletConnect } from "wagmi/connectors";
import { SUPPORTED_CHAINS, gnosis, hardhat, mainnet, sepolia } from "./lib/chains";
import SEER_ENV from "./lib/env";

const metadata = {
  name: "Seer",
  description: "Prediction Markets",
  url: "https://web3modal.com",
  icons: ["https://avatars.githubusercontent.com/u/37784886"],
};

const chains = Object.values(SUPPORTED_CHAINS) as unknown as [AppKitNetwork, ...AppKitNetwork[]];

const wagmiAdapter = new WagmiAdapter({
  projectId: SEER_ENV.VITE_WC_PROJECT_ID!,
  networks: chains,
  connectors: [injected(), walletConnect({ projectId: SEER_ENV.VITE_WC_PROJECT_ID!, showQrModal: false })],
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

export const config = wagmiAdapter.wagmiConfig;

createAppKit({
  metadata,
  adapters: [wagmiAdapter],
  networks: chains,
  defaultNetwork: gnosis,
  projectId: SEER_ENV.VITE_WC_PROJECT_ID!,
  features: {
    email: false,
    socials: [],
    emailShowWallets: true,
  },
  allWallets: "SHOW",
  allowUnsupportedChain: true,
  themeVariables: {
    "--w3m-z-index": 10000,
  },
});
