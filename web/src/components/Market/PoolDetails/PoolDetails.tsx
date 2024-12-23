import { Market } from "@/hooks/useMarket";
import { PoolInfo, useMarketPools } from "@/hooks/useMarketPools";
import { fetchTokenBalance } from "@/hooks/useTokenBalance";
import { displayBalance } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import Button from "../../Form/Button";
import PoolTab from "./PoolTab";

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
  const poolDataPerToken = data[outcomeIndex] as PoolInfo[] | undefined;
  const { data: poolTokensBalances = [], isLoading } = useQuery<
    | {
        balance0: string;
        balance1: string;
      }[]
    | undefined,
    Error
  >({
    enabled: !!poolDataPerToken?.length,
    queryKey: ["usePoolTokensBalances", poolDataPerToken?.map((x) => x.id)],
    queryFn: async () => {
      return await Promise.all(
        poolDataPerToken!.map(async ({ id, token0, token1 }) => {
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
  const [poolTabId, setPoolTabId] = useState(poolDataPerToken?.[0]?.id ?? "");
  useEffect(() => {
    setPoolTabId(poolDataPerToken?.[0]?.id ?? "");
  }, [poolDataPerToken?.[0]?.id]);

  const currentPoolIndex = poolDataPerToken?.findIndex((pool) => pool.id === poolTabId) ?? -1;
  const currentPool = poolDataPerToken?.[currentPoolIndex];
  if (!poolDataPerToken?.length) return null;
  return (
    <>
      <div className="space-y-3 bg-white max-h-[600px] overflow-y-auto">
        {poolDataPerToken.length > 1 && (
          <div role="tablist" className="tabs tabs-bordered font-semibold overflow-x-auto custom-scrollbar pb-1 flex">
            {poolDataPerToken.map((pool, index) => (
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
          <PoolTab
            market={market}
            outcomeIndex={outcomeIndex}
            dataPerPool={currentPool}
            poolIndex={currentPoolIndex}
            isLoading={isLoading}
            poolTokensBalances={poolTokensBalances}
          />
        )}
      </div>
      {closeModal && (
        <div className="text-center mt-6">
          <Button text="Return" variant="secondary" type="button" onClick={closeModal} />
        </div>
      )}
    </>
  );
}
