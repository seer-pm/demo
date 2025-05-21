import { SupportedChain } from "@/lib/chains";
import { NATIVE_TOKEN, isTwoStringsEqual } from "@/lib/utils";
import { config } from "@/wagmi";
import { useQuery } from "@tanstack/react-query";
import { readContracts } from "@wagmi/core";
import { Address, encodeFunctionData, erc20Abi } from "viem";
import { Execution } from "./useCheck7702Support";
import { getTokenInfo } from "./useTokenInfo";

interface ApprovalInfo {
  tokenAddress: Address;
  amount: bigint;
}

export async function fetchNeededApprovals(
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

export type UseMissingApprovalsProps = {
  tokensAddresses: Address[];
  account: Address | undefined;
  spender: Address;
  amounts: bigint | bigint[];
  chainId: SupportedChain;
};

interface UseMissingApprovalsReturn {
  address: Address;
  name: string;
  spender: Address;
  amount: bigint;
}

export const useMissingApprovals = ({
  tokensAddresses,
  account,
  spender,
  amounts,
  chainId,
}: UseMissingApprovalsProps) => {
  let approvalAmounts: bigint[];
  if (typeof amounts === "bigint") {
    // approve the same amount for every token
    approvalAmounts = new Array(tokensAddresses.length).fill(amounts);
  } else {
    approvalAmounts = amounts;
  }

  return useQuery<UseMissingApprovalsReturn[] | undefined, Error>({
    enabled: tokensAddresses.length > 0 && !!account,
    queryKey: ["useMissingApprovals", tokensAddresses, account, spender, approvalAmounts.map((a) => a.toString())],
    queryFn: async () => {
      const missingApprovals = await fetchNeededApprovals(tokensAddresses, account!, spender, approvalAmounts, chainId);
      const tokensInfo = await Promise.all(
        missingApprovals.map((missingApproval) => getTokenInfo(missingApproval.tokenAddress, chainId)),
      );

      return missingApprovals.map((missingApproval, i) => ({
        address: missingApproval.tokenAddress,
        name: tokensInfo[i].name,
        spender: spender,
        amount: missingApproval.amount,
      }));
    },
  });
};

export function getApprovals7702({ tokensAddresses, spender, amounts }: UseMissingApprovalsProps) {
  const calls: Execution[] = [];

  for (let i = 0; i < tokensAddresses.length; i++) {
    const amount = typeof amounts === "bigint" ? amounts : amounts[i];
    calls.push({
      to: tokensAddresses[i],
      value: 0n,
      data: encodeFunctionData({
        abi: erc20Abi,
        functionName: "approve",
        args: [spender, amount],
      }),
    });
  }

  return calls;
}
