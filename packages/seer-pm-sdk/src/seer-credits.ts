import type { Address } from "viem";

import { seerCreditsAddress } from "../generated/contracts/trading-credits";

export function isSeerCredits(chainId: number, tokenAddress: Address) {
  const addressForChain = (seerCreditsAddress as Record<number, string>)[chainId];

  if (!addressForChain) {
    return false;
  }

  return tokenAddress.toLowerCase() === addressForChain.toLowerCase();
}
