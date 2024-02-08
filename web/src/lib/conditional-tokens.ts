import { Position } from "@/hooks/usePositions";
import { Address, encodePacked, hexToBigInt, keccak256, stringToHex } from "viem";

export const EMPTY_PARENT_COLLECTION = stringToHex("", { size: 32 });

export function generateBasicPartition(outcomeSlotCount: number) {
  const partition = [];
  for (let i = 0; i < outcomeSlotCount; i++) {
    partition[i] = BigInt(1 << i);
  }
  return partition;
}

export function generateWinningIndexSet(winningPositions: Position[]) {
  const indexSet = [];
  for (let i = 0; i < winningPositions.length; i++) {
    if (winningPositions[i].balance > 0n) {
      indexSet.push(BigInt(1 << i));
    }
  }
  return indexSet;
}

export function getPositionId(collateralToken: Address, collectionId: `0x${string}`) {
  return hexToBigInt(keccak256(encodePacked(["address", "bytes32"], [collateralToken, collectionId])));
}
