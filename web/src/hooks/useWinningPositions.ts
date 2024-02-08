import { RouterAbi } from "@/abi/RouterAbi";
import { config } from "@/wagmi";
import { useQuery } from "@tanstack/react-query";
import { readContract } from "@wagmi/core";
import { Address } from "viem";
import { Position, usePositions } from "./usePositions";

export const useWinningPositions = (
  account: Address | undefined,
  router: Address,
  conditionId: `0x${string}`,
  conditionalTokens: Address,
  collateralToken: Address,
  outcomeSlotCount: number,
) => {
  const { data: positions = [] } = usePositions(
    account,
    router,
    conditionId,
    conditionalTokens,
    collateralToken,
    outcomeSlotCount,
  );

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
