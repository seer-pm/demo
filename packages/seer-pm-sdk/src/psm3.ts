import type { Address, PublicClient } from "viem";
import { encodeFunctionData } from "viem";
import { readContract } from "viem/actions";
import { base, optimism } from "viem/chains";
import { getActiveCollateralProfile } from "./collateral";
import type { Execution } from "./execution";
import { PSM3_ABI, PSM3_REFERRAL_CODE } from "./psm3-abi";
import { isTwoStringsEqual } from "./quote-utils";

/** PSM3 contract for sUSDS <-> USDC/USDS on Optimism and Base */
export const PSM3_ADDRESS: Partial<Record<number, Address>> = {
  [optimism.id]: "0xe0F9978b907853F354d79188A3dEfbD41978af62",
  [base.id]: "0x1601843c5E9bC251A3272907010AFa41Fa18347E",
};

export { PSM3_ABI, PSM3_REFERRAL_CODE };

export function getPsm3Address(chainId: number): Address {
  const address = PSM3_ADDRESS[chainId];
  if (!address) {
    throw new Error(`PSM3 not available on chain ${chainId}`);
  }
  return address;
}

export function isPsm3SwapToken(chainId: number, tokenAddress: Address): boolean {
  const swapTokens = getActiveCollateralProfile(chainId).swap;
  if (!swapTokens?.length) {
    return false;
  }
  return swapTokens.some((token) => isTwoStringsEqual(token.address, tokenAddress));
}

export function applySlippageToleranceDown(amount: bigint, maxSlippagePercent: string): bigint {
  const bps = BigInt(Math.round(Number(maxSlippagePercent) * 100));
  return (amount * (10000n - bps)) / 10000n;
}

export function applySlippageToleranceUp(amount: bigint, maxSlippagePercent: string): bigint {
  const bps = BigInt(Math.round(Number(maxSlippagePercent) * 100));
  return (amount * (10000n + bps)) / 10000n;
}

export async function previewPsm3SwapExactIn(
  client: PublicClient,
  chainId: number,
  assetIn: Address,
  assetOut: Address,
  amountIn: bigint,
): Promise<bigint> {
  return readContract(client, {
    address: getPsm3Address(chainId),
    abi: PSM3_ABI,
    functionName: "previewSwapExactIn",
    args: [assetIn, assetOut, amountIn],
  });
}

export async function previewPsm3SwapExactOut(
  client: PublicClient,
  chainId: number,
  assetIn: Address,
  assetOut: Address,
  amountOut: bigint,
): Promise<bigint> {
  return readContract(client, {
    address: getPsm3Address(chainId),
    abi: PSM3_ABI,
    functionName: "previewSwapExactOut",
    args: [assetIn, assetOut, amountOut],
  });
}

export type BuildPsm3SwapParams = {
  chainId: number;
  assetIn: Address;
  assetOut: Address;
  receiver: Address;
};

export type BuildPsm3SwapExactInParams = BuildPsm3SwapParams & {
  amountIn: bigint;
  minAmountOut: bigint;
};

export type BuildPsm3SwapExactOutParams = BuildPsm3SwapParams & {
  amountOut: bigint;
  maxAmountIn: bigint;
};

export function buildPsm3SwapExactInExecution(params: BuildPsm3SwapExactInParams): Execution {
  const psm3Address = getPsm3Address(params.chainId);
  return {
    to: psm3Address,
    value: 0n,
    data: encodeFunctionData({
      abi: PSM3_ABI,
      functionName: "swapExactIn",
      args: [
        params.assetIn,
        params.assetOut,
        params.amountIn,
        params.minAmountOut,
        params.receiver,
        PSM3_REFERRAL_CODE,
      ],
    }),
    chainId: params.chainId,
  };
}

export function buildPsm3SwapExactOutExecution(params: BuildPsm3SwapExactOutParams): Execution {
  const psm3Address = getPsm3Address(params.chainId);
  return {
    to: psm3Address,
    value: 0n,
    data: encodeFunctionData({
      abi: PSM3_ABI,
      functionName: "swapExactOut",
      args: [
        params.assetIn,
        params.assetOut,
        params.amountOut,
        params.maxAmountIn,
        params.receiver,
        PSM3_REFERRAL_CODE,
      ],
    }),
    chainId: params.chainId,
  };
}

export function buildPsm3SwapExecution(
  leg: {
    tradeType: "exactIn" | "exactOut";
    assetIn: Address;
    assetOut: Address;
    amountIn: bigint;
    amountOut: bigint;
    limitAmount: bigint;
  },
  chainId: number,
  receiver: Address,
): Execution {
  if (leg.tradeType === "exactIn") {
    return buildPsm3SwapExactInExecution({
      chainId,
      assetIn: leg.assetIn,
      assetOut: leg.assetOut,
      amountIn: leg.amountIn,
      minAmountOut: leg.limitAmount,
      receiver,
    });
  }
  return buildPsm3SwapExactOutExecution({
    chainId,
    assetIn: leg.assetIn,
    assetOut: leg.assetOut,
    amountOut: leg.amountOut,
    maxAmountIn: leg.limitAmount,
    receiver,
  });
}
