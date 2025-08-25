import { http, createConfig } from "wagmi";
import { gnosis, mainnet, optimism, sepolia } from "wagmi/chains";

export { gnosis, mainnet, optimism };

// TODO: replace this
export const config = createConfig({
  chains: [mainnet, sepolia, gnosis, optimism],
  transports: {
    [mainnet.id]: http(process.env.PRIVATE_RPC_MAINNET || "https://eth-pokt.nodies.app"),
    [sepolia.id]: http(process.env.PRIVATE_RPC_SEPOLIA || "https://ethereum-sepolia-rpc.publicnode.com"),
    [gnosis.id]: http(process.env.PRIVATE_RPC_GNOSIS || "https://gnosis-pokt.nodies.app"),
    [optimism.id]: http(process.env.PRIVATE_RPC_OPTIMISM || "https://mainnet.optimism.io"),
  },
});

export const chainIds = [mainnet.id, gnosis.id, optimism.id, sepolia.id] as const;
