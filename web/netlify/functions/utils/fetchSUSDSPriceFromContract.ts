import { type Address, formatUnits, parseUnits } from "viem";

import { base, optimism } from "@/lib/chains";
import { SupportedChain } from "@seer-pm/sdk";
import { getPublicClientByChainId } from "./config";

const PSM_BY_CHAIN: Partial<Record<SupportedChain, Address>> = {
  [optimism.id]: "0xe0F9978b907853F354d79188A3dEfbD41978af62",
  [base.id]: "0x1601843c5E9bC251A3272907010AFa41Fa18347E",
};

const abi = [
  {
    inputs: [],
    name: "susds",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "usds",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "assetIn", type: "address" },
      { name: "assetOut", type: "address" },
      { name: "amountIn", type: "uint256" },
    ],
    name: "previewSwapExactIn",
    outputs: [{ name: "amountOut", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export async function fetchSUSDSPriceFromContract(chainId: SupportedChain) {
  try {
    const psm = PSM_BY_CHAIN[chainId];

    if (!psm) {
      return 0;
    }

    const client = getPublicClientByChainId(chainId);

    const [susds, usds] = await Promise.all([
      client.readContract({
        address: psm,
        abi,
        functionName: "susds",
      }),
      client.readContract({
        address: psm,
        abi,
        functionName: "usds",
      }),
    ]);

    const amountOut = await client.readContract({
      address: psm,
      abi,
      functionName: "previewSwapExactIn",
      args: [
        susds,
        usds,
        parseUnits("1", 18), // 1 sUSDS
      ],
    });

    return Number(formatUnits(amountOut, 18));
    // biome-ignore lint/suspicious/noExplicitAny:
  } catch (e: any) {
    console.log("get susds price from contract failed", e.message);
    return 0;
  }
}
