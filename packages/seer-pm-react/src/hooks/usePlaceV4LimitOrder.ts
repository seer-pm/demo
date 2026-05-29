import type { TxNotifierFn } from "@seer-pm/sdk";
import { getOrderBookPoolParams, isOrderBookPoolInitialized, readV4PoolState } from "@seer-pm/sdk";
import {
  computeLimitOrderParams,
  ensureLimitOrderAllowance,
  getLimitOrderHookAddress,
  placeLimitOrder,
} from "@seer-pm/sdk/order-book";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { readContract, writeContract } from "@wagmi/core";
import type { Address } from "viem";
import { erc20Abi, maxUint256 } from "viem";
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

export function usePlaceV4LimitOrder(txNotifier: TxNotifierFn) {
  const config = useConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: PlaceV4LimitOrderParams) => {
      const { market, outcomeIndex, account, swapType, limitPrice, payAmount, payDecimals, receiveDecimals } = params;

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

      const hookAddress = getLimitOrderHookAddress(market.chainId);
      if (!hookAddress) {
        throw new Error("LimitOrderHook not configured");
      }

      const allowance = await readContract(config, {
        address: payToken,
        abi: erc20Abi,
        functionName: "allowance",
        args: [account, hookAddress],
        chainId: market.chainId,
      });

      if (allowance < payAmountActual) {
        const approveResult = await txNotifier(
          () =>
            writeContract(config, {
              address: payToken,
              abi: erc20Abi,
              functionName: "approve",
              args: [hookAddress, maxUint256],
              chainId: market.chainId,
            }),
          {
            txSent: { title: "Approving token..." },
            txSuccess: { title: "Token approved." },
          },
        );
        if (!approveResult.status) {
          throw approveResult.error;
        }
      }

      await ensureLimitOrderAllowance(config, {
        token: payToken,
        owner: account,
        amount: payAmountActual,
        chainId: market.chainId,
      });

      const placeResult = await txNotifier(
        () =>
          placeLimitOrder(config, {
            chainId: market.chainId,
            poolKey,
            tick: orderParams.tick,
            zeroForOne: orderParams.zeroForOne,
            liquidity: orderParams.liquidity,
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
