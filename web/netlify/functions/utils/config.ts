import { http, createConfig } from "wagmi";
import { gnosis, mainnet, sepolia } from "wagmi/chains";

export const NATIVE_TOKEN = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";

export const config = createConfig({
  chains: [mainnet, sepolia, gnosis],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [gnosis.id]: http("https://rpc.ap-southeast-1.gateway.fm/v4/gnosis/non-archival/mainnet"),
  },
});

export const COLLATERAL_TOKENS = {
  [gnosis.id]: {
    primary: { address: "0xaf204776c7245bf4147c2612bf6e5972ee483701", symbol: "sDAI", decimals: 18 },
    secondary: {
      address: NATIVE_TOKEN,
      symbol: "xDAI",
      decimals: 18,
      wrapped: { address: "0xe91d153e0b41518a2ce8dd3d7944fa863463a97d", symbol: "wxDAI", decimals: 18 },
    },
  },
  [mainnet.id]: {
    primary: { address: "0x83F20F44975D03b1b09e64809B757c47f942BEeA", symbol: "sDAI", decimals: 18 },
    secondary: { address: "0x6B175474E89094C44Da98b954EedeAC495271d0F", symbol: "DAI", decimals: 18 },
  },
  [sepolia.id]: {
    primary: { address: "0xff34b3d4aee8ddcd6f9afffb6fe49bd371b8a357", symbol: "DAI", decimals: 18 },
    secondary: undefined,
  },
} as const;
export const chainIds = [mainnet.id, sepolia.id, gnosis.id] as const;
export type SupportedChain = (typeof chainIds)[number];
