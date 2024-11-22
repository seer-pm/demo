import { RouterAbi } from "@/abi/RouterAbi";
import { RouterTypes } from "@/lib/config";
import { queryClient } from "@/lib/query-client";
import { toastifyTx } from "@/lib/toastify";
import { config } from "@/wagmi";
import { useMutation } from "@tanstack/react-query";
import { writeContract } from "@wagmi/core";
import { Address, TransactionReceipt } from "viem";
import { writeGnosisRouterRedeemToBase, writeMainnetRouterRedeemToDai } from "./contracts/generated";

interface RedeemPositionProps {
  router: Address;
  market: Address;
  collateralToken: Address;
  outcomeIndexes: bigint[];
  amounts: bigint[];
  isMainCollateral: boolean;
  routerType: RouterTypes;
}

async function redeemFromRouter(
  isMainCollateral: boolean,
  routerType: RouterTypes,
  router: Address,
  collateralToken: Address,
  market: Address,
  outcomeIndexes: bigint[],
  amounts: bigint[],
) {
  if (isMainCollateral) {
    return await writeContract(config, {
      address: router,
      abi: RouterAbi,
      functionName: "redeemPositions",
      args: [collateralToken, market, outcomeIndexes, amounts],
    });
  }

  if (routerType === "mainnet") {
    return await writeMainnetRouterRedeemToDai(config, {
      args: [market, outcomeIndexes, amounts],
    });
  }

  return await writeGnosisRouterRedeemToBase(config, {
    args: [market, outcomeIndexes, amounts],
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
        props.market,
        props.outcomeIndexes,
        props.amounts,
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

export const useRedeemPositions = (successCallback?: () => void) => {
  return useMutation({
    mutationFn: redeemPositions,
    onSuccess: async (/*data: TransactionReceipt*/) => {
      queryClient.invalidateQueries({ queryKey: ["useTokenBalances"] });
      queryClient.invalidateQueries({ queryKey: ["useTokenBalance"] });
      // have to wait for market positions to finish invalidate
      await queryClient.invalidateQueries({ queryKey: ["useMarketPositions"] });
      queryClient.invalidateQueries({ queryKey: ["useWinningPositions"] });
      queryClient.invalidateQueries({ queryKey: ["usePositions"] });
      successCallback?.();
    },
  });
};
