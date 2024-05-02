import { config } from "@/wagmi";
import { useQuery } from "@tanstack/react-query";
import { readContracts } from "@wagmi/core";
import { Address, erc20Abi } from "viem";

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

export const useMissingApprovals = (
  tokensAddresses: Address[],
  account: Address | undefined,
  router: Address,
  parsedAmount: bigint,
) => {
  return useQuery<Address[] | undefined, Error>({
    enabled: tokensAddresses.length > 0 && !!account,
    queryKey: ["useMissingApprovals", tokensAddresses, account, router, parsedAmount.toString()],
    queryFn: async () => {
      return fetchNeededApprovals(tokensAddresses, account!, router, parsedAmount);
    },
  });
};
