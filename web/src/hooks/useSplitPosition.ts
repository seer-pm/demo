import { RouterAbi } from "@/abi/RouterAbi";
import { CHAIN_ROUTERS, COLLATERAL_TOKENS } from "@/lib/config";
import { queryClient } from "@/lib/query-client";
import { toastifyTx } from "@/lib/toastify";
import { config } from "@/wagmi";
import { useMutation } from "@tanstack/react-query";
import { writeContract } from "@wagmi/core";
import { Address, TransactionReceipt } from "viem";
import {
  writeFutarchyRouterSplitPosition,
  writeGnosisRouterSplitFromBase,
  writeMainnetRouterSplitFromDai,
} from "./contracts/generated";
import { Market } from "./useMarket";

interface SplitPositionProps {
  router: Address;
  market: Market;
  amount: bigint;
  isMainCollateral: boolean;
}

async function splitFromRouter(isMainCollateral: boolean, router: Address, market: Market, amount: bigint) {
  if (market.type === "Futarchy") {
    return await writeFutarchyRouterSplitPosition(config, {
      args: [market.id, isMainCollateral, amount],
    });
  }

  if (isMainCollateral) {
    return await writeContract(config, {
      address: router,
      abi: RouterAbi,
      functionName: "splitPosition",
      args: [COLLATERAL_TOKENS[market.chainId].primary.address, market.id, amount],
    });
  }

  if (CHAIN_ROUTERS[market.chainId] === "mainnet") {
    return await writeMainnetRouterSplitFromDai(config, {
      args: [market.id, amount],
    });
  }

  return await writeGnosisRouterSplitFromBase(config, {
    args: [market.id],
    value: amount,
  });
}

async function splitPosition(props: SplitPositionProps): Promise<TransactionReceipt> {
  const result = await toastifyTx(
    () => splitFromRouter(props.isMainCollateral, props.router, props.market, props.amount),
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
