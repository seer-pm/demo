import { encodeFunctionData } from "viem";
import type { Address } from "viem";
import {
  conditionalRouterAbi,
  futarchyRouterAbi,
  gnosisRouterAbi,
  mainnetRouterAbi,
  routerAbi,
} from "../generated/generated-router";
import { COLLATERAL_TOKENS } from "./collateral";
import type { Execution } from "./execution";
import { CHAIN_ROUTERS, type MarketLike, getRedeemRouter } from "./router-addresses";

export function getRedeemPositionsFutarchyExecution(
  router: Address,
  marketId: Address,
  chainId: number,
  amount1: bigint,
  amount2: bigint,
): Execution {
  return {
    to: router,
    value: 0n,
    data: encodeFunctionData({
      abi: futarchyRouterAbi,
      functionName: "redeemProposal",
      args: [marketId, amount1, amount2],
    }),
    chainId,
  };
}

export function getRedeemPositionsConditionalToCollateralExecution(
  router: Address,
  marketId: Address,
  chainId: number,
  collateralToken: Address,
  outcomeIndexes: bigint[],
  parentOutcomeIndexes: bigint[],
  amounts: bigint[],
): Execution {
  return {
    to: router,
    value: 0n,
    data: encodeFunctionData({
      abi: conditionalRouterAbi,
      functionName: "redeemConditionalToCollateral",
      args: [collateralToken, marketId, outcomeIndexes, parentOutcomeIndexes, amounts],
    }),
    chainId,
  };
}

export function getRedeemPositionsCollateralExecution(
  router: Address,
  marketId: Address,
  chainId: number,
  collateralToken: Address,
  outcomeIndexes: bigint[],
  amounts: bigint[],
): Execution {
  return {
    to: router,
    value: 0n,
    data: encodeFunctionData({
      abi: routerAbi,
      functionName: "redeemPositions",
      args: [collateralToken, marketId, outcomeIndexes, amounts],
    }),
    chainId,
  };
}

export function getRedeemPositionsToDaiExecution(
  router: Address,
  marketId: Address,
  chainId: number,
  outcomeIndexes: bigint[],
  amounts: bigint[],
): Execution {
  return {
    to: router,
    value: 0n,
    data: encodeFunctionData({
      abi: mainnetRouterAbi,
      functionName: "redeemToDai",
      args: [marketId, outcomeIndexes, amounts],
    }),
    chainId,
  };
}

export function getRedeemPositionsToBaseExecution(
  router: Address,
  marketId: Address,
  chainId: number,
  outcomeIndexes: bigint[],
  amounts: bigint[],
): Execution {
  return {
    to: router,
    value: 0n,
    data: encodeFunctionData({
      abi: gnosisRouterAbi,
      functionName: "redeemToBase",
      args: [marketId, outcomeIndexes, amounts],
    }),
    chainId,
  };
}

export interface GetRedeemExecutionParams {
  market: MarketLike;
  collateralToken: Address | undefined;
  parentOutcome: bigint;
  outcomeIndexes: bigint[];
  amounts: bigint[];
  isRedeemToParentCollateral: boolean;
}

export function getRedeemExecution(params: GetRedeemExecutionParams): Execution {
  const { market, collateralToken, parentOutcome, outcomeIndexes, amounts, isRedeemToParentCollateral } = params;
  const router = getRedeemRouter(isRedeemToParentCollateral, market);
  const { id: marketId, chainId } = market;

  if (market.type === "Futarchy") {
    return getRedeemPositionsFutarchyExecution(router, marketId, chainId, amounts[0], amounts[1]);
  }
  if (isRedeemToParentCollateral) {
    const collateral = COLLATERAL_TOKENS[market.chainId].primary.address;
    if (!collateral) throw new Error("Missing primary collateral for chain");
    return getRedeemPositionsConditionalToCollateralExecution(
      router,
      marketId,
      chainId,
      collateral,
      outcomeIndexes,
      [parentOutcome],
      amounts,
    );
  }
  if (collateralToken) {
    return getRedeemPositionsCollateralExecution(router, marketId, chainId, collateralToken, outcomeIndexes, amounts);
  }
  if (CHAIN_ROUTERS[market.chainId] === "mainnet") {
    return getRedeemPositionsToDaiExecution(router, marketId, chainId, outcomeIndexes, amounts);
  }
  return getRedeemPositionsToBaseExecution(router, marketId, chainId, outcomeIndexes, amounts);
}
