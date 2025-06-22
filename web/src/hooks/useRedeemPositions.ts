import { RouterAbi } from "@/abi/RouterAbi";
import { CHAIN_ROUTERS, COLLATERAL_TOKENS, getRouterAddress } from "@/lib/config";
import { Market } from "@/lib/market";
import { queryClient } from "@/lib/query-client";
import { toastifySendCallsTx, toastifyTx } from "@/lib/toastify";
import { config } from "@/wagmi";
import { useMutation } from "@tanstack/react-query";
import { sendTransaction } from "@wagmi/core";
import { Address, TransactionReceipt, encodeFunctionData } from "viem";
import {
  conditionalRouterAbi,
  conditionalRouterAddress,
  gnosisRouterAbi,
  mainnetRouterAbi,
} from "./contracts/generated-router";
import { futarchyRouterAbi, futarchyRouterAddress } from "./contracts/generated-router";
import { Execution, useCheck7702Support } from "./useCheck7702Support";
import { UseMissingApprovalsProps, getApprovals7702, useMissingApprovals } from "./useMissingApprovals";

interface RedeemPositionProps {
  market: Market;
  collateralToken: Address | undefined;
  parentOutcome: bigint;
  outcomeIndexes: bigint[];
  amounts: bigint[];
  isRedeemToParentCollateral: boolean;
}

export function getRedeemRouter(isRedeemToParentCollateral: boolean, market: Market) {
  if (market.type === "Futarchy") {
    // @ts-ignore
    return futarchyRouterAddress[market.chainId];
  }
  return isRedeemToParentCollateral ? conditionalRouterAddress[market.chainId] : getRouterAddress(market);
}

function redeemFromRouter(
  isRedeemToParentCollateral: boolean,
  collateralToken: Address | undefined,
  market: Market,
  parentOutcome: bigint,
  outcomeIndexes: bigint[],
  amounts: bigint[],
) {
  const router = getRedeemRouter(isRedeemToParentCollateral, market);

  if (market.type === "Futarchy") {
    return {
      to: router,
      value: 0n,
      data: encodeFunctionData({
        abi: futarchyRouterAbi,
        functionName: "redeemProposal",
        args: [market.id, amounts[0], amounts[1]],
      }),
    };
  }

  if (isRedeemToParentCollateral) {
    // redeen to the market's parent outcome
    return {
      to: router,
      value: 0n,
      data: encodeFunctionData({
        abi: conditionalRouterAbi,
        functionName: "redeemConditionalToCollateral",
        args: [COLLATERAL_TOKENS[market.chainId].primary.address!, market.id, outcomeIndexes, [parentOutcome], amounts],
      }),
    };
  }

  if (collateralToken) {
    // redeem to the market's main collateral (sDAI)
    return {
      to: router,
      value: 0n,
      data: encodeFunctionData({
        abi: RouterAbi,
        functionName: "redeemPositions",
        args: [collateralToken, market.id, outcomeIndexes, amounts],
      }),
    };
  }

  if (CHAIN_ROUTERS[market.chainId] === "mainnet") {
    // redeem to DAI on mainnet
    return {
      to: router,
      value: 0n,
      data: encodeFunctionData({
        abi: mainnetRouterAbi,
        functionName: "redeemToDai",
        args: [market.id, outcomeIndexes, amounts],
      }),
    };
  }

  // redeem to xDAI on gnosis
  return {
    to: router,
    value: 0n,
    data: encodeFunctionData({
      abi: gnosisRouterAbi,
      functionName: "redeemToBase",
      args: [market.id, outcomeIndexes, amounts],
    }),
  };
}

async function redeemPositions(props: RedeemPositionProps): Promise<TransactionReceipt> {
  const result = await toastifyTx(
    () =>
      sendTransaction(
        config,
        redeemFromRouter(
          props.isRedeemToParentCollateral,
          props.collateralToken,
          props.market,
          props.parentOutcome,
          props.outcomeIndexes,
          props.amounts,
        ),
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

export const useRedeemPositionsLegacy = (approvalsConfig: UseMissingApprovalsProps, onSuccess?: () => void) => {
  const approvals = useMissingApprovals(approvalsConfig);

  return {
    approvals,
    redeemPositions: useMutation({
      mutationFn: redeemPositions,
      onSuccess: async (/*data: TransactionReceipt*/) => {
        queryClient.invalidateQueries({ queryKey: ["useTokenBalances"] });
        queryClient.invalidateQueries({ queryKey: ["useTokenBalance"] });
        // have to wait for market positions to finish invalidate
        await queryClient.invalidateQueries({ queryKey: ["useMarketPositions"] });
        queryClient.invalidateQueries({ queryKey: ["useWinningPositions"] });
        queryClient.invalidateQueries({ queryKey: ["usePositions"] });
        onSuccess?.();
      },
    }),
  };
};

async function redeemPositions7702(
  approvalsConfig: UseMissingApprovalsProps,
  props: RedeemPositionProps,
): Promise<TransactionReceipt> {
  const calls: Execution[] = getApprovals7702(approvalsConfig);

  calls.push(
    redeemFromRouter(
      props.isRedeemToParentCollateral,
      props.collateralToken,
      props.market,
      props.parentOutcome,
      props.outcomeIndexes,
      props.amounts,
    ),
  );

  const result = await toastifySendCallsTx(calls, config, {
    txSent: { title: "Redeeming tokens..." },
    txSuccess: { title: "Tokens redeemed!" },
  });

  if (!result.status) {
    throw result.error;
  }

  return result.receipt;
}

const useRedeemPositions7702 = (approvalsConfig: UseMissingApprovalsProps, onSuccess?: () => unknown) => {
  const approvals = {
    data: [],
    isLoading: false,
  };

  return {
    approvals,
    redeemPositions: useMutation({
      mutationFn: (props: RedeemPositionProps) => redeemPositions7702(approvalsConfig, props),
      onSuccess: async () => {
        queryClient.invalidateQueries({ queryKey: ["useTokenBalances"] });
        queryClient.invalidateQueries({ queryKey: ["useTokenBalance"] });
        // have to wait for market positions to finish invalidate
        await queryClient.invalidateQueries({ queryKey: ["useMarketPositions"] });
        queryClient.invalidateQueries({ queryKey: ["useWinningPositions"] });
        queryClient.invalidateQueries({ queryKey: ["usePositions"] });
        onSuccess?.();
      },
    }),
  };
};

export const useRedeemPositions = (approvalsConfig: UseMissingApprovalsProps, onSuccess?: () => void) => {
  const supports7702 = useCheck7702Support();
  const redeem7702 = useRedeemPositions7702(approvalsConfig, onSuccess);
  const redeemLegacy = useRedeemPositionsLegacy(approvalsConfig, onSuccess);

  return supports7702 ? redeem7702 : redeemLegacy;
};
