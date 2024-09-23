import { RouterAbi } from "@/abi/RouterAbi";
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
  market: Address;
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
  market: Address,
  amount: bigint,
) {
  if (isMainCollateral) {
    return await writeContract(config, {
      address: router,
      abi: RouterAbi,
      functionName: "mergePositions",
      args: [collateralToken, market, amount],
    });
  }

  if (routerType === "mainnet") {
    return await writeMainnetRouterMergeToDai(config, {
      args: [market, amount],
    });
  }

  return await writeGnosisRouterMergeToBase(config, {
    args: [market, amount],
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
        props.market,
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
      queryClient.invalidateQueries({ queryKey: ["useMarketPositions"] });
      queryClient.invalidateQueries({ queryKey: ["useTokenBalances"] });
      queryClient.invalidateQueries({ queryKey: ["useTokenBalance"] });
      onSuccess(data);
    },
  });
};
