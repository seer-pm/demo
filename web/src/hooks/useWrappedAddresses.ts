import { RouterAbi } from "@/abi/RouterAbi";
import { EMPTY_PARENT_COLLECTION, generateBasicPartition } from "@/lib/conditional-tokens";
import { COLLATERAL_TOKENS } from "@/lib/config";
import { config } from "@/wagmi";
import { useQuery } from "@tanstack/react-query";
import { readContracts } from "@wagmi/core";
import { Address } from "viem";

export const useWrappedAddresses = (
  chainId: number,
  router: Address,
  conditionId?: `0x${string}`,
  outcomeSlotCount?: number,
) => {
  return useQuery<Address[] | undefined, Error>({
    enabled: !!chainId && !!router && !!conditionId && !!outcomeSlotCount,
    queryKey: ["useWrappedAddresses", chainId, router, conditionId, outcomeSlotCount],
    queryFn: async () => {
      const partitions = generateBasicPartition(outcomeSlotCount!);

      return readContracts(config, {
        allowFailure: false,
        contracts: partitions.map((indexSet) => ({
          abi: RouterAbi,
          address: router,
          functionName: "getTokenAddress",
          args: [COLLATERAL_TOKENS[chainId].primary.address, EMPTY_PARENT_COLLECTION, conditionId!, indexSet],
          chainId,
        })),
      });
    },
  });
};
