import { RouterAbi } from "@/abi/RouterAbi";
import { generateWinningOutcomeIndexes } from "@/lib/conditional-tokens";
import { Market, getRedeemedPrice } from "@/lib/market";
import { config } from "@/wagmi";
import { useQuery } from "@tanstack/react-query";
import { readContract } from "@wagmi/core";
import { Address, formatUnits } from "viem";
import { Position, useMarketPositions } from "./useMarketPositions";

export const useWinningPositions = (account: Address | undefined, market: Market, router: Address) => {
  const { data: positions = [] } = useMarketPositions(account, market);

  return useQuery<{ winningPositions: Position[]; winningOutcomeIndexes: bigint[] } | undefined, Error>({
    enabled: !!router && positions.length > 0,
    queryKey: ["useWinningPositions", router, positions.map((x) => ({ ...x, balance: x.balance.toString() }))],
    queryFn: async () => {
      const winningOutcomes = await readContract(config, {
        abi: RouterAbi,
        address: router!,
        functionName: "getWinningOutcomes",
        args: [market.conditionId],
      });

      //  set balance=0 to positions that are not winning outcomes
      const winningPositionsWithZero = positions.map((position, i) => {
        // Create a copy of the position to avoid modifying the original
        const positionCopy = { ...position };

        if (market.type === "Generic") {
          const redeemPrice = getRedeemedPrice(market, i);
          const redeemAmount = redeemPrice * Number(formatUnits(position.balance, position.decimals));
          if (redeemAmount < 0.01) {
            // ignore this position if the amount to redeem is too small
            positionCopy.balance = 0n;
          }
        } else {
          // futarchy market
          // if the winning outcome is the first one (YES), put to zero odd indexes (NO)
          // if the winning outcome is the second one (NO), put to zero even indexes (YES)
          if ((winningOutcomes[0] === true && i % 2 === 1) || (winningOutcomes[1] === true && i % 2 === 0)) {
            positionCopy.balance = 0n;
          }
        }
        return positionCopy;
      });

      // futarchy markets have 4 outcomes but only 2 of them can be winning positions (both YES or both NO)
      const winningPositions =
        // winningOutcomes[0] === true is YES, winningOutcomes[1] === true is NO
        market.type === "Futarchy" && (winningOutcomes[0] || winningOutcomes[1])
          ? // for futarchy markets return all positions (even if balance = 0) because FutarchyRouter.redeemProposal() uses both
            winningOutcomes[0]
            ? // positions 0 and 2 are YES tokens
              [winningPositionsWithZero[0], winningPositionsWithZero[2]]
            : // positions 1 and 3 are NO tokens
              [winningPositionsWithZero[1], winningPositionsWithZero[3]]
          : // generic markets can have winning positions on any outcome, we return only the positions with balance > 0
            winningPositionsWithZero.filter((position) => position.balance > 0n);

      return {
        // winning positions (positions with balance > 0)
        winningPositions: winningPositions,
        // indices of winning positions where the user has balance > 0
        winningOutcomeIndexes: generateWinningOutcomeIndexes(winningPositionsWithZero),
      };
    },
  });
};
