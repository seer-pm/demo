import { GnosisRouterAbi } from "@/abi/GnosisRouterAbi";
import { MainnetRouterAbi } from "@/abi/MainnetRouterAbi";
import { RouterAbi } from "@/abi/RouterAbi";
import { EMPTY_PARENT_COLLECTION, generateBasicPartition } from "@/lib/conditional-tokens";
import { RouterTypes } from "@/lib/config";
import { queryClient } from "@/lib/query-client";
import { config } from "@/wagmi";
import { useMutation } from "@tanstack/react-query";
import { readContract, waitForTransactionReceipt, writeContract } from "@wagmi/core";
import { Address, TransactionReceipt, parseUnits } from "viem";
import { erc20Abi } from "viem";

interface SplitPositionProps {
  account: Address;
  router: Address;
  conditionId: `0x${string}`;
  collateralToken: Address;
  collateralDecimals: number;
  outcomeSlotCount: number;
  amount: number;
  isMainCollateral: boolean;
  routerType: RouterTypes;
}

async function splitFromRouter(
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
      functionName: "splitPosition",
      args: [collateralToken, EMPTY_PARENT_COLLECTION, conditionId, partition, amount],
    });
  }

  if (routerType === "mainnet") {
    return await writeContract(config, {
      address: router,
      abi: MainnetRouterAbi,
      functionName: "splitFromDai",
      args: [EMPTY_PARENT_COLLECTION, conditionId, partition, amount],
    });
  }

  return await writeContract(config, {
    address: router,
    abi: GnosisRouterAbi,
    functionName: "splitFromBase",
    args: [EMPTY_PARENT_COLLECTION, conditionId, partition],
    value: amount,
  });
}

async function splitPosition(props: SplitPositionProps): Promise<TransactionReceipt> {
  const allowance = await readContract(config, {
    abi: erc20Abi,
    address: props.collateralToken,
    functionName: "allowance",
    args: [props.account, props.router],
  });

  const parsedAmount = parseUnits(String(props.amount), props.collateralDecimals);

  if (allowance < parsedAmount) {
    const hash = await writeContract(config, {
      address: props.collateralToken,
      abi: erc20Abi,
      functionName: "approve",
      args: [props.router, parsedAmount],
    });

    await waitForTransactionReceipt(config, {
      confirmations: 0,
      hash,
    });
  }

  const hash = await splitFromRouter(
    props.isMainCollateral,
    props.routerType,
    props.router,
    props.collateralToken,
    props.conditionId,
    generateBasicPartition(props.outcomeSlotCount),
    BigInt(parsedAmount),
  );

  const transactionReceipt = await waitForTransactionReceipt(config, {
    confirmations: 0,
    hash,
  });

  return transactionReceipt as TransactionReceipt;
}

export const useSplitPosition = (onSuccess: (data: TransactionReceipt) => unknown) => {
  return useMutation({
    mutationFn: splitPosition,
    onSuccess: (data: TransactionReceipt) => {
      queryClient.invalidateQueries({ queryKey: ["usePositions"] });
      queryClient.invalidateQueries({ queryKey: ["useERC20Balance"] });
      onSuccess(data);
    },
  });
};
