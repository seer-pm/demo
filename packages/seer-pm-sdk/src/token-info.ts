/**
 * Token info (decimals, name, symbol) via ERC20 reads.
 */

import type { Config } from "@wagmi/core";
import { readContracts } from "@wagmi/core";
import type { Address } from "viem";
import { erc20Abi } from "viem";
import { gnosis } from "viem/chains";
import type { SupportedChain } from "./chains";
import { NATIVE_TOKEN } from "./tokens";

export interface GetTokenResult {
  address: Address;
  chainId: number;
  decimals: number;
  name: string;
  symbol: string;
}

export async function getTokenInfo(address: Address, chainId: SupportedChain, config: Config): Promise<GetTokenResult> {
  if (address.toLowerCase() === NATIVE_TOKEN.toLowerCase()) {
    return {
      address,
      chainId,
      decimals: 18,
      name: chainId === gnosis.id ? "xDAI" : "ETH",
      symbol: chainId === gnosis.id ? "xDAI" : "ETH",
    };
  }

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

  return { address, chainId, decimals, name, symbol };
}
