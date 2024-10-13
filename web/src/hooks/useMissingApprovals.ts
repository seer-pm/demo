import { SupportedChain } from "@/lib/chains";
import { config } from "@/wagmi";
import { useQuery } from "@tanstack/react-query";
import { readContracts } from "@wagmi/core";
import { Address, erc20Abi } from "viem";
import { useAccount } from "wagmi";
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
): Promise<ApprovalInfo[]> {
  if (tokensAddresses.length !== amounts.length) {
    throw new Error("Invalid tokens and amounts lengths");
  }

  const allowances = await readContracts(config, {
    allowFailure: false,
    contracts: tokensAddresses.map((tokenAddress) => ({
      abi: erc20Abi,
      address: tokenAddress,
      functionName: "allowance",
      args: [account, spender],
    })),
  });

  return tokensAddresses.reduce((acumm, curr, index) => {
    if (BigInt(allowances[index]) < amounts[index]) {
      acumm.push({ tokenAddress: curr, amount: amounts[index] });
    }

    return acumm;
  }, [] as ApprovalInfo[]);
}

interface UseMissingApprovalsReturn {
  address: Address;
  name: string;
  spender: Address;
  amount: bigint;
}

export const useMissingApprovals = (
  tokensAddresses: Address[],
  account: Address | undefined,
  spender: Address,
  amounts: bigint | bigint[],
) => {
  const { chainId } = useAccount();
  let approvalAmounts: bigint[];
  if (typeof amounts === "bigint") {
    // approve the same amount for every token
    approvalAmounts = new Array(tokensAddresses.length).fill(amounts);
  } else {
    approvalAmounts = amounts;
  }

  return useQuery<UseMissingApprovalsReturn[] | undefined, Error>({
    enabled: tokensAddresses.length > 0 && !!account && !!chainId,
    queryKey: ["useMissingApprovals", tokensAddresses, account, spender, approvalAmounts.map((a) => a.toString())],
    queryFn: async () => {
      const missingApprovals = await fetchNeededApprovals(tokensAddresses, account!, spender, approvalAmounts);
      const tokensInfo = await Promise.all(
        missingApprovals.map((missingApproval) =>
          getTokenInfo(missingApproval.tokenAddress, chainId! as SupportedChain),
        ),
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
