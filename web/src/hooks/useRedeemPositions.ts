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
) {
  if (isMainCollateral) {
    return await writeContract(config, {
      address: router,
      abi: RouterAbi,
      functionName: "redeemPositions",
      args: [collateralToken, market, outcomeIndexes],
    });
  }

  if (routerType === "mainnet") {
    return await writeMainnetRouterRedeemToDai(config, {
      args: [market, outcomeIndexes],
    });
  }

  return await writeGnosisRouterRedeemToBase(config, {
    args: [market, outcomeIndexes],
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
      queryClient.invalidateQueries({ queryKey: ["useMarketPositions"] });
      queryClient.invalidateQueries({ queryKey: ["useTokenBalances"] });
      queryClient.invalidateQueries({ queryKey: ["useTokenBalance"] });
    },
  });
};
