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

export function generateWords(wordCount: number, wordLength: number) {
  const alphabet = "abcdefghijklmnopqrstuvwxyz";
  const result = [];

  for (let i = 0; i < wordCount; i++) {
    let word = "";
    for (let j = 0; j < wordLength; j++) {
      const randomIndex = Math.floor(Math.random() * alphabet.length);
      word += alphabet[randomIndex];
    }
    result.push(word);
  }

  return result;
}

export function generateSentences(sentenceCount: number, wordCount: number) {
  const sentences = [];
  const wordLength = 5;
  for (let i = 0; i < sentenceCount; i++) {
    const words = generateWords(wordCount, wordLength);
    const sentence = words.join(" ") + " .";
    sentences.push(sentence);
  }

  return sentences;
}

export function getQuestionId(questionsIds: string[], outcomeSlotCount: number, templateId: number, lowerBound: number, upperBound: number) {
  return ethers.keccak256(
    ethers.AbiCoder.defaultAbiCoder().encode(
      ['bytes32[]', 'uint256', 'uint256', 'uint256', 'uint256'],
      [questionsIds, outcomeSlotCount, templateId, lowerBound, upperBound]
    )
  );
}

export function getRedeemAmounts(size: number, amount: bigint): bigint[] {
  const amounts =[];

  for (let i = 0; i < size; i++) {
      amounts[i] = amount;
  }

  return amounts;
}