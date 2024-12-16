import { CopyButton } from "@/components/CopyButton";
import { Link } from "@/components/Link";
import { useLiquidityChartData } from "@/hooks/liquidity/useLiquidityChartData";
import { Market } from "@/hooks/useMarket";
import { PoolInfo, useMarketPools } from "@/hooks/useMarketPools";
import { fetchTokenBalance } from "@/hooks/useTokenBalance";
import { getPoolUrl } from "@/lib/config";
import { SwapIcon } from "@/lib/icons";
import { displayBalance, formatBigNumbers, isTwoStringsEqual } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import ReactECharts from "echarts-for-react";
import { useState } from "react";
import { Address } from "viem";
import Button from "../Form/Button";

function LiquidityBarChart({
  outcome,
  chartData,
  poolInfo,
}: {
  outcome: Address;
  chartData: {
    price0List: string[];
    price1List: string[];
    amount0List: number[];
    amount1List: number[];
  };
  poolInfo: PoolInfo;
}) {
  const { token0Symbol, token1Symbol, token1Price, token0Price, token0 } = poolInfo;
  const [isShowToken0Price, setShowToken0Price] = useState(isTwoStringsEqual(token0, outcome));
  const currentOutcomePrice = isShowToken0Price ? token1Price : token0Price;
  const priceList = isShowToken0Price ? chartData.price0List : [...chartData.price1List].reverse();
  const amount0List = isShowToken0Price ? chartData.amount0List : [...chartData.amount0List].reverse();
  const amount1List = isShowToken0Price ? chartData.amount1List : [...chartData.amount1List].reverse();
  const amount0Data = priceList.map((_, index) => {
    return [index + 0.5, amount0List[index]];
  });
  const amount1Data = priceList.map((_, index) => {
    return [index + 0.5, amount1List[index]];
  });
  const chartOption = priceList
    ? {
        xAxis: [
          {
            type: "value",
            max: priceList.length - 1,
            interval: 1,
            axisLabel: {
              formatter(value: number) {
                if (priceList[value] === currentOutcomePrice.toFixed(4)) {
                  return `{bold|${priceList[value]}}`;
                }
                return priceList[value];
              },
              rich: {
                bold: {
                  fontWeight: "bold",
                  color: "#9747ff",
                },
              },
            },
            name: `${isShowToken0Price ? token0Symbol : token1Symbol} Price`,
            nameLocation: "middle",
            nameGap: 30,
          },
        ],
        tooltip: {
          trigger: "axis",
          valueFormatter: (value: number) => formatBigNumbers(value),
          // biome-ignore lint/suspicious/noExplicitAny:
          formatter: (params: any[]) => {
            let tooltipContent = "";
            for (const param of params) {
              const yValue = formatBigNumbers(param.data[1]);
              tooltipContent += `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background-color:${param.color};margin-right:5px;"></span>`;
              tooltipContent += `${param.seriesName}: ${yValue}<br>`;
            }

            // Return the formatted tooltip content with the colored dot
            return tooltipContent;
          },
        },
        yAxis: [
          {
            type: "value",
            axisLabel: {
              formatter(value: number) {
                return formatBigNumbers(value);
              },
            },
          },
        ],
        grid: {
          left: 60,
          right: 60,
          top: "15%",
          bottom: "15%",
        },
        series: [
          {
            name: `${token0Symbol} Locked`,
            type: "bar",
            stack: "total",
            barWidth: "100%",
            data: amount0Data,
          },
          {
            name: `${token1Symbol} Locked`,
            type: "bar",
            stack: "total",
            barWidth: "100%",
            data: amount1Data,
          },
        ],
      }
    : undefined;
  return (
    <div>
      <p className="font-semibold flex items-center gap-2">
        Liquidity Distribution: {isShowToken0Price ? token0Symbol : token1Symbol}/
        {isShowToken0Price ? token1Symbol : token0Symbol}{" "}
        <button type="button" onClick={() => setShowToken0Price((state) => !state)}>
          <SwapIcon />
        </button>
      </p>
      <ReactECharts option={chartOption} />
    </div>
  );
}

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
  const { data: liquidityChartData = [] } = useLiquidityChartData(market);
  const poolDataPerToken = data[outcomeIndex];
  const liquidityChartDataPerToken = liquidityChartData[outcomeIndex];
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
      <div className="space-y-3 bg-white max-h-[550px] overflow-auto">
        {poolDataPerToken.map((dataPerPool, poolIndex) => {
          const { id: poolId, token0Symbol, token1Symbol } = dataPerPool;
          const chartData = liquidityChartDataPerToken?.[poolId];
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
              {chartData && (
                <LiquidityBarChart
                  outcome={market.wrappedTokens[outcomeIndex]}
                  chartData={chartData}
                  poolInfo={dataPerPool}
                />
              )}
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
