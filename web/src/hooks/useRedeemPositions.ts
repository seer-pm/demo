import { RouterAbi } from "@/abi/RouterAbi";
import { EMPTY_PARENT_COLLECTION } from "@/lib/conditional-tokens";
import { RouterTypes } from "@/lib/config";
import { queryClient } from "@/lib/query-client";
import { toastifyTx } from "@/lib/toastify";
import { config } from "@/wagmi";
import { useMutation } from "@tanstack/react-query";
import { writeContract } from "@wagmi/core";
import { Address, TransactionReceipt } from "viem";
import { writeGnosisRouterRedeemToBase, writeMainnetRouterRedeemToDai } from "./contracts/generated";

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
    return await writeMainnetRouterRedeemToDai(config, {
      args: [EMPTY_PARENT_COLLECTION, conditionId, indexSets],
    });
  }

  return await writeGnosisRouterRedeemToBase(config, {
    args: [EMPTY_PARENT_COLLECTION, conditionId, indexSets],
  });
}

async function redeemPositions(props: RedeemPositionProps): Promise<TransactionReceipt> {
  const result = await toastifyTx(
    () =>
      redeemFromRouter(
        props.isMainCollateral,
        props.routerType,
        props.router,
        props.collateralToken,
        props.conditionId,
        props.indexSets,
      ),
    {
      txSent: { title: "Redeeming tokens..." },
      txSuccess: { title: "Tokens redeemed!" },
    },
  );

  if (!result.status) {
    throw result.error;
  }

  return result.receipt;
}

export const useRedeemPositions = () => {
  return useMutation({
    mutationFn: redeemPositions,
    onSuccess: (/*data: TransactionReceipt*/) => {
      queryClient.invalidateQueries({ queryKey: ["useUserPositions"] });
      queryClient.invalidateQueries({ queryKey: ["useTokenBalances"] });
      queryClient.invalidateQueries({ queryKey: ["useTokenBalance"] });
    },
  });
};
