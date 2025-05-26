import { RouterAbi } from "@/abi/RouterAbi";
import { SupportedChain } from "@/lib/chains";
import { CHAIN_ROUTERS, getRouterAddress } from "@/lib/config";
import { queryClient } from "@/lib/query-client";
import { toastifyTx } from "@/lib/toastify";
import { config } from "@/wagmi";
import { useMutation } from "@tanstack/react-query";
import { sendTransaction } from "@wagmi/core";
import { Address, TransactionReceipt, encodeFunctionData } from "viem";
import {
  conditionalRouterAbi,
  conditionalRouterAddress,
  gnosisRouterAbi,
  mainnetRouterAbi,
} from "./contracts/generated";
import { UseMissingApprovalsProps, useMissingApprovals } from "./useMissingApprovals";

interface RedeemPositionProps {
  market: Address;
  chainId: SupportedChain;
  parentOutcome: bigint;
  collateralToken: Address;
  outcomeIndexes: bigint[];
  amounts: bigint[];
  isMainCollateral: boolean;
  isRedeemToParentCollateral: boolean;
}

export function getRedeemRouter(isRedeemToParentCollateral: boolean, chainId: SupportedChain) {
  return isRedeemToParentCollateral ? conditionalRouterAddress[chainId as SupportedChain] : getRouterAddress(chainId);
}

function redeemFromRouter(
  isMainCollateral: boolean,
  isRedeemToParentCollateral: boolean,
  chainId: SupportedChain,
  collateralToken: Address,
  market: Address,
  parentOutcome: bigint,
  outcomeIndexes: bigint[],
  amounts: bigint[],
) {
  const router = getRedeemRouter(isRedeemToParentCollateral, chainId);

  if (isRedeemToParentCollateral) {
    return {
      to: router,
      value: 0n,
      data: encodeFunctionData({
        abi: conditionalRouterAbi,
        functionName: "redeemConditionalToCollateral",
        args: [collateralToken, market, outcomeIndexes, [parentOutcome], amounts],
      }),
    };
  }

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

  const routerType = CHAIN_ROUTERS[chainId];

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

async function redeemPositions(props: RedeemPositionProps): Promise<TransactionReceipt> {
  const result = await toastifyTx(
    () =>
      sendTransaction(
        config,
        redeemFromRouter(
          props.isMainCollateral,
          props.isRedeemToParentCollateral,
          props.chainId,
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

// async function redeemPositions7702(
//   approvalsConfig: UseMissingApprovalsProps,
//   props: RedeemPositionProps,
// ): Promise<TransactionReceipt> {
//   const calls: Execution[] = getApprovals7702(approvalsConfig);

//   calls.push(
//     redeemFromRouter(
//       props.isMainCollateral,
//       props.isRedeemToParentCollateral,
//       props.chainId,
//       props.collateralToken,
//       props.market,
//       props.parentOutcome,
//       props.outcomeIndexes,
//       props.amounts,
//     ),
//   );

//   const result = await toastifyTx(
//     () =>
//       sendCalls(config, {
//         calls,
//       }),
//     {
//       txSent: { title: "Redeeming tokens..." },
//       txSuccess: { title: "Tokens redeemed!" },
//     },
//   );

//   if (!result.status) {
//     throw result.error;
//   }

//   return result.receipt;
// }

// const useRedeemPositions7702 = (approvalsConfig: UseMissingApprovalsProps, onSuccess?: () => unknown) => {
//   const approvals = {
//     data: [],
//     isLoading: false,
//   };

//   return {
//     approvals,
//     redeemPositions: useMutation({
//       mutationFn: (props: RedeemPositionProps) => redeemPositions7702(approvalsConfig, props),
//       onSuccess: async () => {
//         queryClient.invalidateQueries({ queryKey: ["useTokenBalances"] });
//         queryClient.invalidateQueries({ queryKey: ["useTokenBalance"] });
//         // have to wait for market positions to finish invalidate
//         await queryClient.invalidateQueries({ queryKey: ["useMarketPositions"] });
//         queryClient.invalidateQueries({ queryKey: ["useWinningPositions"] });
//         queryClient.invalidateQueries({ queryKey: ["usePositions"] });
//         onSuccess?.();
//       },
//     }),
//   };
// };

export const useRedeemPositions = (approvalsConfig: UseMissingApprovalsProps, onSuccess?: () => void) => {
  // const supports7702 = useCheck7702Support();
  // const redeem7702 = useRedeemPositions7702(approvalsConfig, onSuccess);
  const redeemLegacy = useRedeemPositionsLegacy(approvalsConfig, onSuccess);

  return /*supports7702 ? redeem7702 :*/ redeemLegacy;
};
