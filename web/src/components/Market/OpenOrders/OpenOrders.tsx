import Button from "@/components/Form/Button";
import { toastifyTx } from "@/lib/toastify";
import { displayBalance, displayNumber } from "@/lib/utils";
import { config as wagmiConfig } from "@/wagmi";
import {
  type Market,
  getActivePrimaryCollateral,
  getOrderBookPoolParams,
  getSqrtRatioAtTick,
  getV4PoolId,
  orderBookGraphQLClient,
} from "@seer-pm/sdk";
import { limitOrderHookAbi } from "@seer-pm/sdk/contracts/order-book";
import {
  type LimitOrderWithdrawAmounts,
  createV4PoolInstance,
  getLimitOrderWithdrawAmounts,
  getOutcomePriceAtTick,
} from "@seer-pm/sdk/order-book";
import { UserOrderStatus, getSdk as getLimitOrderSdk } from "@seer-pm/sdk/subgraph/limit-order-hook";
import { useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { Position } from "@uniswap/v4-sdk";
import { writeContract } from "@wagmi/core";
import { useMemo } from "react";
import { Address } from "viem";
import { useAccount, useConfig } from "wagmi";

type UiUserOrder = {
  id: string;
  orderId: string;
  owner: Address;
  poolId: Address;
  outcomeIndex: number;
  outcomeIsToken0: boolean;
  tickLower: number;
  zeroForOne: boolean;
  status: UserOrderStatus;
  liquidity: string;
  placedAtBlock: string;
  updatedAtBlock: string;
};

type PoolMeta = {
  outcomeIndex: number;
  outcomeIsToken0: boolean;
  poolKey: ReturnType<typeof getOrderBookPoolParams>["poolKey"];
};

function getOrderSideLabel(zeroForOne: boolean, outcomeIsToken0: boolean): "Buy" | "Sell" {
  return zeroForOne === !outcomeIsToken0 ? "Buy" : "Sell";
}

function formatLiquidityCompact(liquidity: bigint): string {
  const s = liquidity.toString();
  if (s.length <= 6) return s;

  if (liquidity <= BigInt(Number.MAX_SAFE_INTEGER)) {
    return displayNumber(Number(liquidity), 2, true);
  }

  return `${s[0]}.${s.slice(1, 3)}e${s.length - 1}`;
}

function formatOpenOrderSize(order: UiUserOrder, pool: PoolMeta, market: Market): string {
  const liquidity = BigInt(order.liquidity);
  if (liquidity === 0n) return "0";

  const collateral = getActivePrimaryCollateral(market.chainId);
  const payDecimals = order.zeroForOne
    ? pool.outcomeIsToken0
      ? 18
      : collateral.decimals
    : pool.outcomeIsToken0
      ? collateral.decimals
      : 18;
  const paySymbol = order.zeroForOne
    ? pool.outcomeIsToken0
      ? (market.outcomes[pool.outcomeIndex] ?? "Outcome")
      : collateral.symbol
    : pool.outcomeIsToken0
      ? collateral.symbol
      : (market.outcomes[pool.outcomeIndex] ?? "Outcome");

  try {
    const tickUpper = order.tickLower + pool.poolKey.tickSpacing;
    const depositTick = order.zeroForOne ? order.tickLower - pool.poolKey.tickSpacing : tickUpper;
    const sqrtPriceX96 = getSqrtRatioAtTick(depositTick);
    const poolInstance = createV4PoolInstance(market.chainId, pool.poolKey, sqrtPriceX96, 0n, depositTick);
    const position = new Position({
      pool: poolInstance,
      liquidity: order.liquidity,
      tickLower: order.tickLower,
      tickUpper,
    });
    const payAmount = order.zeroForOne
      ? BigInt(position.mintAmounts.amount0.toString())
      : BigInt(position.mintAmounts.amount1.toString());

    if (payAmount > 0n) {
      return `${displayBalance(payAmount, payDecimals)} ${paySymbol}`;
    }
  } catch {
    // Fall back to compact liquidity units.
  }

  return formatLiquidityCompact(liquidity);
}

function formatWithdrawAmounts(amounts: LimitOrderWithdrawAmounts, pool: PoolMeta, market: Market): string {
  const collateral = getActivePrimaryCollateral(market.chainId);
  const outcomeLabel = market.outcomes[pool.outcomeIndex] ?? "Outcome";
  const parts: string[] = [];

  if (amounts.amount0 > 0n) {
    const decimals = pool.outcomeIsToken0 ? 18 : collateral.decimals;
    const symbol = pool.outcomeIsToken0 ? outcomeLabel : collateral.symbol;
    parts.push(`${displayBalance(amounts.amount0, decimals)} ${symbol}`);
  }

  if (amounts.amount1 > 0n) {
    const decimals = pool.outcomeIsToken0 ? collateral.decimals : 18;
    const symbol = pool.outcomeIsToken0 ? collateral.symbol : outcomeLabel;
    parts.push(`${displayBalance(amounts.amount1, decimals)} ${symbol}`);
  }

  return parts.join(" + ") || "0";
}

function formatOrderSize(
  order: UiUserOrder,
  pool: PoolMeta,
  market: Market,
  withdrawAmounts?: LimitOrderWithdrawAmounts,
): string {
  if (withdrawAmounts) {
    return formatWithdrawAmounts(withdrawAmounts, pool, market);
  }

  return formatOpenOrderSize(order, pool, market);
}

function OrdersTable({
  orders,
  market,
  poolById,
  withdrawAmountsByOrderId,
  withdrawAmountsLoadingByOrderId,
  amountColumnLabel,
  actionLabel,
  onAction,
}: {
  orders: UiUserOrder[];
  market: Market;
  poolById: Map<string, PoolMeta>;
  withdrawAmountsByOrderId?: Map<string, LimitOrderWithdrawAmounts>;
  withdrawAmountsLoadingByOrderId?: Map<string, boolean>;
  amountColumnLabel: string;
  actionLabel: string;
  onAction: (order: UiUserOrder) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="simple-table">
        <thead>
          <tr>
            <th>Outcome</th>
            <th>Side</th>
            <th>Limit price</th>
            <th>{amountColumnLabel}</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => {
            const pool = poolById.get(o.poolId.toLowerCase());
            const limitPrice = getOutcomePriceAtTick(o.tickLower, o.outcomeIsToken0);
            const withdrawAmounts = withdrawAmountsByOrderId?.get(o.id);
            const isWithdrawLoading = withdrawAmountsLoadingByOrderId?.get(o.id);
            const sizeLabel = pool
              ? isWithdrawLoading
                ? "…"
                : formatOrderSize(o, pool, market, withdrawAmounts)
              : undefined;

            return (
              <tr key={o.id}>
                <td>{market.outcomes[o.outcomeIndex] ?? `Outcome ${o.outcomeIndex}`}</td>
                <td>{getOrderSideLabel(o.zeroForOne, o.outcomeIsToken0)}</td>
                <td>{Number.isFinite(limitPrice) ? limitPrice.toFixed(4) : "-"}</td>
                <td>{sizeLabel ?? "-"}</td>
                <td className="text-right">
                  <Button size="small" text={actionLabel} onClick={() => onAction(o)} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function OpenOrders({ market }: { market: Market }) {
  const { address } = useAccount();
  const queryClient = useQueryClient();
  const config = useConfig();

  const poolById = useMemo(() => {
    const map = new Map<string, PoolMeta>();

    for (let outcomeIndex = 0; outcomeIndex < market.wrappedTokens.length; outcomeIndex++) {
      const params = getOrderBookPoolParams(market, outcomeIndex);
      const poolId = getV4PoolId(params.poolKey);
      map.set(poolId.toLowerCase(), {
        outcomeIndex,
        outcomeIsToken0: params.outcomeIsToken0,
        poolKey: params.poolKey,
      });
    }

    return map;
  }, [market]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["limitOrderHookUserOrders", market.chainId, market.id, address],
    enabled: Boolean(address),
    queryFn: async () => {
      if (!address) throw new Error("Wallet not connected");

      const client = orderBookGraphQLClient(market.chainId);
      if (!client) throw new Error("Limit order subgraph not available");

      const sdk = getLimitOrderSdk(client);
      const poolIds = Array.from(poolById.keys());
      if (poolIds.length === 0) return { open: [] as UiUserOrder[], filled: [] as UiUserOrder[] };

      const owner = address.toLowerCase() as Address;

      const [openRes, filledRes] = await Promise.all([
        sdk.GetUserOrders({
          first: 500,
          where: {
            owner,
            pool_in: poolIds,
            status_in: [UserOrderStatus.Open],
          },
        }),
        sdk.GetUserOrders({
          first: 500,
          where: {
            owner,
            pool_in: poolIds,
            status_in: [UserOrderStatus.Filled],
          },
        }),
      ]);

      const mapOrder = (o: (typeof openRes)["userOrders"][number]): UiUserOrder | null => {
        const pool = poolById.get(o.pool.id.toLowerCase());
        if (!pool) return null;

        return {
          id: o.id,
          orderId: o.orderId,
          owner: o.owner,
          poolId: o.pool.id,
          outcomeIndex: pool.outcomeIndex,
          outcomeIsToken0: pool.outcomeIsToken0,
          tickLower: o.tickLower,
          zeroForOne: o.zeroForOne,
          status: o.status,
          liquidity: o.liquidity,
          placedAtBlock: o.placedAtBlock,
          updatedAtBlock: o.updatedAtBlock,
        };
      };

      return {
        open: openRes.userOrders.map(mapOrder).filter(Boolean) as UiUserOrder[],
        filled: filledRes.userOrders.map(mapOrder).filter(Boolean) as UiUserOrder[],
      };
    },
  });

  const filledOrders = data?.filled ?? [];

  const withdrawAmountQueries = useQueries({
    queries: filledOrders.map((order) => ({
      queryKey: ["limitOrderWithdrawAmounts", market.chainId, order.orderId, address],
      enabled: Boolean(address),
      queryFn: async () => {
        if (!address) return null;
        return getLimitOrderWithdrawAmounts(config, {
          chainId: market.chainId,
          orderId: BigInt(order.orderId),
          owner: address,
        });
      },
    })),
  });

  const withdrawAmountsByOrderId = useMemo(() => {
    const map = new Map<string, LimitOrderWithdrawAmounts>();
    filledOrders.forEach((order, index) => {
      const amounts = withdrawAmountQueries[index]?.data;
      if (amounts) {
        map.set(order.id, amounts);
      }
    });
    return map;
  }, [filledOrders, withdrawAmountQueries]);

  const withdrawAmountsLoadingByOrderId = useMemo(() => {
    const map = new Map<string, boolean>();
    filledOrders.forEach((order, index) => {
      const query = withdrawAmountQueries[index];
      if (query?.isLoading || query?.isFetching) {
        map.set(order.id, true);
      }
    });
    return map;
  }, [filledOrders, withdrawAmountQueries]);

  const cancelOrder = async (order: UiUserOrder) => {
    if (!address) throw new Error("Connect your wallet");
    const pool = poolById.get(order.poolId.toLowerCase());
    if (!pool) throw new Error("Unknown pool");

    const result = await toastifyTx(
      () =>
        writeContract(wagmiConfig, {
          address: pool.poolKey.hooks,
          abi: limitOrderHookAbi,
          functionName: "cancelOrder",
          args: [pool.poolKey, order.tickLower, order.zeroForOne, address],
          chainId: market.chainId,
        }),
      {
        txSent: { title: "Cancelling order..." },
        txSuccess: { title: "Order cancelled." },
      },
    );

    if (!result.status) throw result.error;
    await queryClient.invalidateQueries({ queryKey: ["limitOrderHookUserOrders", market.chainId, market.id, address] });
  };

  const withdraw = async (order: UiUserOrder) => {
    if (!address) throw new Error("Connect your wallet");
    const pool = poolById.get(order.poolId.toLowerCase());
    if (!pool) throw new Error("Unknown pool");

    const result = await toastifyTx(
      () =>
        writeContract(wagmiConfig, {
          address: pool.poolKey.hooks,
          abi: limitOrderHookAbi,
          functionName: "withdraw",
          args: [BigInt(order.orderId), address],
          chainId: market.chainId,
        }),
      {
        txSent: { title: "Withdrawing..." },
        txSuccess: { title: "Withdraw completed." },
      },
    );

    if (!result.status) throw result.error;
    await queryClient.invalidateQueries({ queryKey: ["limitOrderHookUserOrders", market.chainId, market.id, address] });
    await queryClient.invalidateQueries({ queryKey: ["limitOrderWithdrawAmounts"] });
  };

  if (!address) {
    return <div className="text-[14px] opacity-70">Connect your wallet to see your open orders.</div>;
  }

  if (isLoading) {
    return <div className="text-[14px] opacity-70">Loading open orders…</div>;
  }

  if (error) {
    return <div className="text-[14px] text-error">Failed to load open orders: {(error as Error).message}</div>;
  }

  const open = data?.open ?? [];
  const filled = data?.filled ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="text-[16px] font-semibold mb-3">Open</div>
        {open.length === 0 ? (
          <div className="text-[14px] opacity-70">No open orders.</div>
        ) : (
          <OrdersTable
            orders={open}
            market={market}
            poolById={poolById}
            amountColumnLabel="Size"
            actionLabel="Cancel"
            onAction={cancelOrder}
          />
        )}
      </div>

      <div>
        <div className="text-[16px] font-semibold mb-3">Filled (withdrawable)</div>
        {filled.length === 0 ? (
          <div className="text-[14px] opacity-70">No filled orders to withdraw.</div>
        ) : (
          <OrdersTable
            orders={filled}
            market={market}
            poolById={poolById}
            withdrawAmountsByOrderId={withdrawAmountsByOrderId}
            withdrawAmountsLoadingByOrderId={withdrawAmountsLoadingByOrderId}
            amountColumnLabel="Withdrawable"
            actionLabel="Withdraw"
            onAction={withdraw}
          />
        )}
      </div>
    </div>
  );
}
