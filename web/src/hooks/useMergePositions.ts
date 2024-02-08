import { RouterAbi } from "@/abi/RouterAbi";
import { EMPTY_PARENT_COLLECTION, generateBasicPartition } from "@/lib/conditional-tokens";
import { queryClient } from "@/lib/query-client";
import { config } from "@/wagmi";
import { useMutation } from "@tanstack/react-query";
import { readContract, simulateContract, waitForTransactionReceipt, writeContract } from "@wagmi/core";
import { Address, TransactionReceipt, erc20Abi, parseUnits } from "viem";

interface MergePositionProps {
  account: Address;
  router: Address;
  conditionId: `0x${string}`;
  collateralToken: Address;
  collateralDecimals: number;
  outcomeSlotCount: number;
  amount: number;
}

async function mergePositions(props: MergePositionProps): Promise<TransactionReceipt> {
  const parsedAmount = parseUnits(String(props.amount), props.collateralDecimals);

  const partition = generateBasicPartition(props.outcomeSlotCount);
  for (const indexSet of partition) {
    const { result: tokenAddress } = await simulateContract(config, {
      abi: RouterAbi,
      address: props.router,
      functionName: "getTokenAddress",
      args: [props.collateralToken, EMPTY_PARENT_COLLECTION, props.conditionId, indexSet],
    });

    const allowance = await readContract(config, {
      abi: erc20Abi,
      address: tokenAddress,
      functionName: "allowance",
      args: [props.account, props.router],
    });

    if (allowance < parsedAmount) {
      const hash = await writeContract(config, {
        address: tokenAddress,
        abi: erc20Abi,
        functionName: "approve",
        args: [props.router, parsedAmount],
      });

      await waitForTransactionReceipt(config, {
        confirmations: 0,
        hash,
      });
    }
  }

  const hash = await writeContract(config, {
    address: props.router,
    abi: RouterAbi,
    functionName: "mergePositions",
    args: [props.collateralToken, EMPTY_PARENT_COLLECTION, props.conditionId, partition, parsedAmount],
  });

  const transactionReceipt = await waitForTransactionReceipt(config, {
    confirmations: 0,
    hash,
  });

  return transactionReceipt as TransactionReceipt;
}

export const useMergePositions = (onSuccess: (data: TransactionReceipt) => unknown) => {
  return useMutation({
    mutationFn: mergePositions,
    onSuccess: (data: TransactionReceipt) => {
      queryClient.invalidateQueries({ queryKey: ["usePositions"] });
      queryClient.invalidateQueries({ queryKey: ["useERC20Balance"] });
      onSuccess(data);
    },
  });
};
