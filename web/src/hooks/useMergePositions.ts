import { RouterAbi } from "@/abi/RouterAbi";
import { EMPTY_PARENT_COLLECTION, generateBasicPartition } from "@/lib/conditional-tokens";
import { RouterTypes } from "@/lib/config";
import { queryClient } from "@/lib/query-client";
import { toastifyTx } from "@/lib/toastify";
import { config } from "@/wagmi";
import { useMutation } from "@tanstack/react-query";
import { readContract, writeContract } from "@wagmi/core";
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
  let n = 1;
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
      const result = await toastifyTx(
        () =>
          writeContract(config, {
            address: tokenAddress,
            abi: erc20Abi,
            functionName: "approve",
            args: [props.router, parsedAmount],
          }),
        {
          txSent: { title: `Approving outcome token #${n}...` },
          txSuccess: { title: `Outcome token #${n} approved.` },
        },
      );

      if (!result.status) {
        throw result.status;
      }
    }

    n++;
  }

  const result = await toastifyTx(
    () =>
      mergeFromRouter(
        props.isMainCollateral,
        props.routerType,
        props.router,
        props.collateralToken,
        props.conditionId,
        generateBasicPartition(props.outcomeSlotCount),
        BigInt(parsedAmount),
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
      queryClient.invalidateQueries({ queryKey: ["usePositions"] });
      queryClient.invalidateQueries({ queryKey: ["useERC20Balance"] });
      onSuccess(data);
    },
  });
};
