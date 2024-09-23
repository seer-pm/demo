import { RouterAbi } from "@/abi/RouterAbi";
import { RouterTypes } from "@/lib/config";
import { queryClient } from "@/lib/query-client";
import { toastifyTx } from "@/lib/toastify";
import { config } from "@/wagmi";
import { useMutation } from "@tanstack/react-query";
import { writeContract } from "@wagmi/core";
import { Address, TransactionReceipt } from "viem";
import { writeGnosisRouterSplitFromBase, writeMainnetRouterSplitFromDai } from "./contracts/generated";

interface SplitPositionProps {
  account: Address;
  router: Address;
  market: Address;
  collateralToken: Address;
  outcomeSlotCount: number;
  amount: bigint;
  isMainCollateral: boolean;
  routerType: RouterTypes;
}

async function splitFromRouter(
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
      functionName: "splitPosition",
      args: [collateralToken, market, amount],
    });
  }

  if (routerType === "mainnet") {
    return await writeMainnetRouterSplitFromDai(config, {
      args: [market, amount],
    });
  }

  return await writeGnosisRouterSplitFromBase(config, {
    args: [market],
    value: amount,
  });
}

async function splitPosition(props: SplitPositionProps): Promise<TransactionReceipt> {
  const result = await toastifyTx(
    () =>
      splitFromRouter(
        props.isMainCollateral,
        props.routerType,
        props.router,
        props.collateralToken,
        props.market,
        props.amount,
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
      queryClient.invalidateQueries({ queryKey: ["useMarketPositions"] });
      queryClient.invalidateQueries({ queryKey: ["useTokenBalances"] });
      queryClient.invalidateQueries({ queryKey: ["useTokenBalance"] });
      onSuccess(data);
    },
  });
};
