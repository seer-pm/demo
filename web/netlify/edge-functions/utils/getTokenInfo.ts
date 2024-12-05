import { readContracts } from "https://esm.sh/@wagmi/core@2.12.2";
import { erc20Abi } from "https://esm.sh/viem@2.17.5";
import { SupportedChain, config } from "./config.ts";
import { Address } from "./types.ts";

export async function getTokenInfo(address: Address, chainId: SupportedChain) {
  if (!address) return;
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
