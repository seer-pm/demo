import type { PoolMeta, UiUserOrder } from "@/components/LimitOrders/ordersShared";
import { type OrderBookPoolKey, chainSupportsOrderBook } from "@seer-pm/order-book";
import {
  type Market,
  type SupportedChain,
  fetchMarkets,
  getActivePrimaryCollateral,
  orderBookGraphQLClient,
} from "@seer-pm/sdk";
import { getSdk as getLimitOrderSdk } from "@seer-pm/sdk/subgraph/limit-order-hook";
import { useQuery } from "@tanstack/react-query";
import type { Address } from "viem";

const REFETCH_INTERVAL_MS = 30_000;

type SubgraphPool = {
  id: Address;
  currency0: Address;
  currency1: Address;
  fee: number;
  tickSpacing: number;
  hooks: Address;
};

function poolKeyFromSubgraph(pool: SubgraphPool): OrderBookPoolKey {
  return {
    currency0: pool.currency0.toLowerCase() as Address,
    currency1: pool.currency1.toLowerCase() as Address,
    fee: Number(pool.fee),
    tickSpacing: Number(pool.tickSpacing),
    hooks: pool.hooks.toLowerCase() as Address,
  };
}

function outcomeTokenFromPool(pool: SubgraphPool, chainId: number): Address | null {
  const collateral = getActivePrimaryCollateral(chainId).address.toLowerCase();
  const c0 = pool.currency0.toLowerCase();
  const c1 = pool.currency1.toLowerCase();
  if (c0 === collateral) return c1 as Address;
  if (c1 === collateral) return c0 as Address;
  return null;
}

function enrichPoolMeta(
  pool: SubgraphPool,
  marketsByToken: Map<string, { market: Market; outcomeIndex: number }>,
  chainId: number,
): PoolMeta | null {
  const outcomeToken = outcomeTokenFromPool(pool, chainId);
  if (!outcomeToken) return null;

  const resolved = marketsByToken.get(outcomeToken.toLowerCase());
  if (!resolved) return null;

  const poolKey = poolKeyFromSubgraph(pool);
  const outcomeIsToken0 = poolKey.currency0 === outcomeToken.toLowerCase();

  return {
    outcomeIndex: resolved.outcomeIndex,
    outcomeIsToken0,
    poolKey,
    market: resolved.market,
  };
}

export type UserLimitOrdersData = {
  open: UiUserOrder[];
  filled: UiUserOrder[];
  poolById: Map<string, PoolMeta>;
};

export function useUserLimitOrders(account: Address | undefined, chainId: SupportedChain) {
  const orderBookSupported = chainSupportsOrderBook(chainId);

  return useQuery({
    queryKey: ["limitOrderHookUserOrders", chainId, "all", account],
    enabled: Boolean(account) && orderBookSupported,
    refetchInterval: account && orderBookSupported ? REFETCH_INTERVAL_MS : false,
    queryFn: async (): Promise<UserLimitOrdersData> => {
      if (!account) throw new Error("Account required");

      const client = orderBookGraphQLClient(chainId);
      if (!client) throw new Error("Limit order subgraph not available");

      const sdk = getLimitOrderSdk(client);
      const owner = account.toLowerCase();
      const chainIdFilter = { _eq: String(chainId) };

      const [openRes, filledRes] = await Promise.all([
        sdk.GetUserOrders({
          limit: 500,
          where: {
            chainId: chainIdFilter,
            owner: { _eq: owner },
            status: { _eq: "OPEN" },
          },
        }),
        sdk.GetUserOrders({
          limit: 500,
          where: {
            chainId: chainIdFilter,
            owner: { _eq: owner },
            status: { _eq: "FILLED" },
          },
        }),
      ]);

      const allRaw = [...openRes.UserOrder, ...filledRes.UserOrder];
      const poolsById = new Map<string, SubgraphPool>();
      for (const o of allRaw) {
        if (!o.pool) continue;
        const id = o.pool.poolId.toLowerCase();
        if (!poolsById.has(id)) {
          poolsById.set(id, {
            id: o.pool.poolId as Address,
            currency0: o.pool.currency0 as Address,
            currency1: o.pool.currency1 as Address,
            fee: o.pool.fee,
            tickSpacing: o.pool.tickSpacing,
            hooks: o.pool.hooks as Address,
          });
        }
      }

      const outcomeTokens = Array.from(
        new Set(
          Array.from(poolsById.values())
            .map((p) => outcomeTokenFromPool(p, chainId))
            .filter((t): t is Address => Boolean(t))
            .map((t) => t.toLowerCase() as Address),
        ),
      );

      const marketsByToken = new Map<string, { market: Market; outcomeIndex: number }>();
      if (outcomeTokens.length > 0) {
        const { markets } = await fetchMarkets({
          tokens: outcomeTokens,
          chainsList: [String(chainId)],
          limit: 500,
        });
        for (const market of markets) {
          for (let i = 0; i < market.wrappedTokens.length; i++) {
            const token = market.wrappedTokens[i].toLowerCase();
            if (!marketsByToken.has(token)) {
              marketsByToken.set(token, { market, outcomeIndex: i });
            }
          }
        }
      }

      const poolById = new Map<string, PoolMeta>();
      for (const [id, pool] of poolsById) {
        const meta = enrichPoolMeta(pool, marketsByToken, chainId);
        if (meta) {
          poolById.set(id, meta);
        }
      }

      const mapOrder = (o: (typeof openRes)["UserOrder"][number]): UiUserOrder | null => {
        if (!o.pool) return null;
        const poolId = o.pool.poolId.toLowerCase() as Address;
        const pool = poolById.get(poolId);
        if (!pool) return null;

        return {
          id: o.id,
          orderId: o.orderId,
          owner: o.owner as Address,
          poolId,
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
        open: openRes.UserOrder.map(mapOrder).filter(Boolean) as UiUserOrder[],
        filled: filledRes.UserOrder.map(mapOrder).filter(Boolean) as UiUserOrder[],
        poolById,
      };
    },
  });
}
