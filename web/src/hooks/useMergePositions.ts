import { RouterAbi } from "@/abi/RouterAbi";
import { RouterTypes } from "@/lib/config";
import { queryClient } from "@/lib/query-client";
import { toastifyTx } from "@/lib/toastify";
import { config } from "@/wagmi";
import { useMutation } from "@tanstack/react-query";
import { sendTransaction } from "@wagmi/core";
import { Address, TransactionReceipt, encodeFunctionData } from "viem";
import { gnosisRouterAbi, mainnetRouterAbi } from "./contracts/generated-router";
import { Execution } from "./useCheck7702Support";
import { UseMissingApprovalsProps, useMissingApprovals } from "./useMissingApprovals";

interface MergePositionProps {
  router: Address;
  market: Address;
  collateralToken: Address;
  outcomeSlotCount: number;
  amount: bigint;
  isMainCollateral: boolean;
  routerType: RouterTypes;
}

function mergeFromRouter(
  isMainCollateral: boolean,
  routerType: RouterTypes,
  router: Address,
  collateralToken: Address,
  market: Address,
  amount: bigint,
): Execution {
  if (isMainCollateral) {
    return {
      to: router,
      value: 0n,
      data: encodeFunctionData({
        abi: RouterAbi,
        functionName: "mergePositions",
        args: [collateralToken, market, amount],
      }),
    };
  }

  if (routerType === "mainnet") {
    return {
      to: router,
      value: 0n,
      data: encodeFunctionData({
        abi: mainnetRouterAbi,
        functionName: "mergeToDai",
        args: [market, amount],
      }),
    };
  }

  return {
    to: router,
    value: amount,
    data: encodeFunctionData({
      abi: gnosisRouterAbi,
      functionName: "mergeToBase",
      args: [market, amount],
    }),
  };
}

async function mergePositions(props: MergePositionProps): Promise<TransactionReceipt> {
  const result = await toastifyTx(
    () =>
      sendTransaction(
        config,
        mergeFromRouter(
          props.isMainCollateral,
          props.routerType,
          props.router,
          props.collateralToken,
          props.market,
          props.amount,
        ),
      ),
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

// async function mergePositions7702(
//   approvalsConfig: UseMissingApprovalsProps,
//   props: MergePositionProps,
// ): Promise<TransactionReceipt> {
//   const calls: Execution[] = getApprovals7702(approvalsConfig);

//   calls.push(
//     mergeFromRouter(
//       props.isMainCollateral,
//       props.routerType,
//       props.router,
//       props.collateralToken,
//       props.market,
//       props.amount,
//     ),
//   );

//   const result = await toastifyTx(
//     () =>
//       sendCalls(config, {
//         calls,
//       }),
//     { txSent: { title: "Merging tokens..." }, txSuccess: { title: "Tokens merged!" } },
//   );

//   if (!result.status) {
//     throw result.error;
//   }

//   return result.receipt;
// }

// const useMergePositions7702 = (
//   approvalsConfig: UseMissingApprovalsProps,
//   onSuccess: (data: TransactionReceipt) => unknown,
// ) => {
//   const approvals = {
//     data: [],
//     isLoading: false,
//   };

//   return {
//     approvals,
//     mergePositions: useMutation({
//       mutationFn: (props: MergePositionProps) => mergePositions7702(approvalsConfig, props),
//       onSuccess: (data: TransactionReceipt) => {
//         queryClient.invalidateQueries({ queryKey: ["useMarketPositions"] });
//         queryClient.invalidateQueries({ queryKey: ["useTokenBalances"] });
//         queryClient.invalidateQueries({ queryKey: ["useTokenBalance"] });
//         onSuccess(data);
//       },
//     }),
//   };
// };

export const useMergePositions = (
  approvalsConfig: UseMissingApprovalsProps,
  onSuccess: (data: TransactionReceipt) => unknown,
) => {
  // const supports7702 = useCheck7702Support();
  // const merge7702 = useMergePositions7702(approvalsConfig, onSuccess);
  const mergeLegacy = useMergePositionsLegacy(approvalsConfig, onSuccess);

  return /*supports7702 ? merge7702 :*/ mergeLegacy;
};
