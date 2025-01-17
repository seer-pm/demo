import { RouterAbi } from "@/abi/RouterAbi";
import { CHAIN_ROUTERS } from "@/lib/config";
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
  collateralToken: Address | undefined;
}

async function splitFromRouter(collateralToken: Address | undefined, router: Address, market: Market, amount: bigint) {
  if (market.type === "Futarchy") {
    // futarchy markets have two collateral tokens
    if (!collateralToken) {
      throw new Error("Missing collateral token to split");
    }
    return await writeFutarchyRouterSplitPosition(config, {
      args: [market.id, collateralToken, amount],
    });
  }

  if (collateralToken) {
    // split from the market main collateral (sDAI)
    return await writeContract(config, {
      address: router,
      abi: RouterAbi,
      functionName: "splitPosition",
      args: [collateralToken, market.id, amount],
    });
  }

  if (CHAIN_ROUTERS[market.chainId] === "mainnet") {
    // split from DAI on mainnet
    return await writeMainnetRouterSplitFromDai(config, {
      args: [market.id, amount],
    });
  }

  // split from xDAI on gnosis
  return await writeGnosisRouterSplitFromBase(config, {
    args: [market.id],
    value: amount,
  });
}

async function splitPosition(props: SplitPositionProps): Promise<TransactionReceipt> {
  const result = await toastifyTx(
    () => splitFromRouter(props.collateralToken, props.router, props.market, props.amount),
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
