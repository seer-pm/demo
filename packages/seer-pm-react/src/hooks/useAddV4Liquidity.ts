import {
  PERMIT2_ADDRESS,
  approvePermit2Allowance,
  computePositionAmounts,
  getOrderBookPoolParams,
  getV4PositionManagerAddress,
  hasPermit2Allowance,
  initializeOrderBookPool,
  isOrderBookPoolInitialized,
  mintV4Position,
  probabilityRangeToTicks,
  probabilityToTick,
  readV4PoolState,
  resolveLiquiditySqrtPriceX96,
} from "@seer-pm/order-book/v4";
import type { TxNotifierFn } from "@seer-pm/sdk";
import { getSqrtRatioAtTick } from "@seer-pm/sdk/tick-math";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { readContract, writeContract } from "@wagmi/core";
import type { Address } from "viem";
import { erc20Abi } from "viem";
import { useConfig } from "wagmi";
import type { Market } from "./useMarketPools";

export interface AddV4LiquidityParams {
  market: Market;
  outcomeIndex: number;
  account: Address;
  minPrice: number;
  maxPrice: number;
  amount0: bigint;
  amount1: bigint;
  initialPrice?: number;
}

export function useAddV4Liquidity(txNotifier: TxNotifierFn) {
  const config = useConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: AddV4LiquidityParams) => {
      const { market, outcomeIndex, account, minPrice, maxPrice, amount0, amount1, initialPrice } = params;
      const poolParams = getOrderBookPoolParams(market, outcomeIndex);
      const { poolKey, outcomeIsToken0, token0, token1 } = poolParams;
      const { tickLower, tickUpper } = probabilityRangeToTicks(minPrice, maxPrice, outcomeIsToken0);

      const poolInitialized = await isOrderBookPoolInitialized(config, market, outcomeIndex);

      let sqrtPriceX96: bigint;
      if (poolInitialized) {
        const state = await readV4PoolState(config, market.chainId, poolKey);
        if (!state) {
          throw new Error("Pool state unavailable");
        }
        sqrtPriceX96 = state.sqrtPriceX96;
      } else {
        if (initialPrice === undefined) {
          throw new Error("initialPrice is required when creating a new pool");
        }
        sqrtPriceX96 = getSqrtRatioAtTick(probabilityToTick(initialPrice, outcomeIsToken0, poolKey.tickSpacing));
      }

      const positionManager = getV4PositionManagerAddress(market.chainId);
      if (!positionManager) {
        throw new Error("V4 PositionManager not configured");
      }

      for (const [token, amount] of [
        [token0, amount0],
        [token1, amount1],
      ] as const) {
        if (amount === 0n) continue;

        const allowance = await readContract(config, {
          address: token,
          abi: erc20Abi,
          functionName: "allowance",
          args: [account, PERMIT2_ADDRESS],
          chainId: market.chainId,
        });

        if (allowance < amount) {
          const approveResult = await txNotifier(
            () =>
              writeContract(config, {
                address: token,
                abi: erc20Abi,
                functionName: "approve",
                args: [PERMIT2_ADDRESS, amount],
                chainId: market.chainId,
              }),
            {
              txSent: { title: "Approving token for Permit2..." },
              txSuccess: { title: "Token approved." },
            },
          );
          if (!approveResult.status) {
            throw approveResult.error;
          }
        }

        const permit2Params = {
          token,
          owner: account,
          amount,
          chainId: market.chainId,
        };
        if (!(await hasPermit2Allowance(config, permit2Params))) {
          const permit2Result = await txNotifier(() => approvePermit2Allowance(config, permit2Params), {
            txSent: { title: "Approving Permit2..." },
            txSuccess: { title: "Permit2 approved." },
          });
          if (!permit2Result.status) {
            throw permit2Result.error;
          }
        }
      }

      if (!poolInitialized) {
        const initResult = await txNotifier(
          () =>
            initializeOrderBookPool(config, {
              market,
              outcomeIndex,
              sqrtPriceX96,
            }),
          {
            txSent: { title: "Initializing pool..." },
            txSuccess: { title: "Pool initialized." },
          },
        );
        if (!initResult.status) {
          throw initResult.error;
        }
      }

      const mintResult = await txNotifier(
        () =>
          mintV4Position(config, {
            chainId: market.chainId,
            poolKey,
            sqrtPriceX96,
            tickLower,
            tickUpper,
            amount0,
            amount1,
            recipient: account,
          }),
        {
          txSent: { title: "Adding liquidity..." },
          txSuccess: { title: "Liquidity added." },
        },
      );

      if (!mintResult.status) {
        throw mintResult.error;
      }

      return mintResult.receipt.transactionHash;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["useMarketPools", variables.market.id] });
      queryClient.invalidateQueries({
        queryKey: ["useIsOrderBookPoolInitialized", variables.market.id, variables.outcomeIndex],
      });
      queryClient.invalidateQueries({
        queryKey: ["useV4PoolState", variables.market.id, variables.outcomeIndex],
      });
      queryClient.invalidateQueries({ queryKey: ["useMarketHasLiquidity", variables.market.id] });
      queryClient.invalidateQueries({ queryKey: ["useTokenBalance"] });
    },
  });
}

export function computeV4DerivedAmounts(
  market: Market,
  outcomeIndex: number,
  {
    minPrice,
    maxPrice,
    amount0,
    amount1,
    initialPrice,
    poolSqrtPriceX96,
    token0Decimals = 18,
    token1Decimals = 18,
  }: {
    minPrice: number;
    maxPrice: number;
    amount0?: bigint;
    amount1?: bigint;
    initialPrice?: number;
    poolSqrtPriceX96?: bigint;
    token0Decimals?: number;
    token1Decimals?: number;
  },
) {
  const poolParams = getOrderBookPoolParams(market, outcomeIndex);
  const { poolKey, outcomeIsToken0 } = poolParams;
  const { tickLower, tickUpper } = probabilityRangeToTicks(minPrice, maxPrice, outcomeIsToken0);

  const sqrtPriceX96 = resolveLiquiditySqrtPriceX96({
    poolKey,
    outcomeIsToken0,
    initialPrice,
    poolSqrtPriceX96,
  });

  return computePositionAmounts({
    chainId: market.chainId,
    poolKey,
    sqrtPriceX96,
    tickLower,
    tickUpper,
    amount0,
    amount1,
    token0Decimals,
    token1Decimals,
  });
}
