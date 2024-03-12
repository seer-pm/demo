import { RouterAbi } from "@/abi/RouterAbi";
import { EMPTY_PARENT_COLLECTION, generateBasicPartition } from "@/lib/conditional-tokens";
import { RouterTypes } from "@/lib/config";
import { queryClient } from "@/lib/query-client";
import { toastifyTx } from "@/lib/toastify";
import { NATIVE_TOKEN } from "@/lib/utils";
import { config } from "@/wagmi";
import { useMutation } from "@tanstack/react-query";
import { readContract, writeContract } from "@wagmi/core";
import { Address, TransactionReceipt, parseUnits } from "viem";
import { erc20Abi } from "viem";
import { writeGnosisRouterSplitFromBase, writeMainnetRouterSplitFromDai } from "./contracts/generated";

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
    return await writeMainnetRouterSplitFromDai(config, {
      args: [EMPTY_PARENT_COLLECTION, conditionId, partition, amount],
    });
  }

  return await writeGnosisRouterSplitFromBase(config, {
    args: [EMPTY_PARENT_COLLECTION, conditionId, partition],
    value: amount,
  });
}

async function splitPosition(props: SplitPositionProps): Promise<TransactionReceipt> {
  const parsedAmount = parseUnits(String(props.amount), props.collateralDecimals);

  if (props.collateralToken !== NATIVE_TOKEN) {
    const allowance = await readContract(config, {
      abi: erc20Abi,
      address: props.collateralToken,
      functionName: "allowance",
      args: [props.account, props.router],
    });

    if (allowance < parsedAmount) {
      const result = await toastifyTx(
        () =>
          writeContract(config, {
            address: props.collateralToken,
            abi: erc20Abi,
            functionName: "approve",
            args: [props.router, parsedAmount],
          }),
        { txSent: { title: "Approving tokens..." }, txSuccess: { title: "Tokens approved." } },
      );

      if (!result.status) {
        throw result.error;
      }
    }
  }

  const result = await toastifyTx(
    () =>
      splitFromRouter(
        props.isMainCollateral,
        props.routerType,
        props.router,
        props.collateralToken,
        props.conditionId,
        generateBasicPartition(props.outcomeSlotCount),
        BigInt(parsedAmount),
      ),
    { txSent: { title: "Minting tokens..." }, txSuccess: { title: "Tokens minted!" } },
  );

  if (!result.status) {
    throw result.error;
  }

  return result.receipt;
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
