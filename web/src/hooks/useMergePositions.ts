import { RouterAbi } from "@/abi/RouterAbi";
import { EMPTY_PARENT_COLLECTION, generateBasicPartition } from "@/lib/conditional-tokens";
import { RouterTypes } from "@/lib/config";
import { queryClient } from "@/lib/query-client";
import { toastifyTx } from "@/lib/toastify";
import { config } from "@/wagmi";
import { useMutation } from "@tanstack/react-query";
import { writeContract } from "@wagmi/core";
import { Address, TransactionReceipt } from "viem";
import { writeGnosisRouterMergeToBase, writeMainnetRouterMergeToDai } from "./contracts/generated";

interface MergePositionProps {
  router: Address;
  conditionId: `0x${string}`;
  collateralToken: Address;
  outcomeSlotCount: number;
  amount: bigint;
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
  const result = await toastifyTx(
    () =>
      mergeFromRouter(
        props.isMainCollateral,
        props.routerType,
        props.router,
        props.collateralToken,
        props.conditionId,
        generateBasicPartition(props.outcomeSlotCount),
        props.amount,
      ),
    { txSent: { title: "Merging tokens..." }, txSuccess: { title: "Tokens merged!" } },
  );

  if (!result.status) {
    throw result.status;
  }

  return result.receipt;
}

export const useMergePositions = (onSuccess: (data: TransactionReceipt) => unknown) => {
  return useMutation({
    mutationFn: mergePositions,
    onSuccess: (data: TransactionReceipt) => {
      queryClient.invalidateQueries({ queryKey: ["useUserPositions"] });
      queryClient.invalidateQueries({ queryKey: ["useTokenBalance"] });
      onSuccess(data);
    },
  });
};
