import { encodeFunctionData } from "viem";
import type { Address } from "viem";
import { futarchyRouterAbi, gnosisRouterAbi, mainnetRouterAbi, routerAbi } from "../generated/contracts/router";
import type { Execution } from "./execution";
import { CHAIN_ROUTERS, type MarketLike } from "./router-addresses";

export function getSplitPositionFutarchyExecution(
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
      functionName: "splitPosition",
      args: [marketId, collateralToken, amount],
    }),
    chainId,
  };
}

export function getSplitPositionCollateralExecution(
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
      functionName: "splitPosition",
      args: [collateralToken, marketId, amount],
    }),
    chainId,
  };
}

export function getSplitPositionToDaiExecution(
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
      functionName: "splitFromDai",
      args: [marketId, amount],
    }),
    chainId,
  };
}

export function getSplitPositionToBaseExecution(
  router: Address,
  marketId: Address,
  chainId: number,
  amount: bigint,
): Execution {
  return {
    to: router,
    value: amount,
    data: encodeFunctionData({
      abi: gnosisRouterAbi,
      functionName: "splitFromBase",
      args: [marketId],
    }),
    chainId,
  };
}

export interface GetSplitExecutionParams {
  router: Address;
  market: MarketLike;
  collateralToken: Address | undefined;
  amount: bigint;
}

export function getSplitExecution(params: GetSplitExecutionParams): Execution {
  const { router, market, collateralToken, amount } = params;
  const { id: marketId, chainId } = market;

  if (market.type === "Futarchy") {
    if (!collateralToken) throw new Error("Missing collateral token to split");
    return getSplitPositionFutarchyExecution(router, marketId, chainId, collateralToken, amount);
  }
  if (collateralToken) {
    return getSplitPositionCollateralExecution(router, marketId, chainId, collateralToken, amount);
  }
  if (CHAIN_ROUTERS[market.chainId] === "mainnet") {
    return getSplitPositionToDaiExecution(router, marketId, chainId, amount);
  }
  return getSplitPositionToBaseExecution(router, marketId, chainId, amount);
}
