import { http, createConfig } from "wagmi";
import { gnosis, mainnet, sepolia } from "wagmi/chains";

export { gnosis, mainnet };

// TODO: replace this
export const config = createConfig({
  chains: [mainnet, sepolia, gnosis],
  transports: {
    [mainnet.id]: http(process.env.PRIVATE_RPC_MAINNET || "https://eth-pokt.nodies.app"),
    [sepolia.id]: http(process.env.PRIVATE_RPC_SEPOLIA || "https://ethereum-sepolia-rpc.publicnode.com"),
    [gnosis.id]: http(process.env.PRIVATE_RPC_GNOSIS || "https://gnosis-pokt.nodies.app"),
  },
});

export const chainIds = [mainnet.id, gnosis.id, sepolia.id] as const;
