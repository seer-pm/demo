import { CopyButton } from "@/components/CopyButton";
import { Link } from "@/components/Link";
import { useGlobalState } from "@/hooks/useGlobalState";
import { BarChartIcon, DensitySmallIcon } from "@/lib/icons";
import { displayBalance, displayNumber } from "@/lib/utils";
import { getV4PoolExplorerUrl } from "@seer-pm/order-book";
import { PoolInfo, fetchTokenBalance, useMarketPools } from "@seer-pm/react";
import { Market, getPoolExplorerUrl } from "@seer-pm/sdk";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useConfig } from "wagmi";
import LiquidityBarChart from "./LiquidityBarChart";
import LiquidityBarChartVertical from "./LiquidityBarChartVertical";
import { LiquidityEmptyState } from "./LiquidityStates";

const LAYOUT_OPTIONS = [
  { layout: "horizontal", label: "Depth chart", Icon: BarChartIcon },
  { layout: "vertical", label: "Order book", Icon: DensitySmallIcon },
] as const;

function PoolTabContent({
  market,
  outcomeIndex,
  dataPerPool,
  poolIndex,
  isLoading,
  poolTokensBalances,
  onAddLiquidity,
}: {
  market: Market;
  outcomeIndex: number;
  dataPerPool: PoolInfo;
  poolIndex: number;
  isLoading: boolean;
  poolTokensBalances: {
    balance0: string;
    balance1: string;
  }[];
  onAddLiquidity?: () => void;
}) {
  const { id: poolId, token0Symbol, token1Symbol } = dataPerPool;

  const [liquidityChartLayout, setLiquidityChartLayout] = useGlobalState((state) => [
    state.liquidityChartLayout,
    state.setLiquidityChartLayout,
  ]);

  return (
    <div className="space-y-2">
      <div className="flex flex-col lg:flex-row justify-between gap-2">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-[14px]">Pool Id:</p>
          <Link
            to={
              dataPerPool.version === "v4"
                ? getV4PoolExplorerUrl(market.chainId, poolId)
                : getPoolExplorerUrl(market.chainId, poolId)
            }
            title={poolId}
            className="hover:underline text-purple-primary dark:text-purple-secondary"
            target="_blank"
            rel="noopener noreferrer"
          >
            {poolId.slice(0, 6)}...{poolId.slice(-4)}
          </Link>
          <CopyButton textToCopy={poolId} size={18} />
        </div>
        <div className="flex items-center gap-2">
          <p className="font-semibold text-[14px]">Pool Balances:</p>
          {isLoading ? (
            <div className="shimmer-container w-20 h-4"></div>
          ) : (
            <div>
              <p className="text-[14px] tabular-nums">
                {poolTokensBalances[poolIndex]?.balance0 ?? 0} {token0Symbol} /{" "}
                {poolTokensBalances[poolIndex]?.balance1 ?? 0} {token1Symbol}
              </p>
            </div>
          )}
        </div>
        <fieldset className="flex items-center gap-2">
          <legend className="sr-only">Liquidity view</legend>
          {LAYOUT_OPTIONS.map(({ layout, label, Icon }) => (
            <button
              key={layout}
              type="button"
              aria-label={label}
              aria-pressed={liquidityChartLayout === layout}
              title={label}
              onClick={() => setLiquidityChartLayout(layout)}
              className={`p-2 rounded ${
                liquidityChartLayout === layout
                  ? "fill-white bg-purple-primary"
                  : "fill-black-secondary border border-black-secondary"
              }`}
            >
              <Icon />
            </button>
          ))}
        </fieldset>
      </div>
      {liquidityChartLayout === "horizontal" ? (
        <LiquidityBarChart
          market={market}
          outcomeTokenIndex={outcomeIndex}
          poolInfo={dataPerPool}
          onAddLiquidity={onAddLiquidity}
        />
      ) : (
        <LiquidityBarChartVertical
          market={market}
          outcomeTokenIndex={outcomeIndex}
          poolInfo={dataPerPool}
          onAddLiquidity={onAddLiquidity}
        />
      )}
    </div>
  );
}

function PoolTab({
  market,
  outcomeIndex,
  onAddLiquidity,
}: {
  market: Market;
  outcomeIndex: number;
  onAddLiquidity?: () => void;
}) {
  const config = useConfig();
  const { data = [] } = useMarketPools(market);
  const pools = data[outcomeIndex] as PoolInfo[] | undefined;

  const { data: poolTokensBalances = [], isLoading } = useQuery<
    | {
        balance0: string;
        balance1: string;
      }[]
    | undefined,
    Error
  >({
    enabled: !!pools?.length,
    queryKey: ["usePoolTokensBalances", market.chainId, pools?.map((x) => x.id)],
    queryFn: async () => {
      return await Promise.all(
        pools!.map(async ({ id, token0, token1, version, totalValueLockedToken0, totalValueLockedToken1 }) => {
          if (version === "v4") {
            // V4 reserves live in the PoolManager singleton; the pool id is not an address.
            // TVL comes from the Seer V4 subgraph (see getUniswapV4Pools).
            return {
              balance0: displayNumber(totalValueLockedToken0, 2, true),
              balance1: displayNumber(totalValueLockedToken1, 2, true),
            };
          }
          const balance0BigInt = await fetchTokenBalance(config, token0, id, market.chainId);
          const balance1BigInt = await fetchTokenBalance(config, token1, id, market.chainId);
          return {
            balance0: displayBalance(balance0BigInt, 18, true),
            balance1: displayBalance(balance1BigInt, 18, true),
          };
        }),
      );
    },
    refetchOnWindowFocus: true,
  });

  const [poolTabId, setPoolTabId] = useState(pools?.[0]?.id ?? "");
  useEffect(() => {
    setPoolTabId(pools?.[0]?.id ?? "");
  }, [pools?.[0]?.id]);

  const currentPoolIndex = pools?.findIndex((pool) => pool.id === poolTabId) ?? -1;
  const currentPool = pools?.[currentPoolIndex];

  if (!pools?.length) {
    return (
      <LiquidityEmptyState
        className="mt-3"
        message="There is no liquidity pool for this outcome yet."
        onAddLiquidity={onAddLiquidity}
      />
    );
  }

  return (
    <div className="space-y-3">
      {pools.length > 1 && (
        <div role="tablist" className="tabs tabs-bordered font-semibold overflow-x-auto custom-scrollbar pb-1 flex">
          {pools.map((pool, index) => (
            <button
              key={pool.id}
              type="button"
              role="tab"
              aria-selected={poolTabId === pool.id}
              className={`tab ${poolTabId === pool.id && "tab-active"} w-[100px]`}
              onClick={() => setPoolTabId(pool.id)}
            >
              Pool {index + 1}
            </button>
          ))}
        </div>
      )}
      {currentPool && (
        <PoolTabContent
          key={currentPool.id}
          market={market}
          outcomeIndex={outcomeIndex}
          dataPerPool={currentPool}
          poolIndex={currentPoolIndex}
          isLoading={isLoading}
          poolTokensBalances={poolTokensBalances}
          onAddLiquidity={onAddLiquidity}
        />
      )}
    </div>
  );
}

export default PoolTab;
