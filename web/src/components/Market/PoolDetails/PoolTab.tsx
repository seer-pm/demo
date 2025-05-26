import { CopyButton } from "@/components/CopyButton";
import { Link } from "@/components/Link";
import { PoolInfo } from "@/hooks/useMarketPools";
import { getPoolUrl } from "@/lib/config";
import { Market } from "@/lib/market";
import LiquidityBarChart from "./LiquidityBarChart";

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
  const { id: poolId, token0Symbol, token1Symbol } = dataPerPool;
  return (
    <div key={poolId} className="space-y-2">
      <div>
        <p className="font-semibold">Pool Id</p>
        <div className="flex items-center gap-2">
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
      </div>
      <div>
        <p className="font-semibold">Pool Balances</p>
        {isLoading ? (
          <div className="shimmer-container w-20 h-4"></div>
        ) : (
          <>
            <p className="text-[14px]">
              {poolTokensBalances[poolIndex]?.balance0 ?? 0} {token0Symbol}
            </p>
            <p className="text-[14px]">
              {poolTokensBalances[poolIndex]?.balance1 ?? 0} {token1Symbol}
            </p>
          </>
        )}
      </div>
      <LiquidityBarChart market={market} outcomeTokenIndex={outcomeIndex} poolInfo={dataPerPool} />
    </div>
  );
}

export default PoolTab;
