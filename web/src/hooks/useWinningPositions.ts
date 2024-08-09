import { RouterAbi } from "@/abi/RouterAbi";
import { config } from "@/wagmi";
import { useQuery } from "@tanstack/react-query";
import { readContract } from "@wagmi/core";
import { Address } from "viem";
import { Market } from "./useMarket";
import { Position, useUserPositions } from "./useUserPositions";

export const useWinningPositions = (
  account: Address | undefined,
  market: Market,
  router: Address,
  conditionId: `0x${string}`,
) => {
  const { data: positions = [] } = useUserPositions(account, market);

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
