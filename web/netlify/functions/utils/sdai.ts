import type { SupportedChain } from "@seer-pm/sdk";
import { COLLATERAL_TOKENS } from "@seer-pm/sdk";
import { readContract } from "viem/actions";
import { getPublicClientByChainId } from "./config";

const SDAI_ABI = [
  {
    inputs: [
      {
        internalType: "uint256",
        name: "shares",
        type: "uint256",
      },
    ],
    name: "convertToAssets",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

export async function convertFromSDAI(chainId: SupportedChain, amount: bigint) {
  const publicClient = getPublicClientByChainId(chainId);
  return readContract(publicClient, {
    address: COLLATERAL_TOKENS[chainId].primary.address as `0x${string}`,
    abi: SDAI_ABI,
    functionName: "convertToAssets",
    args: [amount],
  });
}
