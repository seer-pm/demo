import { RouterAbi } from "@/abi/RouterAbi";
import { Execution } from "@/hooks/useCheck7702Support";
import { RouterTypes } from "@/lib/config";
import { queryClient } from "@/lib/query-client";
import { toastifyTx } from "@/lib/toastify";
import { config } from "@/wagmi";
import { useMutation } from "@tanstack/react-query";
import { sendTransaction } from "@wagmi/core";
import { Address, TransactionReceipt, encodeFunctionData } from "viem";
import { gnosisRouterAbi, mainnetRouterAbi } from "./contracts/generated";
import { UseMissingApprovalsProps, useMissingApprovals } from "./useMissingApprovals";

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

function splitFromRouter(
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
        functionName: "splitPosition",
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
        functionName: "splitFromDai",
        args: [market, amount],
      }),
    };
  }

  return {
    to: router,
    value: amount,
    data: encodeFunctionData({
      abi: gnosisRouterAbi,
      functionName: "splitFromBase",
      args: [market],
    }),
  };
}

async function splitPosition(props: SplitPositionProps): Promise<TransactionReceipt> {
  const result = await toastifyTx(
    () =>
      sendTransaction(
        config,
        splitFromRouter(
          props.isMainCollateral,
          props.routerType,
          props.router,
          props.collateralToken,
          props.market,
          props.amount,
        ),
      ),
    { txSent: { title: "Minting tokens..." }, txSuccess: { title: "Tokens minted!" } },
  );

  if (!result.status) {
    throw result.error;
  }

  return result.receipt;
}

const useSplitPositionLegacy = (
  approvalsConfig: UseMissingApprovalsProps,
  onSuccess: (data: TransactionReceipt) => unknown,
) => {
  const approvals = useMissingApprovals(approvalsConfig);

  return {
    approvals,
    splitPosition: useMutation({
      mutationFn: splitPosition,
      onSuccess: (data: TransactionReceipt) => {
        queryClient.invalidateQueries({ queryKey: ["useMarketPositions"] });
        queryClient.invalidateQueries({ queryKey: ["useTokenBalances"] });
        queryClient.invalidateQueries({ queryKey: ["useTokenBalance"] });
        onSuccess(data);
      },
    }),
  };
};

// async function splitPosition7702(
//   approvalsConfig: UseMissingApprovalsProps,
//   props: SplitPositionProps,
// ): Promise<TransactionReceipt> {
//   const calls: Execution[] = getApprovals7702(approvalsConfig);

//   calls.push(
//     splitFromRouter(
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
//     {
//       txSent: { title: "Minting tokens..." },
//       txSuccess: { title: "Tokens minted!" },
//     },
//   );

//   if (!result.status) {
//     throw result.error;
//   }

//   return result.receipt;
// }

// const useSplitPosition7702 = (
//   approvalsConfig: UseMissingApprovalsProps,
//   onSuccess: (data: TransactionReceipt) => unknown,
// ) => {
//   const approvals = {
//     data: [],
//     isLoading: false,
//   };

//   return {
//     approvals,
//     splitPosition: useMutation({
//       mutationFn: (props: SplitPositionProps) => splitPosition7702(approvalsConfig, props),
//       onSuccess: (data: TransactionReceipt) => {
//         queryClient.invalidateQueries({ queryKey: ["useMarketPositions"] });
//         queryClient.invalidateQueries({ queryKey: ["useTokenBalances"] });
//         queryClient.invalidateQueries({ queryKey: ["useTokenBalance"] });
//         onSuccess(data);
//       },
//     }),
//   };
// };

export const useSplitPosition = (
  approvalsConfig: UseMissingApprovalsProps,
  onSuccess: (data: TransactionReceipt) => unknown,
) => {
  // const supports7702 = useCheck7702Support();
  // const split7702 = useSplitPosition7702(approvalsConfig, onSuccess);
  const splitLegacy = useSplitPositionLegacy(approvalsConfig, onSuccess);

  return /*supports7702 ? split7702 :*/ splitLegacy;
};
