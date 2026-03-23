import type { GetApprovals7702Props } from "@seer-pm/sdk";
import { fetchNeededApprovals, getTokenInfo } from "@seer-pm/sdk";
import { useQuery } from "@tanstack/react-query";
import type { Address } from "viem";
import { useClient } from "wagmi";

export type UseMissingApprovalsProps = GetApprovals7702Props;

export interface UseMissingApprovalsReturn {
  address: Address;
  name: string;
  spender: Address;
  amount: bigint;
}

export function useMissingApprovals(props: UseMissingApprovalsProps | undefined) {
  const client = useClient({ chainId: props?.chainId });

  let approvalAmounts: bigint[] = [];
  if (!props) {
    // nothing
  } else if (typeof props.amounts === "bigint") {
    approvalAmounts = new Array(props.tokensAddresses.length).fill(props.amounts);
  } else {
    approvalAmounts = props.amounts;
  }

  return useQuery<UseMissingApprovalsReturn[] | undefined, Error>({
    enabled: Boolean(client && props?.tokensAddresses.length && props?.account),
    queryKey: [
      "useMissingApprovals",
      props?.tokensAddresses,
      props?.account,
      props?.spender,
      props?.chainId,
      approvalAmounts.map((a) => a.toString()),
    ],
    queryFn: async () => {
      const { tokensAddresses, account, spender, chainId } = props!;
      const missingApprovals = await fetchNeededApprovals(client!, tokensAddresses, account!, spender, approvalAmounts);
      const tokensInfo = await Promise.all(
        missingApprovals.map((missingApproval) => getTokenInfo(missingApproval.tokenAddress, chainId, client!)),
      );

      return missingApprovals.map((missingApproval, i) => ({
        address: missingApproval.tokenAddress,
        name: tokensInfo[i].name,
        spender: spender,
        amount: missingApproval.amount,
      }));
    },
  });
}
