import type { Address, Client } from "viem";
import { formatUnits } from "viem";
import { readContract } from "viem/actions";
import { routerAbi } from "../generated/contracts/router";
import { generateWinningOutcomeIndexes } from "./conditional-tokens";
import { getRedeemedPrice } from "./market";
import type { Market } from "./market-types";
import { getRouterAddress } from "./router-addresses";

export interface WinningPositionInput {
  tokenId: Address;
  balance: bigint;
  symbol: string;
  decimals: number;
}

export interface WinningPositionsResult<TPosition extends WinningPositionInput = WinningPositionInput> {
  winningPositions: TPosition[];
  winningOutcomeIndexes: bigint[];
}

interface GetWinningPositionsParams<TPosition extends WinningPositionInput = WinningPositionInput> {
  client: Client;
  market: Market;
  positions: TPosition[];
}

export const getWinningPositions = async <TPosition extends WinningPositionInput = WinningPositionInput>({
  client,
  market,
  positions,
}: GetWinningPositionsParams<TPosition>): Promise<WinningPositionsResult<TPosition>> => {
  const router = getRouterAddress(market);
  const winningOutcomes = await readContract(client, {
    abi: routerAbi,
    address: router,
    functionName: "getWinningOutcomes",
    args: [market.conditionId],
  });

  // set balance=0 to positions that are not winning outcomes
  const winningPositionsWithZero = positions.map((position, i) => {
    // Create a copy of the position to avoid modifying the original
    const positionCopy = { ...position };

    if (market.type === "Generic") {
      const redeemPrice = getRedeemedPrice(market, i);
      const redeemAmount = redeemPrice * Number(formatUnits(position.balance, position.decimals));
      if (redeemAmount < 0.01) {
        // Ignore this position if the amount to redeem is too small.
        positionCopy.balance = 0n;
      }
    } else {
      // Futarchy market:
      // if the winning outcome is the first one (YES), put to zero odd indexes (NO)
      // if the winning outcome is the second one (NO), put to zero even indexes (YES)
      if ((winningOutcomes[0] === true && i % 2 === 1) || (winningOutcomes[1] === true && i % 2 === 0)) {
        positionCopy.balance = 0n;
      }
    }

    return positionCopy;
  });

  // Futarchy markets have 4 outcomes but only 2 of them can be winning positions (both YES or both NO)
  const winningPositions =
    // winningOutcomes[0] === true is YES, winningOutcomes[1] === true is NO
    market.type === "Futarchy" && (winningOutcomes[0] || winningOutcomes[1])
      ? // For futarchy markets return all positions (even if balance = 0) because FutarchyRouter.redeemProposal() uses both.
        winningOutcomes[0]
        ? // positions 0 and 2 are YES tokens
          [winningPositionsWithZero[0], winningPositionsWithZero[2]]
        : // positions 1 and 3 are NO tokens
          [winningPositionsWithZero[1], winningPositionsWithZero[3]]
      : // Generic markets can have winning positions on any outcome, we return only the positions with balance > 0.
        winningPositionsWithZero.filter((position) => position.balance > 0n);

  return {
    // Winning positions (positions with balance > 0 for generic, plus futarchy pair when applicable).
    winningPositions,
    // Indices of winning positions where the user has balance > 0.
    winningOutcomeIndexes: generateWinningOutcomeIndexes(winningPositionsWithZero),
  };
};
