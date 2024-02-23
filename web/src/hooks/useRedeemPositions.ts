import { GnosisRouterAbi } from "@/abi/GnosisRouterAbi";
import { MainnetRouterAbi } from "@/abi/MainnetRouterAbi";
import { RouterAbi } from "@/abi/RouterAbi";
import { EMPTY_PARENT_COLLECTION } from "@/lib/conditional-tokens";
import { RouterTypes } from "@/lib/config";
import { queryClient } from "@/lib/query-client";
import { config } from "@/wagmi";
import { useMutation } from "@tanstack/react-query";
import { readContract, waitForTransactionReceipt, writeContract } from "@wagmi/core";
import { Address, TransactionReceipt, erc20Abi } from "viem";
import { fetchTokenBalance } from "./useTokenBalance";

interface RedeemPositionProps {
  account: Address;
  router: Address;
  conditionId: `0x${string}`;
  collateralToken: Address;
  indexSets: bigint[];
  isMainCollateral: boolean;
  routerType: RouterTypes;
}

async function redeemFromRouter(
  isMainCollateral: boolean,
  routerType: RouterTypes,
  router: Address,
  collateralToken: Address,
  conditionId: `0x${string}`,
  indexSets: bigint[],
) {
  if (isMainCollateral) {
    return await writeContract(config, {
      address: router,
      abi: RouterAbi,
      functionName: "redeemPositions",
      args: [collateralToken, EMPTY_PARENT_COLLECTION, conditionId, indexSets],
    });
  }

  if (routerType === "mainnet") {
    return await writeContract(config, {
      address: router,
      abi: MainnetRouterAbi,
      functionName: "redeemToDai",
      args: [EMPTY_PARENT_COLLECTION, conditionId, indexSets],
    });
  }

  return await writeContract(config, {
    address: router,
    abi: GnosisRouterAbi,
    functionName: "redeemToBase",
    args: [EMPTY_PARENT_COLLECTION, conditionId, indexSets],
  });
}

async function redeemPositions(props: RedeemPositionProps): Promise<TransactionReceipt> {
  for (const indexSet of props.indexSets) {
    const tokenAddress = await readContract(config, {
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

    const balance = await fetchTokenBalance(tokenAddress, props.account);

    if (allowance < balance) {
      const hash = await writeContract(config, {
        address: tokenAddress,
        abi: erc20Abi,
        functionName: "approve",
        args: [props.router, balance],
      });

      await waitForTransactionReceipt(config, {
        hash,
      });
    }
  }

  const hash = await redeemFromRouter(
    props.isMainCollateral,
    props.routerType,
    props.router,
    props.collateralToken,
    props.conditionId,
    props.indexSets,
  );

  const transactionReceipt = await waitForTransactionReceipt(config, {
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
