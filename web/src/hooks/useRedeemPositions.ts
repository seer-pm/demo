import { RouterAbi } from "@/abi/RouterAbi";
import { RouterTypes } from "@/lib/config";
import { queryClient } from "@/lib/query-client";
import { toastifyTx } from "@/lib/toastify";
import { config } from "@/wagmi";
import { useMutation } from "@tanstack/react-query";
import { sendCalls, writeContract } from "@wagmi/core";
import { Address, TransactionReceipt, encodeFunctionData } from "viem";
import {
  gnosisRouterAbi,
  mainnetRouterAbi,
  writeConditionalRouterRedeemConditionalToCollateral,
  writeGnosisRouterRedeemToBase,
  writeMainnetRouterRedeemToDai,
} from "./contracts/generated";
import { Execution, useCheck7702Support } from "./useCheck7702Support";
import { UseMissingApprovalsProps, getApprovals7702, useMissingApprovals } from "./useMissingApprovals";

interface RedeemPositionProps {
  router: Address;
  market: Address;
  collateralToken: Address;
  outcomeIndexes: bigint[];
  amounts: bigint[];
  isMainCollateral: boolean;
  routerType: RouterTypes;
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

export const useRedeemPositionsLegacy = (approvalsConfig: UseMissingApprovalsProps, successCallback?: () => void) => {
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
        successCallback?.();
      },
    }),
  };
};

function redeemFromRouter7702(
  isMainCollateral: boolean,
  routerType: RouterTypes,
  router: Address,
  collateralToken: Address,
  market: Address,
  outcomeIndexes: bigint[],
  amounts: bigint[],
) {
  if (isMainCollateral) {
    return {
      to: router,
      value: 0n,
      data: encodeFunctionData({
        abi: RouterAbi,
        functionName: "redeemPositions",
        args: [collateralToken, market, outcomeIndexes, amounts],
      }),
    };
  }

  if (routerType === "mainnet") {
    return {
      to: router,
      value: 0n,
      data: encodeFunctionData({
        abi: mainnetRouterAbi,
        functionName: "redeemToDai",
        args: [market, outcomeIndexes, amounts],
      }),
    };
  }

  return {
    to: router,
    value: 0n,
    data: encodeFunctionData({
      abi: gnosisRouterAbi,
      functionName: "redeemToBase",
      args: [market, outcomeIndexes, amounts],
    }),
  };
}

async function redeemPositions7702(
  approvalsConfig: UseMissingApprovalsProps,
  props: RedeemPositionProps,
): Promise<TransactionReceipt> {
  const calls: Execution[] = getApprovals7702(approvalsConfig);

  calls.push(
    redeemFromRouter7702(
      props.isMainCollateral,
      props.routerType,
      props.router,
      props.collateralToken,
      props.market,
      props.outcomeIndexes,
      props.amounts,
    ),
  );

  const result = await toastifyTx(
    () =>
      sendCalls(config, {
        calls,
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

const useRedeemPositions7702 = (
  approvalsConfig: UseMissingApprovalsProps,
  onSuccess?: (data: TransactionReceipt) => unknown,
) => {
  const approvals = {
    data: [],
    isLoading: false,
  };

  return {
    approvals,
    redeemPositions: useMutation({
      mutationFn: (props: RedeemPositionProps) => redeemPositions7702(approvalsConfig, props),
      onSuccess: async (data: TransactionReceipt) => {
        await queryClient.invalidateQueries({ queryKey: ["useMarketPositions"] });
        queryClient.invalidateQueries({ queryKey: ["useWinningPositions"] });
        queryClient.invalidateQueries({ queryKey: ["usePositions"] });
        onSuccess?.(data);
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

export const useRedeemConditionalPositions = (successCallback?: () => unknown) => {
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
