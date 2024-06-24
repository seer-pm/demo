import { ethers } from "hardhat";

export function getBitMaskDecimal(
  selectedOutcomes: number[],
  numOutcomes: number
) {
  let answer = 0;
  for (let i = 0; i < numOutcomes; i++) {
    if (selectedOutcomes.includes(i)) {
      answer |= 1 << i;
    }
  }
  return answer;
}

export function tokenMetadataToBytes(
  name: string,
  symbol: string,
  decimals: number
) {
  // Convert name and symbol to bytes and pad to 32 bytes each
  const nameBytes = ethers.encodeBytes32String(name);
  const symbolBytes = ethers.encodeBytes32String(symbol);

  // Convert decimal to a single byte
  const decimalByte = ethers.hexlify(new Uint8Array([decimals]));

  // Concatenate the byte strings
  const result = ethers.concat([nameBytes, symbolBytes, decimalByte]);

  return result;
}

export function getConditionId(
  oracle: string,
  questionId: Uint8Array,
  outcomeSlotCount: number
) {
  return ethers.keccak256(
    ethers.solidityPacked(
      ["address", "bytes32", "uint"],
      [oracle, questionId, outcomeSlotCount]
    )
  );
}
