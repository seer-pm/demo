import { readContracts } from "@wagmi/core";
import { erc20Abi } from "viem";
import { SupportedChain, config } from "./config.ts";
import { Address } from "./types.ts";

export async function getTokenInfo(address: Address, chainId: SupportedChain) {
  const [decimals, name, symbol] = await readContracts(config, {
    allowFailure: false,
    contracts: [
      {
        address,
        abi: erc20Abi,
        functionName: "decimals",
        chainId,
      },
      {
        address,
        abi: erc20Abi,
        functionName: "name",
        chainId,
      },
      {
        address,
        abi: erc20Abi,
        functionName: "symbol",
        chainId,
      },
    ],
  });

  return { address, decimals, name, symbol };
}
