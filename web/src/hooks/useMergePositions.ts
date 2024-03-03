import { RouterAbi } from "@/abi/RouterAbi";
import { EMPTY_PARENT_COLLECTION, generateBasicPartition } from "@/lib/conditional-tokens";
import { RouterTypes } from "@/lib/config";
import { queryClient } from "@/lib/query-client";
import { config } from "@/wagmi";
import { useMutation } from "@tanstack/react-query";
import { readContract, waitForTransactionReceipt, writeContract } from "@wagmi/core";
import { Address, TransactionReceipt, erc20Abi, parseUnits } from "viem";
import { writeGnosisRouterMergeToBase, writeMainnetRouterMergeToDai } from "./contracts/generated";

interface MergePositionProps {
  account: Address;
  router: Address;
  conditionId: `0x${string}`;
  mainCollateralToken: Address;
  collateralToken: Address;
  collateralDecimals: number;
  outcomeSlotCount: number;
  amount: number;
  isMainCollateral: boolean;
  routerType: RouterTypes;
}

async function mergeFromRouter(
  isMainCollateral: boolean,
  routerType: RouterTypes,
  router: Address,
  collateralToken: Address,
  conditionId: `0x${string}`,
  partition: bigint[],
  amount: bigint,
) {
  if (isMainCollateral) {
    return await writeContract(config, {
      address: router,
      abi: RouterAbi,
      functionName: "mergePositions",
      args: [collateralToken, EMPTY_PARENT_COLLECTION, conditionId, partition, amount],
    });
  }

  if (routerType === "mainnet") {
    return await writeMainnetRouterMergeToDai(config, {
      args: [EMPTY_PARENT_COLLECTION, conditionId, partition, amount],
    });
  }

  return await writeGnosisRouterMergeToBase(config, {
    args: [EMPTY_PARENT_COLLECTION, conditionId, partition, amount],
  });
}

async function mergePositions(props: MergePositionProps): Promise<TransactionReceipt> {
  const parsedAmount = parseUnits(String(props.amount), props.collateralDecimals);

  const partition = generateBasicPartition(props.outcomeSlotCount);
  for (const indexSet of partition) {
    const tokenAddress = await readContract(config, {
      abi: RouterAbi,
      address: props.router,
      functionName: "getTokenAddress",
      args: [props.mainCollateralToken, EMPTY_PARENT_COLLECTION, props.conditionId, indexSet],
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
        hash,
      });
    }
  }

  const hash = await mergeFromRouter(
    props.isMainCollateral,
    props.routerType,
    props.router,
    props.collateralToken,
    props.conditionId,
    generateBasicPartition(props.outcomeSlotCount),
    BigInt(parsedAmount),
  );

  const transactionReceipt = await waitForTransactionReceipt(config, {
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
