import { config } from "@/wagmi";
import { useQuery } from "@tanstack/react-query";
import { readContracts } from "@wagmi/core";
import { Address, erc20Abi } from "viem";
import { Market } from "./useMarket";

export type Position = { tokenId: Address; balance: bigint; symbol: string; decimals: bigint };

export const useMarketPositions = (address: Address | undefined, market: Market) => {
  return useQuery<Position[] | undefined, Error>({
    enabled: !!address,
    queryKey: ["useMarketPositions", address, market.id],
    queryFn: async () => {
      const balances = (await readContracts(config, {
        contracts: market.wrappedTokens!.map((wrappedAddresses) => ({
          abi: erc20Abi,
          address: wrappedAddresses,
          functionName: "balanceOf",
          args: [address],
        })),
        allowFailure: false,
      })) as bigint[];

      const decimals = (await readContracts(config, {
        contracts: market.wrappedTokens!.map((wrappedAddresses) => ({
          abi: erc20Abi,
          address: wrappedAddresses,
          functionName: "decimals",
          args: [],
        })),
        allowFailure: false,
      })) as bigint[];

      const symbols = (await readContracts(config, {
        contracts: market.wrappedTokens!.map((wrappedAddresses) => ({
          abi: erc20Abi,
          address: wrappedAddresses,
          functionName: "symbol",
          args: [],
        })),
        allowFailure: false,
      })) as string[];

      return market.wrappedTokens!.map((wrappedAddress, i) => ({
        tokenId: wrappedAddress,
        balance: balances[i],
        symbol: symbols[i],
        decimals: decimals[i],
      }));
    },
  });
};
