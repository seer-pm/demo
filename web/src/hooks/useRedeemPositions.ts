import { RouterAbi } from "@/abi/RouterAbi";
import { EMPTY_PARENT_COLLECTION } from "@/lib/conditional-tokens";
import { queryClient } from "@/lib/query-client";
import { config } from "@/wagmi";
import { useMutation } from "@tanstack/react-query";
import { simulateContract, waitForTransactionReceipt, writeContract } from "@wagmi/core";
import { Address, TransactionReceipt, erc20Abi } from "viem";
import { fetchERC20Balance } from "./useERC20Balance";

interface RedeemPositionProps {
  account: Address;
  router: Address;
  conditionId: `0x${string}`;
  collateralToken: Address;
  indexSets: bigint[];
}

async function redeemPositions(props: RedeemPositionProps): Promise<TransactionReceipt> {
  for (const indexSet of props.indexSets) {
    const { result: tokenAddress } = await simulateContract(config, {
      abi: RouterAbi,
      address: props.router,
      functionName: "getTokenAddress",
      args: [props.collateralToken, EMPTY_PARENT_COLLECTION, props.conditionId, indexSet],
    });

    const balance = await fetchERC20Balance(tokenAddress, props.account);

    const hash = await writeContract(config, {
      address: tokenAddress,
      abi: erc20Abi,
      functionName: "approve",
      args: [props.router, balance],
    });

    await waitForTransactionReceipt(config, {
      confirmations: 0,
      hash,
    });
  }

  const hash = await writeContract(config, {
    address: props.router,
    abi: RouterAbi,
    functionName: "redeemPositions",
    args: [props.collateralToken, EMPTY_PARENT_COLLECTION, props.conditionId, props.indexSets],
  });

  const transactionReceipt = await waitForTransactionReceipt(config, {
    confirmations: 0,
    hash,
  });

  return transactionReceipt as TransactionReceipt;
}

export const useRedeemPositions = (onSuccess: (data: TransactionReceipt) => unknown) => {
  return useMutation({
    mutationFn: redeemPositions,
    onSuccess: (data: TransactionReceipt) => {
      queryClient.invalidateQueries({ queryKey: ["usePositions"] });
      queryClient.invalidateQueries({ queryKey: ["useERC20Balance"] });
      onSuccess(data);
    },
  });
};
