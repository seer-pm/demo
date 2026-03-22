/**
 * ERC20 approval helpers: fetch needed approvals and build 7702 approval calls.
 */

import type { Config } from "@wagmi/core";
import { readContracts } from "@wagmi/core";
import type { Address } from "viem";
import { encodeFunctionData, erc20Abi } from "viem";
import type { SupportedChain } from "./chains";
import type { Execution } from "./execution";
import { isTwoStringsEqual } from "./quote-utils";
import { NATIVE_TOKEN } from "./tokens";

export interface ApprovalInfo {
  tokenAddress: Address;
  amount: bigint;
}

export async function fetchNeededApprovals(
  config: Config,
  tokensAddresses: Address[],
  account: Address,
  spender: Address,
  amounts: bigint[],
  chainId: SupportedChain,
): Promise<ApprovalInfo[]> {
  if (tokensAddresses.length !== amounts.length) {
    throw new Error("Invalid tokens and amounts lengths");
  }

  if (tokensAddresses.length === 1 && isTwoStringsEqual(tokensAddresses[0], NATIVE_TOKEN)) {
    return [];
  }

  const allowances = await readContracts(config, {
    allowFailure: false,
    contracts: tokensAddresses.map((tokenAddress) => ({
      abi: erc20Abi,
      address: tokenAddress,
      functionName: "allowance",
      args: [account, spender],
      chainId,
    })),
  });

  return tokensAddresses.reduce((acumm, curr, index) => {
    if (BigInt(allowances[index]) < amounts[index]) {
      acumm.push({ tokenAddress: curr, amount: amounts[index] });
    }

    return acumm;
  }, [] as ApprovalInfo[]);
}

export type GetApprovals7702Props = {
  tokensAddresses: Address[];
  account: Address | undefined;
  spender: Address;
  amounts: bigint | bigint[];
  chainId: SupportedChain;
};

export function getApprovals7702({ tokensAddresses, spender, amounts, chainId }: GetApprovals7702Props): Execution[] {
  const calls: Execution[] = [];

  if (!tokensAddresses.length) {
    return calls;
  }

  if (Array.isArray(amounts) && tokensAddresses.length !== amounts.length) {
    throw new Error("Invalid tokens and amounts lengths");
  }

  for (let i = 0; i < tokensAddresses.length; i++) {
    if (isTwoStringsEqual(tokensAddresses[i], NATIVE_TOKEN)) {
      continue;
    }

    const amount = typeof amounts === "bigint" ? amounts : amounts[i];
    calls.push({
      to: tokensAddresses[i],
      value: 0n,
      data: encodeFunctionData({
        abi: erc20Abi,
        functionName: "approve",
        args: [spender, amount],
      }),
      chainId,
    });
  }

  return calls;
}
