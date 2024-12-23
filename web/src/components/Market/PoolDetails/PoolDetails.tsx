import { CopyButton } from "@/components/CopyButton";
import { Link } from "@/components/Link";
import { Market } from "@/hooks/useMarket";
import { useMarketPools } from "@/hooks/useMarketPools";
import { fetchTokenBalance } from "@/hooks/useTokenBalance";
import { getPoolUrl } from "@/lib/config";
import { displayBalance } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import Button from "../../Form/Button";
import LiquidityBarChart from "./LiquidityBarChart";

export default function PoolDetails({
  market,
  outcomeIndex,
  closeModal,
}: {
  market: Market;
  outcomeIndex: number;
  closeModal?: () => void;
}) {
  const { data = [] } = useMarketPools(market);
  const poolDataPerToken = data[outcomeIndex];
  const { data: poolTokensBalances = [], isLoading } = useQuery<
    | {
        balance0: string;
        balance1: string;
      }[]
    | undefined,
    Error
  >({
    enabled: poolDataPerToken?.length > 0,
    queryKey: ["usePoolTokensBalances", poolDataPerToken?.map((x) => x.id)],
    queryFn: async () => {
      return await Promise.all(
        poolDataPerToken.map(async ({ id, token0, token1 }) => {
          const balance0BigInt = await fetchTokenBalance(token0, id, market.chainId);
          const balance1BigInt = await fetchTokenBalance(token1, id, market.chainId);
          return {
            balance0: displayBalance(balance0BigInt, 18, true),
            balance1: displayBalance(balance1BigInt, 18, true),
          };
        }),
      );
    },
    refetchOnWindowFocus: true,
  });

  if (!poolDataPerToken?.length) return null;
  return (
    <>
      <div className="space-y-3 bg-white max-h-[600px] overflow-y-auto">
        {poolDataPerToken.map((dataPerPool, poolIndex) => {
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
              {poolIndex !== poolDataPerToken.length - 1 && <div className="w-full h-[1px] bg-black-medium mt-2"></div>}
              <LiquidityBarChart market={market} outcomeTokenIndex={outcomeIndex} poolInfo={dataPerPool} />
            </div>
          );
        })}
      </div>
      {closeModal && (
        <div className="text-center mt-6">
          <Button text="Return" variant="secondary" type="button" onClick={closeModal} />
        </div>
      )}
    </>
  );
}
