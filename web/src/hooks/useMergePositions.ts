import { RouterAbi } from "@/abi/RouterAbi";
import { CHAIN_ROUTERS, COLLATERAL_TOKENS } from "@/lib/config";
import { queryClient } from "@/lib/query-client";
import { toastifyTx } from "@/lib/toastify";
import { config } from "@/wagmi";
import { useMutation } from "@tanstack/react-query";
import { writeContract } from "@wagmi/core";
import { Address, TransactionReceipt } from "viem";
import {
  writeFutarchyRouterMergePositions,
  writeGnosisRouterMergeToBase,
  writeMainnetRouterMergeToDai,
} from "./contracts/generated";
import { Market } from "./useMarket";

interface MergePositionProps {
  router: Address;
  market: Market;
  amount: bigint;
  isMainCollateral: boolean;
}

async function mergeFromRouter(isMainCollateral: boolean, router: Address, market: Market, amount: bigint) {
  if (market.type === "Futarchy") {
    return await writeFutarchyRouterMergePositions(config, {
      args: [market.id, isMainCollateral, amount],
    });
  }

  if (isMainCollateral) {
    return await writeContract(config, {
      address: router,
      abi: RouterAbi,
      functionName: "mergePositions",
      args: [COLLATERAL_TOKENS[market.chainId].primary.address, market.id, amount],
    });
  }

  if (CHAIN_ROUTERS[market.chainId] === "mainnet") {
    return await writeMainnetRouterMergeToDai(config, {
      args: [market.id, amount],
    });
  }

  return await writeGnosisRouterMergeToBase(config, {
    args: [market.id, amount],
  });
}

async function mergePositions(props: MergePositionProps): Promise<TransactionReceipt> {
  const result = await toastifyTx(
    () => mergeFromRouter(props.isMainCollateral, props.router, props.market, props.amount),
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
