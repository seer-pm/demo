import type { Address } from "viem";
import { encodePacked, hexToBigInt, keccak256 } from "viem";

export type Position = { balance: bigint };

export function generateBasicPartition(outcomeSlotCount: number): bigint[] {
  const partition: bigint[] = [];
  for (let i = 0; i < outcomeSlotCount; i += 1) {
    partition[i] = BigInt(1 << i);
  }
  return partition;
}

export function generateWinningOutcomeIndexes(winningPositions: Position[]): bigint[] {
  const outcomeIndexes: bigint[] = [];
  for (let i = 0; i < winningPositions.length; i += 1) {
    if (winningPositions[i].balance > 0n) {
      outcomeIndexes.push(BigInt(i));
    }
  }
  return outcomeIndexes;
}

export function getPositionId(collateralToken: Address, collectionId: `0x${string}`): bigint {
  return hexToBigInt(keccak256(encodePacked(["address", "bytes32"], [collateralToken, collectionId])));
}
