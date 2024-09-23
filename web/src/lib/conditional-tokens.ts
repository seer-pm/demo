import { Position } from "@/hooks/useMarketPositions";
import { Address, encodePacked, hexToBigInt, keccak256 } from "viem";

export function generateBasicPartition(outcomeSlotCount: number) {
  const partition = [];
  for (let i = 0; i < outcomeSlotCount; i++) {
    partition[i] = BigInt(1 << i);
  }
  return partition;
}

export function generateWinningOutcomeIndexes(winningPositions: Position[]) {
  const outcomeIndexes = [];
  for (let i = 0; i < winningPositions.length; i++) {
    if (winningPositions[i].balance > 0n) {
      outcomeIndexes.push(BigInt(i));
    }
  }
  return outcomeIndexes;
}

export function getPositionId(collateralToken: Address, collectionId: `0x${string}`) {
  return hexToBigInt(keccak256(encodePacked(["address", "bytes32"], [collateralToken, collectionId])));
}
