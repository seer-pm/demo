import { RouterAbi } from "@/abi/RouterAbi";
import { CHAIN_ROUTERS, COLLATERAL_TOKENS } from "@/lib/config";
import { queryClient } from "@/lib/query-client";
import { toastifyTx } from "@/lib/toastify";
import { config } from "@/wagmi";
import { useMutation } from "@tanstack/react-query";
import { writeContract } from "@wagmi/core";
import { Address, TransactionReceipt } from "viem";
import {
  writeConditionalRouterRedeemConditionalToCollateral,
  writeFutarchyRouterRedeemProposal,
  writeGnosisRouterRedeemToBase,
  writeMainnetRouterRedeemToDai,
} from "./contracts/generated";
import { Market } from "./useMarket";

interface RedeemPositionProps {
  router: Address;
  market: Market;
  outcomeIndexes: bigint[];
  amounts: bigint[];
  isMainCollateral: boolean;
}

interface RedeemConditionalPositionProps {
  market: Address;
  collateralToken: Address;
  outcomeIndexes: bigint[];
  parentOutcomeIndexes: bigint[];
  amounts: bigint[];
}

async function redeemFromRouter(
  isMainCollateral: boolean,
  router: Address,
  market: Market,
  outcomeIndexes: bigint[],
  amounts: bigint[],
) {
  if (market.type === "Futarchy") {
    return await writeFutarchyRouterRedeemProposal(config, {
      args: [market.id, amounts[0], amounts[1]],
    });
  }

  if (isMainCollateral) {
    return await writeContract(config, {
      address: router,
      abi: RouterAbi,
      functionName: "redeemPositions",
      args: [COLLATERAL_TOKENS[market.chainId].primary.address, market.id, outcomeIndexes, amounts],
    });
  }

  if (CHAIN_ROUTERS[market.chainId] === "mainnet") {
    return await writeMainnetRouterRedeemToDai(config, {
      args: [market.id, outcomeIndexes, amounts],
    });
  }

  return await writeGnosisRouterRedeemToBase(config, {
    args: [market.id, outcomeIndexes, amounts],
  });
}

async function redeemPositions(props: RedeemPositionProps): Promise<TransactionReceipt> {
  const result = await toastifyTx(
    () => redeemFromRouter(props.isMainCollateral, props.router, props.market, props.outcomeIndexes, props.amounts),
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

async function redeemConditionalPositions(props: RedeemConditionalPositionProps): Promise<TransactionReceipt> {
  const result = await toastifyTx(
    () =>
      writeConditionalRouterRedeemConditionalToCollateral(config, {
        args: [props.collateralToken, props.market, props.outcomeIndexes, props.parentOutcomeIndexes, props.amounts],
      }),
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

export const useRedeemConditionalPositions = (successCallback?: () => void) => {
  return useMutation({
    mutationFn: redeemConditionalPositions,
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
