import { encodeFunctionData } from "viem";
import type { Address } from "viem";
import { futarchyRouterAbi, gnosisRouterAbi, mainnetRouterAbi, routerAbi } from "../generated/contracts/router";
import type { Execution } from "./execution";
import { CHAIN_ROUTERS, type MarketLike } from "./router-addresses";

export function getMergePositionsFutarchyExecution(
  router: Address,
  marketId: Address,
  chainId: number,
  collateralToken: Address,
  amount: bigint,
): Execution {
  return {
    to: router,
    value: 0n,
    data: encodeFunctionData({
      abi: futarchyRouterAbi,
      functionName: "mergePositions",
      args: [marketId, collateralToken, amount],
    }),
    chainId,
  };
}

export function getMergePositionsCollateralExecution(
  router: Address,
  marketId: Address,
  chainId: number,
  collateralToken: Address,
  amount: bigint,
): Execution {
  return {
    to: router,
    value: 0n,
    data: encodeFunctionData({
      abi: routerAbi,
      functionName: "mergePositions",
      args: [collateralToken, marketId, amount],
    }),
    chainId,
  };
}

export function getMergePositionsToDaiExecution(
  router: Address,
  marketId: Address,
  chainId: number,
  amount: bigint,
): Execution {
  return {
    to: router,
    value: 0n,
    data: encodeFunctionData({
      abi: mainnetRouterAbi,
      functionName: "mergeToDai",
      args: [marketId, amount],
    }),
    chainId,
  };
}

export function getMergePositionsToBaseExecution(
  router: Address,
  marketId: Address,
  chainId: number,
  amount: bigint,
): Execution {
  return {
    to: router,
    value: 0n,
    data: encodeFunctionData({
      abi: gnosisRouterAbi,
      functionName: "mergeToBase",
      args: [marketId, amount],
    }),
    chainId,
  };
}

export interface GetMergeExecutionParams {
  router: Address;
  market: MarketLike;
  collateralToken: Address | undefined;
  amount: bigint;
}

export function getMergeExecution(params: GetMergeExecutionParams): Execution {
  const { router, market, collateralToken, amount } = params;
  const { id: marketId, chainId } = market;

  if (market.type === "Futarchy") {
    if (!collateralToken) throw new Error("Missing collateral token to merge");
    return getMergePositionsFutarchyExecution(router, marketId, chainId, collateralToken, amount);
  }
  if (collateralToken) {
    return getMergePositionsCollateralExecution(router, marketId, chainId, collateralToken, amount);
  }
  if (CHAIN_ROUTERS[market.chainId] === "mainnet") {
    return getMergePositionsToDaiExecution(router, marketId, chainId, amount);
  }
  return getMergePositionsToBaseExecution(router, marketId, chainId, amount);
}
