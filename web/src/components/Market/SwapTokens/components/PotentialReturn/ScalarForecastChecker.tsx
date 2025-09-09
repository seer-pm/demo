import { useQuoteTrade } from "@/hooks/trade";
import { useTokensInfo } from "@/hooks/useTokenInfo";
import { COLLATERAL_TOKENS } from "@/lib/config";
import { Market, MarketTypes, getMarketType } from "@/lib/market";
import { displayScalarBound } from "@/lib/reality";
import { Token, getCollateralPerShare } from "@/lib/tokens";
import { isTwoStringsEqual } from "@/lib/utils";
import { TradeType } from "@swapr/sdk";
import clsx from "clsx";
import ReactECharts from "echarts-for-react";
import { formatUnits, zeroAddress } from "viem";
import { getPotentialReturn, getScalarReturnPerToken } from "./utils";

export default function ScalarForecastChecker({
  market,
  outcomeToken,
  forecast,
  amount,
  receivedAmount,
  collateralPerShare,
  selectedCollateral,
  isSecondaryCollateral,
  sharesToAssets,
  assetsToShares,
}: {
  market: Market;
  outcomeToken: Token;
  forecast: number;
  amount: string;
  receivedAmount: number;
  collateralPerShare: number;
  selectedCollateral: Token;
  isSecondaryCollateral: boolean;
  assetsToShares: number;
  sharesToAssets: number;
}) {
  const primaryCollateral = COLLATERAL_TOKENS[market.chainId].primary;
  const { data: outcomeTokens = [] } = useTokensInfo(market.wrappedTokens, market.chainId);

  const otherOutcomeToken = outcomeTokens.find((_token) => _token.address !== outcomeToken.address)!;
  const renderReturnPerToken = (returnPercentage: number, returnPerToken: number) => (
    <span
      className={clsx(
        returnPercentage !== 0 && (returnPercentage > 0 ? "text-success-primary" : "text-error-primary"),
        "text-right",
      )}
    >
      {returnPerToken.toFixed(3)} {isSecondaryCollateral ? primaryCollateral.symbol : selectedCollateral.symbol}
      {isSecondaryCollateral
        ? ` (${(returnPerToken * (sharesToAssets ?? 0)).toFixed(3)} ${selectedCollateral.symbol})`
        : ""}
    </span>
  );
  const renderPotentialReturn = (returnPercentage: number, potentialReturn: number) => (
    <span className={clsx(returnPercentage >= 0 ? "text-success-primary" : "text-error-primary", "text-right")}>
      {potentialReturn.toFixed(3)} {selectedCollateral.symbol} ({returnPercentage.toFixed(2)}
      %)
    </span>
  );
  const {
    data: quoteData,
    isLoading: quoteIsLoading,
    // fetchStatus: quoteFetchStatus,
    // error: quoteError,
  } = useQuoteTrade(
    market.chainId,
    zeroAddress,
    amount,
    otherOutcomeToken,
    selectedCollateral,
    "buy",
    TradeType.EXACT_INPUT,
  );

  const otherTokenIndex = outcomeTokens.findIndex((token) =>
    isTwoStringsEqual(token.address, otherOutcomeToken.address),
  );
  if (getMarketType(market) !== MarketTypes.SCALAR) {
    return null;
  }
  if (!quoteData) {
    return (
      <div className="text-[14px] space-y-6">
        <div>
          <div className="flex items-center py-3 border-b border-black-secondary">
            <p className="w-[30%] font-semibold">Buying</p>
            <p className={clsx("w-[35%] text-right")}>UP</p>
            <p className={clsx("w-[35%] text-right")}>DOWN</p>
          </div>
          <div className="flex items-center py-3 border-b border-black-secondary">
            <p className="w-[30%] font-semibold">Return per token:</p>
            <p className="w-[35%] text-right">
              {renderReturnPerToken(0, getScalarReturnPerToken(market, 1, forecast))}
            </p>
            <p className="w-[35%] text-right">
              {renderReturnPerToken(0, getScalarReturnPerToken(market, 0, forecast))}
            </p>
          </div>
        </div>
        <p className="text-purple-primary">You need to buy more than 0 shares to calculate your potential return.</p>
      </div>
    );
  }

  const otherReceivedAmount = Number(formatUnits(quoteData.value, quoteData.decimals));
  const otherCollateralPerShare = getCollateralPerShare(quoteData, "buy");

  const inputData = [
    {
      collateralPerShare,
      receivedAmount,
    },
    {
      collateralPerShare: otherCollateralPerShare,
      receivedAmount: otherReceivedAmount,
    },
  ];
  if (otherTokenIndex === 0) {
    inputData.reverse();
  }
  const data = inputData.map(({ collateralPerShare, receivedAmount }, index) => {
    const returnPerToken = getScalarReturnPerToken(market, index, forecast);
    const { returnPercentage, potentialReturn } = getPotentialReturn(
      collateralPerShare,
      returnPerToken,
      isSecondaryCollateral,
      receivedAmount,
      sharesToAssets,
      assetsToShares,
      false,
    );
    return {
      returnPerToken,
      potentialReturn,
      returnPercentage,
    };
  });

  const bestReturnIndex = data[1].potentialReturn > data[0].potentialReturn ? 1 : 0;
  const [lowerBound, upperBound] = [displayScalarBound(market.lowerBound), displayScalarBound(market.upperBound)];
  const range = upperBound - lowerBound;

  const idealTickCount = 5;
  let interval = Math.ceil(range / idealTickCount);

  const magnitude = 10 ** Math.floor(Math.log10(interval));
  const normalized = interval / magnitude;
  if (normalized < 1.5) interval = magnitude;
  else if (normalized < 3) interval = 2 * magnitude;
  else if (normalized < 7.5) interval = 5 * magnitude;
  else interval = 10 * magnitude;

  const forecasts = [];
  const startTick = Math.floor(lowerBound / interval) * interval;
  for (let tick = startTick; tick <= upperBound + interval / 2; tick += interval) {
    if (tick >= lowerBound - interval / 2) {
      forecasts.push(tick);
    }
  }

  const chartPoints = 200;
  const chartInterval = range / chartPoints;
  const chartForecasts = Array(chartPoints + 1)
    .fill(null)
    .map((_, index) => lowerBound + chartInterval * index);

  const chartData = Array(2)
    .fill(null)
    .map((_, outcomeIndex) => {
      const points = chartForecasts.map((forecast) => {
        const returnPerToken = getScalarReturnPerToken(market, outcomeIndex, forecast);
        const { potentialReturn } = getPotentialReturn(
          inputData[outcomeIndex].collateralPerShare,
          returnPerToken,
          isSecondaryCollateral,
          inputData[outcomeIndex].receivedAmount,
          sharesToAssets,
          assetsToShares,
          false,
        );
        return [forecast, potentialReturn];
      });

      return {
        data: points,
        name: market.outcomes[outcomeIndex],
        type: "line",
      };
    });
  const highestReturn = Math.max(chartData[0].data[0][1], chartData[1].data.slice(-1)[0][1]);
  const maxYAxisTicks = 4;
  const yAxisTicks = Array.from(
    new Set(
      Array(maxYAxisTicks)
        .fill(null)
        .map((_, index) => Math.floor(highestReturn / maxYAxisTicks) * (index + 1))
        .concat([Number(amount), highestReturn])
        .sort((a, b) => a - b),
    ),
  );
  const option = {
    color: ["#00C42B", "#F60C36"],

    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "none",
      },
      valueFormatter: (value: number) => {
        return `${value.toLocaleString()} ${isSecondaryCollateral ? primaryCollateral.symbol : selectedCollateral.symbol}`;
      },
    },

    grid: {
      left: 50,
      right: 80,
      top: "15%",
      bottom: "15%",
    },
    xAxis: {
      min: lowerBound,
      max: upperBound,
      splitLine: {
        show: false,
      },
      axisPointer: {
        label: {
          formatter: ({ value }: { value: number }) => `${value.toLocaleString()}`,
        },
      },
      type: "value",
      axisLabel: {
        formatter: (value: number) => `${value.toLocaleString()}`,
      },
      axisLine: { onZero: false },
      axisTick: {
        show: true,
        interval: "auto",
        alignWithLabel: true,
      },
      data: forecasts,
    },
    yAxis: {
      min: "dataMin",
      max: "dataMax",
      axisLabel: {
        formatter: (value: number) => `${value.toLocaleString()}`,
        customValues: yAxisTicks,
      },
      axisTick: {
        alignWithLabel: true,
        customValues: yAxisTicks,
      },
      name: isSecondaryCollateral ? primaryCollateral.symbol : selectedCollateral.symbol,
    },
    series: [
      ...[...chartData].reverse().map((x, index) => ({
        ...x,
        symbol: "circle",
        symbolSize: 7,
        showSymbol: false,
        endLabel: {
          show: true,
          formatter: (params: { seriesName: string }) => params.seriesName,
          color: index === 0 ? "#00C42B" : "#F60C36",
        },
      })),
      {
        name: "Mark Line",
        type: "line",
        data: [
          [forecast, 0],
          [forecast, Math.max(chartData[0].data[0][1], chartData[1].data.slice(-1)[0][1])],
        ],
        lineStyle: {
          color: "#9747ff",
          type: "dotted",
          width: 2,
        },
        // smooth: true,
        // silent: true,
        tooltip: { show: false },
        symbol: "none",
        markLine: {
          symbol: ["none", "none"],
          lineStyle: {
            color: "rgba(0, 0, 0, 0)",
          },
          label: {
            show: true,
            position: "end",
            color: "#9747ff",
            fontWeight: "bold",
          },
          data: [
            [
              {
                name: "Current Forecast",
                xAxis: forecast,
                yAxis: 0,
              },
              { name: "end", xAxis: forecast, yAxis: "max" },
            ],
          ],
        },
      },
      {
        name: "Mark Line",
        type: "line",
        data: [
          [0, Number(amount)],
          [Number(market.upperBound), Number(amount)],
        ],
        lineStyle: {
          color: "#888",
          type: "dotted",
          width: 2,
        },
        // smooth: true,
        // silent: true,
        tooltip: { show: false },
        symbol: "none",
        markLine: {
          symbol: ["none", "none"],
          lineStyle: {
            color: "rgba(0, 0, 0, 0)",
          },
          label: {
            show: true,
            position: "end",
            color: "#888",
          },
          data: [
            [
              {
                name: "Buy Amount",
                xAxis: 0,
                yAxis: Number(amount),
              },
              { name: "end", xAxis: Number(market.upperBound), yAxis: Number(amount) },
            ],
          ],
        },
      },
    ],
  };

  if (otherTokenIndex === -1 || quoteIsLoading) {
    return null;
  }

  // find the return for each outcome token
  return (
    <div className="text-[14px] space-y-2">
      <div>
        <div className="flex items-center py-3 border-b border-black-secondary">
          <p className="w-[30%] font-semibold">Buying</p>
          <p
            className={clsx(
              "w-[35%] text-right",
              data[1].returnPercentage >= 0 ? "text-success-primary" : "text-error-primary",
            )}
          >
            UP
          </p>
          <p
            className={clsx(
              "w-[35%] text-right",
              data[0].returnPercentage >= 0 ? "text-success-primary" : "text-error-primary",
            )}
          >
            DOWN
          </p>
        </div>
        <div className="flex items-center py-1 border-b border-black-secondary">
          <p className="w-[30%] font-semibold">Return per token:</p>
          <p className="w-[35%] text-right">{renderReturnPerToken(data[1].returnPercentage, data[1].returnPerToken)}</p>
          <p className="w-[35%] text-right">{renderReturnPerToken(data[0].returnPercentage, data[0].returnPerToken)}</p>
        </div>
        <div className="flex items-center py-1 border-b border-black-secondary">
          <p className="w-[30%] font-semibold">Potential return:</p>
          <p className="w-[35%] text-right">
            {renderPotentialReturn(data[1].returnPercentage, data[1].potentialReturn)}
          </p>
          <p className="w-[35%] text-right">
            {renderPotentialReturn(data[0].returnPercentage, data[0].potentialReturn)}
          </p>
        </div>
      </div>
      <ReactECharts option={option} key={bestReturnIndex} style={{ height: "250px" }} />
      <div className="flex items-center flex-col">
        <p className="font-semibold mb-2">Best return for your forecast</p>
        <p className="text-success-primary">
          Buy {market.outcomes[bestReturnIndex]}{" "}
          {renderPotentialReturn(data[bestReturnIndex].returnPercentage, data[bestReturnIndex].potentialReturn)}
        </p>
      </div>
    </div>
  );
}
