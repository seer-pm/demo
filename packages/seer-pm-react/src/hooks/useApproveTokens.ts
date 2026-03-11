import type { TxNotifierFn } from "@seer-pm/sdk";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { writeContract } from "@wagmi/core";
import type { Address } from "viem";
import { erc20Abi } from "viem";
import { useConfig } from "wagmi";

export interface ApproveTokensProps {
  tokenAddress: Address;
  spender: Address;
  amount: bigint;
  chainId: number;
}

export function useApproveTokens(txNotifier: TxNotifierFn) {
  const config = useConfig();
  const queryClient = useQueryClient();

  async function approveTokens(props: ApproveTokensProps): Promise<void> {
    const result = await txNotifier(
      () =>
        writeContract(config, {
          address: props.tokenAddress,
          chainId: props.chainId,
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
      throw result.error;
    }
  }

  return useMutation({
    mutationFn: approveTokens,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["useMissingApprovals"] });
    },
  });
}
