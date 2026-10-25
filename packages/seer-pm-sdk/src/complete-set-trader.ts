/**
 * CompleteSetTrader: the contract that runs a complete-set route (split or merge plus every AMM
 * leg) in one transaction. Its ABI lives here rather than in `generated/` because the SDK has to
 * build calls for it before the deployment JSON exists on every chain.
 */

import type { Address } from "viem";
import { parseAbi } from "viem";
import type { SupportedChains } from "./chains";

export const completeSetTraderAbi = parseAbi([
  "struct Swap { address target; bytes data; }",
  "function mintAndSell(address collateral, address market, uint256 splitAmount, address[] heldTokens, uint256[] heldAmounts, address[] soldTokens, Swap[] swaps)",
  "function buyAndMerge(address collateral, address market, uint256 mergeAmount, uint256 maxCollateralIn, address[] heldTokens, uint256[] heldAmounts, Swap[] swaps)",
  "function allowedTargets(address target) view returns (bool)",
  "function router() view returns (address)",
  "event MintAndSell(address indexed user, address indexed market, uint256 splitAmount)",
  "event BuyAndMerge(address indexed user, address indexed market, uint256 mergeAmount)",
]);

/** Deployed traders, from `contracts/deployments/<chain>/CompleteSetTrader.json`. */
export const completeSetTraderAddress: SupportedChains<Address> = {};

export function getCompleteSetTraderAddress(chainId: number): Address {
  const address = completeSetTraderAddress[chainId as keyof typeof completeSetTraderAddress];
  if (!address) {
    throw new Error(`CompleteSetTrader is not deployed on chain ${chainId}`);
  }
  return address;
}
