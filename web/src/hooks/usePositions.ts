import { RouterAbi } from "@/abi/RouterAbi";
import { generateBasicPartition } from "@/lib/conditional-tokens";
import { config } from "@/wagmi";
import { useQuery } from "@tanstack/react-query";
import { readContracts, simulateContract } from "@wagmi/core";
import { Address, erc20Abi, stringToHex } from "viem";

export type Position = { tokenId: Address; balance: bigint };

export const usePositions = (
  address?: Address,
  router?: Address,
  conditionId?: `0x${string}`,
  conditionalTokens?: Address,
  collateralToken?: Address,
  outcomeSlotCount?: number,
) => {
  return useQuery<Position[] | undefined, Error>({
    enabled: !!address && !!router && !!conditionId && !!conditionalTokens && !!collateralToken && !!outcomeSlotCount,
    queryKey: ["usePositions", address, router, conditionId, conditionalTokens, collateralToken, outcomeSlotCount],
    queryFn: async () => {
      const parentCollectionId = stringToHex("", { size: 32 });

      const partitions = generateBasicPartition(outcomeSlotCount!);

      const wrappedAddresses = (
        await Promise.all(
          partitions.map((indexSet) =>
            simulateContract(config, {
              abi: RouterAbi,
              address: router!,
              functionName: "getTokenAddress",
              args: [collateralToken!, parentCollectionId, conditionId!, indexSet],
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
