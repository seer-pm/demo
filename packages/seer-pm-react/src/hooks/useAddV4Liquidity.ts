import {
  PERMIT2_ADDRESS,
  buildAddV4LiquiditySteps,
  computePositionAmounts,
  getMintV4PositionMaxAmounts,
  getOrderBookPoolParams,
  getStartingPoolState,
  hasPermit2Allowance,
  isOrderBookPoolInitialized,
  probabilityRangeToTicks,
  readV4PoolState,
  resolveLiquiditySqrtPriceX96,
} from "@seer-pm/order-book/v4";
import type { TxNotifierFn } from "@seer-pm/sdk";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { readContract } from "@wagmi/core";
import type { Address } from "viem";
import { erc20Abi } from "viem";
import { useConfig } from "wagmi";
import { sendExecutions } from "./sendExecutions";
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

/**
 * Adds liquidity to an outcome's V4 pool. With EIP-7702 the missing approvals, the pool
 * initialization and the mint go out as one batch; otherwise they are sent one by one.
 */
export function useAddV4Liquidity(txNotifier: TxNotifierFn, supports7702 = false) {
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
        sqrtPriceX96 = getStartingPoolState(initialPrice, outcomeIsToken0, poolKey.tickSpacing).sqrtPriceX96;
      }

      // The mint calldata tolerates 50 bps of slippage, so the PositionManager may pull slightly
      // more than the quoted amounts. Approve the maximum it can settle, not the quote.
      const maxAmounts = getMintV4PositionMaxAmounts({
        chainId: market.chainId,
        poolKey,
        sqrtPriceX96,
        tickLower,
        tickUpper,
        amount0,
        amount1,
      });

      const approvals = await Promise.all(
        (
          [
            [token0, maxAmounts.amount0],
            [token1, maxAmounts.amount1],
          ] as const
        ).map(async ([token, amount]) => {
          if (amount === 0n) {
            return { token, amount, needsErc20Approval: false, needsPermit2Approval: false };
          }
          const [erc20Allowance, permit2Ok] = await Promise.all([
            readContract(config, {
              address: token,
              abi: erc20Abi,
              functionName: "allowance",
              args: [account, PERMIT2_ADDRESS],
              chainId: market.chainId,
            }),
            hasPermit2Allowance(config, { token, owner: account, amount, chainId: market.chainId }),
          ]);
          return { token, amount, needsErc20Approval: erc20Allowance < amount, needsPermit2Approval: !permit2Ok };
        }),
      );

      const steps = buildAddV4LiquiditySteps({
        approvals,
        initializePool: !poolInitialized,
        mint: {
          chainId: market.chainId,
          poolKey,
          sqrtPriceX96,
          tickLower,
          tickUpper,
          amount0,
          amount1,
          recipient: account,
        },
      });

      return sendExecutions(
        config,
        steps.map((step) => step.execution),
        market.chainId,
        supports7702,
        txNotifier,
        {
          txSent: "Adding liquidity...",
          txSuccess: "Liquidity added.",
          stepTitles: steps.map((step) => step.title),
        },
      );
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
