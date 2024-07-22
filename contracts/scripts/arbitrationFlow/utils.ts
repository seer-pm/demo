import { ethers } from "hardhat";

export function createSignaturesBytesBlob(signatures: string[]) {
  if (signatures.length === 0) {
    throw new Error("At least one signature is required");
  }

  // Arrays to hold separated v, r, and s values
  const vValues = [];
  const rValues = [];
  const sValues = [];

  // Process each signature
  for (let signature of signatures) {
    // Extract v, r, and s
    const { r, v, s } = ethers.Signature.from(signature);
    vValues.push(ethers.hexlify(new Uint8Array([v])));
    rValues.push(r);
    sValues.push(s);
  }

  return ethers.concat([ethers.hexlify(new Uint8Array([signatures.length])), ...vValues, ...rValues, ...sValues]);
}

export const FOREIGN_PROXY = "0x2F0895732bfacdCF2fdB19962fE609D0dA695F21";
export const FOREIGN_AMB_PROXY = "0x4C36d2919e407f0Cc2Ee3c993ccF8ac26d9CE64e";
export const FOREIGN_AMB = "0x82B67a43b69914E611710C62e629dAbB2f7AC6AB";
//event UserRequestForAffirmation(bytes32 indexed messageId, bytes encodedData);
export const HOME_PROXY = "0x29F39dE98D750eb77b5FAfb31B2837f079FcE222";
export const HOME_AMB_PROXY = "0x75Df5AF045d91108662D8080fD1FEFAd6aA0bb59";
export const HOME_AMB = "0x525127C1F5670cc102B26905DcCF8245C05c164f";
//event UserRequestForSignature(bytes32 indexed messageId, bytes encodedData);
export const ARBITRATOR = "0x988b3A538b618C7A603e1c11Ab82Cd16dbE28069";
export const REALITIO = "0xE78996A233895bE74a66F451f1019cA9734205cc";
export const homeValidatorList = [
  "0x456c255A8BC1F33778603A2a48Eb6B0C69F4d48E",
  "0x3e0A20099626F3d4d4Ea7B0cE0330e88d1Fe65D6",
  "0xfA98B60E02A61B6590f073cAD56e68326652d094",
  "0x674c97db4cE6caC04A124d745979f3E4cBa0E9f0",
];
export const FOREIGN_VALIDATOR_CONTRACT_OWNER = "0x42F38ec5A75acCEc50054671233dfAC9C0E7A3F6";
export const FOREIGN_VALIDATOR_IMPLEMENTATION = "0xD83893F31AA1B6B9D97C9c70D3492fe38D24d218";
export const FOREIGN_VALIDATOR_PROXY = "0xed84a648b3c51432ad0fD1C2cD2C45677E9d4064";
export const homeProvider = new ethers.JsonRpcProvider("http://127.0.0.1:8546/");
export const foreignProvider = new ethers.JsonRpcProvider("http://127.0.0.1:8545/");
