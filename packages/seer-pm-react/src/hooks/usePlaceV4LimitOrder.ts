import {
  buildPlaceLimitOrderCalls7702,
  computeLimitOrderParams,
  getOrderBookPoolParams,
  getPlaceLimitOrderExecution,
  isOrderBookPoolInitialized,
  readV4PoolState,
} from "@seer-pm/order-book/v4";
import type { TxNotifierFn } from "@seer-pm/sdk";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { sendCalls, sendTransaction } from "@wagmi/core";
import type { Address } from "viem";
import { useConfig } from "wagmi";
import type { Market } from "./useMarketPools";

export interface PlaceV4LimitOrderParams {
  market: Market;
  outcomeIndex: number;
  account: Address;
  swapType: "buy" | "sell";
  limitPrice: number;
  payAmount: bigint;
  payDecimals: number;
  receiveDecimals: number;
}

export function usePlaceV4LimitOrder(txNotifier: TxNotifierFn, supports7702: boolean) {
  const config = useConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: PlaceV4LimitOrderParams) => {
      const { market, outcomeIndex, swapType, limitPrice, payAmount, payDecimals, receiveDecimals } = params;

      const poolInitialized = await isOrderBookPoolInitialized(config, market, outcomeIndex);
      if (!poolInitialized) {
        throw new Error("Pool is not initialized. Add liquidity first.");
      }

      const poolParams = getOrderBookPoolParams(market, outcomeIndex);
      const { poolKey, outcomeIsToken0, token0, token1 } = poolParams;

      const state = await readV4PoolState(config, market.chainId, poolKey);
      if (!state) {
        throw new Error("Pool state unavailable");
      }

      const orderParams = computeLimitOrderParams({
        chainId: market.chainId,
        poolKey,
        outcomeIsToken0,
        swapType,
        limitPrice,
        payAmount,
        currentTick: state.tick,
        sqrtPriceX96: state.sqrtPriceX96,
        payDecimals,
        receiveDecimals,
      });

      const payToken = orderParams.payToken === "token0" ? token0 : token1;
      const payAmountActual =
        orderParams.payToken === "token0" ? orderParams.totalPay.amount0 : orderParams.totalPay.amount1;

      const placeParams = {
        chainId: market.chainId,
        poolKey,
        tick: orderParams.tick,
        zeroForOne: orderParams.zeroForOne,
        liquidity: orderParams.liquidity,
      };

      if (supports7702) {
        const calls = buildPlaceLimitOrderCalls7702({
          token: payToken,
          amount: payAmountActual,
          ...placeParams,
        });

        const placeResult = await txNotifier(
          () =>
            sendCalls(config, {
              calls,
              chainId: market.chainId,
            }),
          {
            txSent: { title: "Placing limit order..." },
            txSuccess: { title: "Limit order placed." },
          },
        );

        if (!placeResult.status) {
          throw placeResult.error;
        }

        return placeResult.receipt.transactionHash;
      }

      // Legacy: approval is handled by ApproveButton in the UI.
      const execution = getPlaceLimitOrderExecution(placeParams);
      const placeResult = await txNotifier(() => sendTransaction(config, execution), {
        txSent: { title: "Placing limit order..." },
        txSuccess: { title: "Limit order placed." },
      });

      if (!placeResult.status) {
        throw placeResult.error;
      }

      return placeResult.receipt.transactionHash;
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
    },
  });
}
