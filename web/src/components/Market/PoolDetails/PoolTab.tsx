import { CopyButton } from "@/components/CopyButton";
import { Link } from "@/components/Link";
import { useGlobalState } from "@/hooks/useGlobalState";
import { BarChartIcon, DensitySmallIcon, SwapIcon } from "@/lib/icons";
import { displayBalance, isTwoStringsEqual } from "@/lib/utils";
import { PoolInfo, fetchTokenBalance, useMarketPools } from "@seer-pm/react";
import { Market, getPoolExplorerUrl } from "@seer-pm/sdk";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useConfig } from "wagmi";
import LiquidityBarChart from "./LiquidityBarChart";
import LiquidityBarChartVertical from "./LiquidityBarChartVertical";

function PoolTabContent({
  market,
  outcomeIndex,
  dataPerPool,
  poolIndex,
  isLoading,
  poolTokensBalances,
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
}) {
  const outcome = market.wrappedTokens[outcomeIndex];
  const { id: poolId, token0Symbol, token1Symbol, token0 } = dataPerPool;
  const [isShowToken0Price, setShowToken0Price] = useState(!!isTwoStringsEqual(token0, outcome));
  const [liquidityChartLayout, setLiquidityChartLayout] = useGlobalState((state) => [
    state.liquidityChartLayout,
    state.setLiquidityChartLayout,
  ]);

  return (
    <div key={poolId} className="space-y-2">
      <div className="flex flex-col lg:flex-row justify-between">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-[14px]">Pool Id:</p>
          <Link
            to={getPoolExplorerUrl(market.chainId, poolId)}
            title={poolId}
            className="hover:underline text-purple-primary"
            target="_blank"
            rel="noopener noreferrer"
          >
            {poolId.slice(0, 6)}...{poolId.slice(-4)}
          </Link>
          <CopyButton textToCopy={poolId} size={18} />
        </div>
        <div className="flex gap-2">
          <p className="font-semibold text-[14px]">Pool Balances:</p>
          {isLoading ? (
            <div className="shimmer-container w-20 h-4"></div>
          ) : (
            <div>
              <p className="text-[14px]">
                {poolTokensBalances[poolIndex]?.balance0 ?? 0} {token0Symbol} /{" "}
                {poolTokensBalances[poolIndex]?.balance1 ?? 0} {token1Symbol}
              </p>
            </div>
          )}
        </div>
      </div>
      <div>
        <div className="text-[14px] flex items-center gap-2 flex-wrap">
          <span className="font-semibold">Liquidity Distribution:</span>{" "}
          {isShowToken0Price ? token0Symbol : token1Symbol}/{isShowToken0Price ? token1Symbol : token0Symbol}{" "}
          <button type="button" onClick={() => setShowToken0Price((state) => !state)}>
            <SwapIcon />
          </button>
          <div className="flex gap-1 lg:ml-auto">
            <button
              type="button"
              onClick={() => setLiquidityChartLayout("horizontal")}
              className={`p-2 rounded ${
                liquidityChartLayout === "horizontal"
                  ? "fill-white bg-purple-primary"
                  : "fill-black-secondary border border-black-secondary"
              }`}
            >
              <BarChartIcon />
            </button>
            <button
              type="button"
              onClick={() => setLiquidityChartLayout("vertical")}
              className={`p-2 rounded ${
                liquidityChartLayout === "vertical"
                  ? "fill-white bg-purple-primary"
                  : "fill-black-secondary border border-black-secondary"
              }`}
            >
              <DensitySmallIcon />
            </button>
          </div>
        </div>
      </div>
      {liquidityChartLayout === "horizontal" ? (
        <LiquidityBarChart
          market={market}
          outcomeTokenIndex={outcomeIndex}
          poolInfo={dataPerPool}
          isShowToken0Price={isShowToken0Price}
        />
      ) : (
        <LiquidityBarChartVertical
          market={market}
          outcomeTokenIndex={outcomeIndex}
          poolInfo={dataPerPool}
          isShowToken0Price={isShowToken0Price}
        />
      )}
    </div>
  );
}

function PoolTab({
  market,
  outcomeIndex,
}: {
  market: Market;
  outcomeIndex: number;
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
    queryKey: ["usePoolTokensBalances", pools?.map((x) => x.id)],
    queryFn: async () => {
      return await Promise.all(
        pools!.map(async ({ id, token0, token1 }) => {
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
    return <p className="mt-3 text-[16px]">No liquidity data.</p>;
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
          market={market}
          outcomeIndex={outcomeIndex}
          dataPerPool={currentPool}
          poolIndex={currentPoolIndex}
          isLoading={isLoading}
          poolTokensBalances={poolTokensBalances}
        />
      )}
    </div>
  );
}

export default PoolTab;
