import {
  buildPlaceLimitOrderSteps,
  computeLimitOrderParams,
  getOrderBookPoolParams,
  getStartingPoolState,
  isOrderBookPoolInitialized,
  readV4PoolState,
} from "@seer-pm/order-book/v4";
import type { TxNotifierFn } from "@seer-pm/sdk";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Address } from "viem";
import { useConfig } from "wagmi";
import { sendExecutions } from "./sendExecutions";
import type { Market } from "./useMarketPools";

export interface PlaceV4LimitOrderParams {
  market: Market;
  outcomeIndex: number;
  account: Address;
  swapType: "buy" | "sell";
  limitPrice: number;
  payAmount: bigint;
  /**
   * Price the pool is created at when it does not exist yet: the order then initializes the pool
   * in the same batch. Ignored once the pool is initialized.
   */
  startingPrice?: number;
}

export function usePlaceV4LimitOrder(txNotifier: TxNotifierFn, supports7702: boolean) {
  const config = useConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: PlaceV4LimitOrderParams) => {
      const { market, outcomeIndex, swapType, limitPrice, payAmount, startingPrice } = params;

      const poolParams = getOrderBookPoolParams(market, outcomeIndex);
      const { poolKey, outcomeIsToken0, token0, token1 } = poolParams;

      // Re-check on submit: someone else may have created the pool while the panel was open.
      const poolInitialized = await isOrderBookPoolInitialized(config, market, outcomeIndex);

      let poolState: { tick: number; sqrtPriceX96: bigint };
      if (poolInitialized) {
        const state = await readV4PoolState(config, market.chainId, poolKey);
        if (!state) {
          throw new Error("Pool state unavailable");
        }
        poolState = state;
      } else {
        if (startingPrice === undefined) {
          throw new Error("Starting price is required to create the pool");
        }
        poolState = getStartingPoolState(startingPrice, outcomeIsToken0, poolKey.tickSpacing);
      }

      const orderParams = computeLimitOrderParams({
        chainId: market.chainId,
        poolKey,
        outcomeIsToken0,
        swapType,
        limitPrice,
        payAmount,
        currentTick: poolState.tick,
        sqrtPriceX96: poolState.sqrtPriceX96,
      });

      const payToken = orderParams.payToken === "token0" ? token0 : token1;
      const payAmountActual =
        orderParams.payToken === "token0" ? orderParams.totalPay.amount0 : orderParams.totalPay.amount1;

      // Without 7702 the approval is a separate transaction handled by ApproveButton in the UI.
      const steps = buildPlaceLimitOrderSteps({
        initialize: poolInitialized
          ? undefined
          : { chainId: market.chainId, poolKey, sqrtPriceX96: poolState.sqrtPriceX96 },
        approve: supports7702 ? { token: payToken, amount: payAmountActual, chainId: market.chainId } : undefined,
        place: {
          chainId: market.chainId,
          poolKey,
          tick: orderParams.tick,
          zeroForOne: orderParams.zeroForOne,
          liquidity: orderParams.liquidity,
        },
      });

      return sendExecutions(
        config,
        steps.map((step) => step.execution),
        market.chainId,
        supports7702,
        txNotifier,
        {
          txSent: poolInitialized ? "Placing limit order..." : "Creating pool and placing limit order...",
          txSuccess: poolInitialized ? "Limit order placed." : "Pool created and limit order placed.",
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
      queryClient.invalidateQueries({ queryKey: ["limitOrderHookUserOrders"] });
      // The liquidity chart draws the order as pool liquidity.
      queryClient.invalidateQueries({ queryKey: ["useTicksData", variables.market.id] });
    },
  });
}
