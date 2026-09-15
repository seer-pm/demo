import { getOrderBookPoolParams, getV4PoolId, marketSupportsOrderBook, readV4PoolState } from "@seer-pm/order-book";
import { type V4Position, chainSupportsOrderBook, fetchUserV4PositionsByOwner } from "@seer-pm/order-book/v4";
import { USER_V4_POSITIONS_QUERY_KEY } from "@seer-pm/react/hooks/useUserV4Positions";
import { type Market, type SupportedChain, fetchMarkets } from "@seer-pm/sdk";
import { useQuery } from "@tanstack/react-query";
import type { Address } from "viem";
import { useConfig } from "wagmi";

const REFETCH_INTERVAL_MS = 30_000;

export type V4PoolState = { sqrtPriceX96: bigint; tick: number };

export type UserV4LiquidityPosition = {
  position: V4Position;
  market: Market;
  outcomeIndex: number;
  outcomeIsToken0: boolean;
};

export type UserV4LiquidityPositionsData = {
  positions: UserV4LiquidityPosition[];
  /** Current price per pool id; `null` when the pool could not be read. */
  poolStateById: Map<string, V4PoolState | null>;
};

type MarketOutcome = { market: Market; outcomeIndex: number };

/**
 * Maps a position's pool to the market/outcome whose order-book pool key hashes to that pool id.
 * Both currencies are tried because in conditional markets the collateral is itself an outcome
 * token of the parent market; only the child market's key reproduces the pool id.
 */
export function resolvePositionMarket(
  position: V4Position,
  marketsByToken: Map<string, MarketOutcome[]>,
): UserV4LiquidityPosition | null {
  for (const currency of [position.poolKey.currency0, position.poolKey.currency1]) {
    for (const candidate of marketsByToken.get(currency.toLowerCase()) ?? []) {
      if (!marketSupportsOrderBook(candidate.market)) continue;
      const params = getOrderBookPoolParams(candidate.market, candidate.outcomeIndex);
      if (getV4PoolId(params.poolKey).toLowerCase() === position.poolId.toLowerCase()) {
        return { position, ...candidate, outcomeIsToken0: params.outcomeIsToken0 };
      }
    }
  }
  return null;
}

export function indexMarketsByToken(markets: Market[]): Map<string, MarketOutcome[]> {
  const marketsByToken = new Map<string, MarketOutcome[]>();
  for (const market of markets) {
    market.wrappedTokens.forEach((token, outcomeIndex) => {
      const key = token.toLowerCase();
      const list = marketsByToken.get(key) ?? [];
      list.push({ market, outcomeIndex });
      marketsByToken.set(key, list);
    });
  }
  return marketsByToken;
}

/** Every Uniswap V4 order-book position the account holds on the chain, resolved to its market. */
export function useUserV4LiquidityPositions(account: Address | undefined, chainId: SupportedChain) {
  const config = useConfig();
  const orderBookSupported = chainSupportsOrderBook(chainId);

  return useQuery({
    queryKey: [USER_V4_POSITIONS_QUERY_KEY, chainId, account?.toLowerCase(), "portfolio"],
    enabled: Boolean(account) && orderBookSupported,
    refetchInterval: account && orderBookSupported ? REFETCH_INTERVAL_MS : false,
    queryFn: async (): Promise<UserV4LiquidityPositionsData> => {
      if (!account) throw new Error("Account required");

      const rawPositions = await fetchUserV4PositionsByOwner(config, { chainId, owner: account });
      if (rawPositions.length === 0) {
        return { positions: [], poolStateById: new Map() };
      }

      const tokens = Array.from(
        new Set(rawPositions.flatMap((p) => [p.poolKey.currency0.toLowerCase(), p.poolKey.currency1.toLowerCase()])),
      ) as Address[];
      const { markets } = await fetchMarkets({ tokens, chainsList: [String(chainId)], limit: 500 });
      const marketsByToken = indexMarketsByToken(markets);

      const positions = rawPositions
        .map((position) => resolvePositionMarket(position, marketsByToken))
        .filter((p): p is UserV4LiquidityPosition => p !== null);

      const uniquePools = new Map<string, V4Position["poolKey"]>();
      for (const { position } of positions) {
        uniquePools.set(position.poolId.toLowerCase(), position.poolKey);
      }
      const poolStateById = new Map<string, V4PoolState | null>();
      await Promise.all(
        Array.from(uniquePools, async ([poolId, poolKey]) => {
          const state = await readV4PoolState(config, chainId, poolKey);
          poolStateById.set(poolId, state ? { sqrtPriceX96: state.sqrtPriceX96, tick: state.tick } : null);
        }),
      );

      return { positions, poolStateById };
    },
  });
}
