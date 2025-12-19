import { CopyButton } from "@/components/CopyButton";
import { Link } from "@/components/Link";
import { PoolInfo } from "@/hooks/useMarketPools";
import { getPoolUrl } from "@/lib/config";
import { BarChartIcon, DensitySmallIcon, SwapIcon } from "@/lib/icons";
import { Market } from "@/lib/market";
import { isTwoStringsEqual } from "@/lib/utils";
import { useState } from "react";
import LiquidityBarChart from "./LiquidityBarChart";
import LiquidityBarChartVertical from "./LiquidityBarChartVertical";

function PoolTab({
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
  const [activeLayout, setActiveLayout] = useState("horizontal");
  return (
    <div key={poolId} className="space-y-2">
      <div>
        <div className="flex items-center gap-2">
          <p className="font-semibold text-[14px]">Pool Id:</p>
          <Link
            to={getPoolUrl(market.chainId, poolId)}
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
                {poolTokensBalances[poolIndex]?.balance0 ?? 0} {token0Symbol}
              </p>
              <p className="text-[14px]">
                {poolTokensBalances[poolIndex]?.balance1 ?? 0} {token1Symbol}
              </p>
            </div>
          )}
        </div>
      </div>
      <div>
        <div className="font-semibold text-[14px] flex items-center gap-2 flex-wrap">
          Liquidity Distribution: {isShowToken0Price ? token0Symbol : token1Symbol}/
          {isShowToken0Price ? token1Symbol : token0Symbol}{" "}
          <button type="button" onClick={() => setShowToken0Price((state) => !state)}>
            <SwapIcon />
          </button>
          <div className="flex gap-1 ml-auto">
            <button
              type="button"
              onClick={() => setActiveLayout("horizontal")}
              className={`p-2 rounded ${
                activeLayout === "horizontal"
                  ? "fill-white bg-purple-primary"
                  : "fill-black-secondary border border-black-secondary"
              }`}
            >
              <BarChartIcon />
            </button>
            <button
              type="button"
              onClick={() => setActiveLayout("vertical")}
              className={`p-2 rounded ${
                activeLayout === "vertical"
                  ? "fill-white bg-purple-primary"
                  : "fill-black-secondary border border-black-secondary"
              }`}
            >
              <DensitySmallIcon />
            </button>
          </div>
        </div>
      </div>
      {activeLayout === "horizontal" ? (
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

export default PoolTab;
