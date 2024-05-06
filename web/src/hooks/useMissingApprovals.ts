import { config } from "@/wagmi";
import { useQuery } from "@tanstack/react-query";
import { readContracts } from "@wagmi/core";
import { Address, erc20Abi } from "viem";
import { getTokenInfo } from "./useTokenInfo";

async function fetchNeededApprovals(
  tokensAddresses: Address[],
  account: Address,
  router: Address,
  parsedAmount: bigint,
) {
  const allowances = await readContracts(config, {
    allowFailure: false,
    contracts: tokensAddresses.map((tokenAddress) => ({
      abi: erc20Abi,
      address: tokenAddress,
      functionName: "allowance",
      args: [account, router],
    })),
  });

  return tokensAddresses.reduce((acumm, curr, index) => {
    if (BigInt(allowances[index]) < parsedAmount) {
      acumm.push(curr);
    }

    return acumm;
  }, [] as Address[]);
}

interface UseMissingApprovalsReturn {
  address: Address;
  name: string;
}

export const useMissingApprovals = (
  tokensAddresses: Address[],
  account: Address | undefined,
  router: Address,
  parsedAmount: bigint,
) => {
  return useQuery<UseMissingApprovalsReturn[] | undefined, Error>({
    enabled: tokensAddresses.length > 0 && !!account,
    queryKey: ["useMissingApprovals", tokensAddresses, account, router, parsedAmount.toString()],
    queryFn: async () => {
      const missingApprovals = await fetchNeededApprovals(tokensAddresses, account!, router, parsedAmount);
      const tokensInfo = await Promise.all(missingApprovals.map((token) => getTokenInfo(token)));

      return missingApprovals.map((token, i) => ({ address: token, name: tokensInfo[i].name }));
    },
  });
};
