import { RouterAbi } from "@/abi/RouterAbi";
import { config } from "@/wagmi";
import { useQuery } from "@tanstack/react-query";
import { readContract } from "@wagmi/core";
import { Address } from "viem";
import { Position, useUserPositions } from "./useUserPositions";

export const useWinningPositions = (
  account: Address | undefined,
  chainId: number,
  router: Address,
  conditionId: `0x${string}`,
  outcomeSlotCount: number,
) => {
  const { data: positions = [] } = useUserPositions(account, chainId, router, conditionId, outcomeSlotCount);

  return useQuery<Position[] | undefined, Error>({
    enabled: !!router && !!conditionId && positions.length > 0,
    queryKey: ["useWinningPositions", router, conditionId],
    queryFn: async () => {
      const winningOutcomes = await readContract(config, {
        abi: RouterAbi,
        address: router!,
        functionName: "getWinningOutcomes",
        args: [conditionId!],
      });

      return positions.map((position, i) => {
        if (!winningOutcomes[i]) {
          position.balance = BigInt(0);
        }
        return position;
      });
    },
  });
};
