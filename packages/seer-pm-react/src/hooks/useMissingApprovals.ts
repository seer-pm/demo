import type { GetApprovals7702Props, SupportedChain } from "@seer-pm/sdk";
import { fetchNeededApprovals, getTokensInfo } from "@seer-pm/sdk";
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
      const tokensInfo = await getTokensInfo(
        missingApprovals.map((missingApproval) => missingApproval.tokenAddress),
        chainId,
        client!,
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

export interface ApprovalRequest {
  tokenAddress: Address;
  spender: Address;
  amount: bigint;
}

/**
 * Missing approvals for any number of token / spender pairs in one query. Composite routes
 * (complete-set legs, PSM3) approve several tokens to several spenders, and a route with one leg
 * per outcome has no fixed count to give a hook per pair.
 */
export function useMissingApprovalsList(
  requests: ApprovalRequest[],
  account: Address | undefined,
  chainId: number | undefined,
) {
  const client = useClient({ chainId });

  return useQuery<UseMissingApprovalsReturn[] | undefined, Error>({
    enabled: Boolean(client && requests.length && account && chainId),
    queryKey: [
      "useMissingApprovals",
      "list",
      account,
      chainId,
      requests.map((request) => [request.tokenAddress, request.spender, request.amount.toString()]),
    ],
    queryFn: async () => {
      const bySpender = new Map<Address, ApprovalRequest[]>();
      for (const request of requests) {
        bySpender.set(request.spender, [...(bySpender.get(request.spender) ?? []), request]);
      }

      const missing: UseMissingApprovalsReturn[] = [];
      for (const [spender, group] of bySpender) {
        const needed = await fetchNeededApprovals(
          client!,
          group.map((request) => request.tokenAddress),
          account!,
          spender,
          group.map((request) => request.amount),
        );
        missing.push(
          ...needed.map((approval) => ({ address: approval.tokenAddress, name: "", spender, amount: approval.amount })),
        );
      }

      const tokensInfo = await getTokensInfo(
        missing.map((approval) => approval.address),
        chainId as SupportedChain,
        client!,
      );

      return missing.map((approval, i) => ({ ...approval, name: tokensInfo[i].name }));
    },
  });
}
