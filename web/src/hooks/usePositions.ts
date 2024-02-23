import { useWrappedAddresses } from "@/hooks/useWrappedAddresses";
import { config } from "@/wagmi";
import { useQuery } from "@tanstack/react-query";
import { readContracts } from "@wagmi/core";
import { Address, erc20Abi } from "viem";

export type Position = { tokenId: Address; balance: bigint };

export const usePositions = (
  address: Address | undefined,
  chainId: number,
  router: Address,
  conditionId: `0x${string}`,
  outcomeSlotCount: number,
) => {
  const { data: wrappedAddresses = [] } = useWrappedAddresses(chainId, router, conditionId, outcomeSlotCount);
  return useQuery<Position[] | undefined, Error>({
    enabled: !!address && !!chainId && !!router && wrappedAddresses.length > 0,
    queryKey: ["usePositions", address, chainId, conditionId],
    queryFn: async () => {
      const balances = (await readContracts(config, {
        contracts: wrappedAddresses!.map((wrappedAddresses) => ({
          abi: erc20Abi,
          address: wrappedAddresses,
          functionName: "balanceOf",
          args: [address],
        })),
        allowFailure: false,
      })) as bigint[];

      return wrappedAddresses!.map((wrappedAddress, i) => ({
        tokenId: wrappedAddress,
        balance: balances[i],
      }));
    },
  });
};
