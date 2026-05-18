import type { SupportedChain } from "@seer-pm/sdk";
import { Config, readContracts } from "@wagmi/core";
import { Address, erc20Abi } from "viem";

export type TokensInfo = {
  balances: bigint[];
  names: string[];
  decimals: bigint[];
};

export async function getTokensInfo(
  config: Config,
  chainId: SupportedChain,
  tokenAddresses: readonly Address[],
  account: Address,
): Promise<TokensInfo> {
  const functions = [
    {
      name: "balanceOf",
      args: [account],
    },
    {
      name: "name",
      args: [],
    },
    {
      name: "decimals",
      args: [],
    },
  ];
  const data = await Promise.all(
    functions.map(({ name, args }) =>
      readContracts(config, {
        contracts: tokenAddresses.map((wrappedAddress) => ({
          abi: erc20Abi,
          address: wrappedAddress,
          chainId,
          functionName: name,
          args,
        })),
        allowFailure: false,
      }),
    ),
  );
  const balances = data[0] as bigint[];
  const names = data[1] as string[];
  const decimals = data[2] as bigint[];
  return { balances, names, decimals };
}
