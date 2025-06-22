import { RouterAbi } from "@/abi/RouterAbi";
import { CHAIN_ROUTERS } from "@/lib/config";
import { Market } from "@/lib/market";
import { queryClient } from "@/lib/query-client";
import { toastifySendCallsTx, toastifyTx } from "@/lib/toastify";
import { config } from "@/wagmi";
import { useMutation } from "@tanstack/react-query";
import { sendTransaction } from "@wagmi/core";
import { Address, TransactionReceipt, encodeFunctionData } from "viem";
import { gnosisRouterAbi, mainnetRouterAbi } from "./contracts/generated-router";
import { Execution, useCheck7702Support } from "./useCheck7702Support";
import { UseMissingApprovalsProps, getApprovals7702, useMissingApprovals } from "./useMissingApprovals";

interface MergePositionProps {
  router: Address;
  market: Market;
  amount: bigint;
  collateralToken: Address | undefined;
}

function mergeFromRouter(
  collateralToken: Address | undefined,
  router: Address,
  market: Market,
  amount: bigint,
): Execution {
  if (collateralToken) {
    // merge to the market's main collateral (sDAI)
    return {
      to: router,
      value: 0n,
      data: encodeFunctionData({
        abi: RouterAbi,
        functionName: "mergePositions",
        args: [collateralToken, market.id, amount],
      }),
    };
  }

  if (CHAIN_ROUTERS[market.chainId] === "mainnet") {
    // merge to DAI on mainnet
    return {
      to: router,
      value: 0n,
      data: encodeFunctionData({
        abi: mainnetRouterAbi,
        functionName: "mergeToDai",
        args: [market.id, amount],
      }),
    };
  }

  // merge to xDAI on gnosis
  return {
    to: router,
    value: amount,
    data: encodeFunctionData({
      abi: gnosisRouterAbi,
      functionName: "mergeToBase",
      args: [market.id, amount],
    }),
  };
}

async function mergePositions(props: MergePositionProps): Promise<TransactionReceipt> {
  const result = await toastifyTx(
    () => sendTransaction(config, mergeFromRouter(props.collateralToken, props.router, props.market, props.amount)),
    { txSent: { title: "Merging tokens..." }, txSuccess: { title: "Tokens merged!" } },
  );

  if (!result.status) {
    throw result.status;
  }

  return result.receipt;
}

const useMergePositionsLegacy = (
  approvalsConfig: UseMissingApprovalsProps,
  onSuccess: (data: TransactionReceipt) => unknown,
) => {
  const approvals = useMissingApprovals(approvalsConfig);

  return {
    approvals,
    mergePositions: useMutation({
      mutationFn: mergePositions,
      onSuccess: (data: TransactionReceipt) => {
        queryClient.invalidateQueries({ queryKey: ["useMarketPositions"] });
        queryClient.invalidateQueries({ queryKey: ["useTokenBalances"] });
        queryClient.invalidateQueries({ queryKey: ["useTokenBalance"] });
        onSuccess(data);
      },
    }),
  };
};

async function mergePositions7702(
  approvalsConfig: UseMissingApprovalsProps,
  props: MergePositionProps,
): Promise<TransactionReceipt> {
  const calls: Execution[] = getApprovals7702(approvalsConfig);

  calls.push(mergeFromRouter(props.collateralToken, props.router, props.market, props.amount));

  const result = await toastifySendCallsTx(calls, config, {
    txSent: { title: "Merging tokens..." },
    txSuccess: { title: "Tokens merged!" },
  });

  if (!result.status) {
    throw result.status;
  }

  return result.receipt;
}

const useMergePositions7702 = (
  approvalsConfig: UseMissingApprovalsProps,
  onSuccess: (data: TransactionReceipt) => unknown,
) => {
  const approvals = {
    data: [],
    isLoading: false,
  };

  return {
    approvals,
    mergePositions: useMutation({
      mutationFn: (props: MergePositionProps) => mergePositions7702(approvalsConfig, props),
      onSuccess: (data: TransactionReceipt) => {
        queryClient.invalidateQueries({ queryKey: ["useMarketPositions"] });
        queryClient.invalidateQueries({ queryKey: ["useTokenBalances"] });
        queryClient.invalidateQueries({ queryKey: ["useTokenBalance"] });
        queryClient.invalidateQueries({ queryKey: ["useMissingApprovals"] });

        onSuccess(data);
      },
    }),
  };
};

export const useMergePositions = (
  approvalsConfig: UseMissingApprovalsProps,
  onSuccess: (data: TransactionReceipt) => unknown,
) => {
  const supports7702 = useCheck7702Support();
  const merge7702 = useMergePositions7702(approvalsConfig, onSuccess);
  const mergeLegacy = useMergePositionsLegacy(approvalsConfig, onSuccess);

  return supports7702 ? merge7702 : mergeLegacy;
};
