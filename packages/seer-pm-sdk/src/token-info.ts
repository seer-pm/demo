/**
 * Token info (decimals, name, symbol) via ERC20 reads.
 */

import type { Address, Client } from "viem";
import { erc20Abi } from "viem";
import { multicall } from "viem/actions";
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

export async function getTokenInfo(address: Address, chainId: SupportedChain, client: Client): Promise<GetTokenResult> {
  if (address.toLowerCase() === NATIVE_TOKEN.toLowerCase()) {
    return {
      address,
      chainId,
      decimals: 18,
      name: chainId === gnosis.id ? "xDAI" : "ETH",
      symbol: chainId === gnosis.id ? "xDAI" : "ETH",
    };
  }

  const [decimals, name, symbol] = await multicall(client, {
    allowFailure: false,
    contracts: [
      {
        address,
        abi: erc20Abi,
        functionName: "decimals",
      },
      {
        address,
        abi: erc20Abi,
        functionName: "name",
      },
      {
        address,
        abi: erc20Abi,
        functionName: "symbol",
      },
    ],
  });

  return { address, chainId, decimals, name, symbol };
}
