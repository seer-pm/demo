import { RouterAbi } from "@/abi/RouterAbi";
import { EMPTY_PARENT_COLLECTION, generateBasicPartition } from "@/lib/conditional-tokens";
import { COLLATERAL_TOKENS } from "@/lib/config";
import { config } from "@/wagmi";
import { useQuery } from "@tanstack/react-query";
import { readContracts } from "@wagmi/core";
import { Address } from "viem";

export const fetchWrappedAddresses = (
  chainId: number,
  router: Address,
  conditionId: `0x${string}`,
  partitions: bigint[],
) => {
  return readContracts(config, {
    allowFailure: false,
    contracts: partitions.map((indexSet) => ({
      abi: RouterAbi,
      address: router,
      functionName: "getTokenAddress",
      args: [COLLATERAL_TOKENS[chainId].primary.address, EMPTY_PARENT_COLLECTION, conditionId, indexSet],
      chainId,
    })),
  });
};

export const useWrappedAddresses = (
  chainId: number,
  router: Address,
  conditionId?: `0x${string}`,
  outcomeSlotCountOrIndexSet?: number | bigint[],
) => {
  const partition: bigint[] =
    typeof outcomeSlotCountOrIndexSet === "number"
      ? generateBasicPartition(outcomeSlotCountOrIndexSet)
      : outcomeSlotCountOrIndexSet || [];
  return useQuery<Address[] | undefined, Error>({
    enabled: !!chainId && !!router && !!conditionId && partition.length > 0,
    queryKey: ["useWrappedAddresses", chainId, router, conditionId, partition.map((i) => i.toString())],
    queryFn: async () => {
      return fetchWrappedAddresses(chainId, router, conditionId!, partition);
    },
  });
};
