import { queryClient } from "@/lib/query-client";
import { toastifyTx } from "@/lib/toastify";
import { config } from "@/wagmi";
import { useMutation } from "@tanstack/react-query";
import { writeContract } from "@wagmi/core";
import { Address, erc20Abi } from "viem";

interface ApproveTokensProps {
  tokenAddress: Address;
  spender: Address;
  amount: bigint;
}

async function approveTokens(props: ApproveTokensProps): Promise<void> {
  const result = await toastifyTx(
    () =>
      writeContract(config, {
        address: props.tokenAddress,
        abi: erc20Abi,
        functionName: "approve",
        args: [props.spender, props.amount],
      }),
    {
      txSent: { title: "Approving token..." },
      txSuccess: { title: "Token approved." },
    },
  );

  if (!result.status) {
    throw result.status;
  }
}

export const useApproveTokens = () => {
  return useMutation({
    mutationFn: approveTokens,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["useMissingApprovals"] });
    },
  });
};
