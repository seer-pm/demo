import { RouterAbi } from "@/abi/RouterAbi";
import { EMPTY_PARENT_COLLECTION, generateBasicPartition } from "@/lib/conditional-tokens";
import { COLLATERAL_TOKENS } from "@/lib/config";
import { config } from "@/wagmi";
import { useQuery } from "@tanstack/react-query";
import { readContracts, simulateContract } from "@wagmi/core";
import { Address, erc20Abi } from "viem";

export type Position = { tokenId: Address; balance: bigint };

export const usePositions = (
  address?: Address,
  chainId?: number,
  router?: Address,
  conditionId?: `0x${string}`,
  outcomeSlotCount?: number,
) => {
  return useQuery<Position[] | undefined, Error>({
    enabled: !!address && !!chainId && !!router && !!conditionId && !!outcomeSlotCount,
    queryKey: ["usePositions", address, chainId, router, conditionId, outcomeSlotCount],
    queryFn: async () => {
      const partitions = generateBasicPartition(outcomeSlotCount!);

      const wrappedAddresses = (
        await Promise.all(
          partitions.map((indexSet) =>
            simulateContract(config, {
              abi: RouterAbi,
              address: router!,
              functionName: "getTokenAddress",
              args: [COLLATERAL_TOKENS[chainId!].primary.address, EMPTY_PARENT_COLLECTION, conditionId!, indexSet],
            }),
          ),
        )
      ).map((r) => r.result);

      const balances = (await readContracts(config, {
        contracts: wrappedAddresses.map((wrappedAddresses) => ({
          abi: erc20Abi,
          address: wrappedAddresses,
          functionName: "balanceOf",
          args: [address],
        })),
        allowFailure: false,
      })) as bigint[];

      return wrappedAddresses.map((wrappedAddress, i) => ({
        tokenId: wrappedAddress,
        balance: balances[i],
      }));
    },
  });
};
