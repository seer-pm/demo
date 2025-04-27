import Button from "@/components/Form/Button";
import Input from "@/components/Form/Input";
import MultiSelect from "@/components/Form/MultiSelect";
import { useQuoteTrade } from "@/hooks/trade";
import { useSDaiDaiRatio } from "@/hooks/trade/handleSDAI";
import { Market } from "@/hooks/useMarket";
import { useMarketOdds } from "@/hooks/useMarketOdds";
import { useModal } from "@/hooks/useModal";
import { useTokensInfo } from "@/hooks/useTokenInfo";
import { MarketTypes, getMarketType, getMultiScalarEstimate } from "@/lib/market";
import { Token, getCollateralPerShare, getPotentialReturn } from "@/lib/tokens";
import { isTwoStringsEqual, isUndefined } from "@/lib/utils";
import clsx from "clsx";
import ReactECharts from "echarts-for-react";
import { Dispatch, ReactNode, SetStateAction, useRef, useState } from "react";
import { formatUnits, zeroAddress } from "viem";
import { PotentialReturnResult } from "./PotentialReturn";

function getScalarReturnPerToken(market: Market, outcomeTokenIndex: number, forecast: number) {
  if (outcomeTokenIndex === 0) {
    // DOWN Token
    if (forecast <= Number(market.lowerBound)) {
      return 1;
    }

    if (forecast >= Number(market.upperBound)) {
      return 0;
    }
    return (Number(market.upperBound) - forecast) / (Number(market.upperBound) - Number(market.lowerBound));
  }

  // UP Token
  if (forecast <= Number(market.lowerBound)) {
    return 0;
  }
  if (forecast >= Number(market.upperBound)) {
    return 1;
  }
  return (forecast - Number(market.lowerBound)) / (Number(market.upperBound) - Number(market.lowerBound));
}

function getMultiCategoricalReturnPerToken(outcomeText: string, forecast: string[]) {
  if (!forecast.includes(outcomeText)) {
    return 0;
  }
  return forecast.length > 0 ? 1 / forecast.length : 1;
}

function getMultiScalarReturnPerToken(outcomeTokenIndex: number, forecast: number[]) {
  const sum = forecast.reduce((acc, curr) => acc + (curr ?? 0), 0);
  return sum ? (forecast[outcomeTokenIndex] ?? 0) / sum : 0;
}

function getReturnPerToken(market: Market, outcomeToken: Token, outcomeText: string, input: PotentialReturnInput) {
  const marketType = getMarketType(market);
  const outcomeTokenIndex = market.wrappedTokens.findIndex((x) => x === outcomeToken.address);

  if (marketType === MarketTypes.SCALAR) {
    if (!isUndefined(input.scalar)) {
      return getScalarReturnPerToken(market, outcomeTokenIndex, input.scalar);
    }
  }

  if (marketType === MarketTypes.MULTI_CATEGORICAL) {
    if (input.multiCategorical.length > 0) {
      return getMultiCategoricalReturnPerToken(outcomeText, input.multiCategorical);
    }
  }

  if (marketType === MarketTypes.MULTI_SCALAR) {
    if (input.multiScalar[outcomeTokenIndex]) {
      return getMultiScalarReturnPerToken(outcomeTokenIndex, input.multiScalar);
    }
  }

  return 1;
}

function RenderInputByMarketType({
  market,
  input,
  setInput,
}: {
  market: Market;
  input: PotentialReturnInput;
  setInput: Dispatch<SetStateAction<PotentialReturnInput>>;
}): ReactNode {
  const marketType = getMarketType(market);

  const multiSelectRef = useRef<HTMLDivElement>(null);

  if (marketType === MarketTypes.MULTI_CATEGORICAL) {
    return (
      <div className="space-y-1">
        <p className="whitespace-nowrap">Market resolution:</p>
        <MultiSelect
          ref={multiSelectRef}
          options={market.outcomes.slice(0, -1).map((x) => ({
            value: x,
            text: x,
          }))}
          value={input.multiCategorical ?? []}
          onChange={(values) => setInput((state) => ({ ...state, multiCategorical: values }))}
          placeholder="Select winning outcomes"
        />
      </div>
    );
  }

  if (marketType === MarketTypes.SCALAR) {
    return (
      <div className="space-y-1">
        <p className="whitespace-nowrap">Market resolution:</p>
        <Input
          type="number"
          className="w-full "
          value={input.scalar ?? ""}
          onChange={(e) => setInput((state) => ({ ...state, scalar: Number(e.target.value) }))}
        />
      </div>
    );
  }

  // MarketTypes.MULTI_SCALAR
  return (
    <div className="space-y-1">
      <p className="whitespace-nowrap">Market resolution:</p>
      {market.outcomes.slice(0, -1).map((outcome, index) => (
        <div key={outcome} className="flex items-center justify-between gap-2">
          <p className="text-[14px]">{outcome}</p>
          <Input
            type="number"
            min="0"
            className="h-[30px] w-[150px]"
            onWheel={(e) => {
              // stop scrolling
              (e.target as HTMLInputElement).blur();
              e.stopPropagation();
              e.preventDefault();
            }}
            value={input.multiScalar[index] || ""}
            onChange={(e) =>
              setInput((state) => {
                const updatedMultiScalar = [...state.multiScalar];
                updatedMultiScalar[index] = Number(e.target.value);
                return {
                  ...state,
                  multiScalar: updatedMultiScalar,
                };
              })
            }
          />
        </div>
      ))}
    </div>
  );
}

function ScalarForecastChecker({
  market,
  outcomeToken,
  forecast,
  amount,
  receivedAmount,
  collateralPerShare,
  selectedCollateral,
  isCollateralDai,
  daiToSDai,
  sDaiToDai,
}: {
  market: Market;
  outcomeToken: Token;
  forecast: number;
  amount: string;
  receivedAmount: number;
  collateralPerShare: number;
  selectedCollateral: Token;
  isCollateralDai: boolean;
  daiToSDai: number;
  sDaiToDai: number;
}) {
  const { data: outcomeTokens = [] } = useTokensInfo(market.wrappedTokens, market.chainId);

  const otherOutcomeToken = outcomeTokens.find((_token) => _token.address !== outcomeToken.address)!;
  const renderReturnPerToken = (returnPercentage: number, returnPerToken: number) => (
    <span
      className={clsx(
        returnPercentage !== 0 && (returnPercentage > 0 ? "text-success-primary" : "text-error-primary"),
        "text-right",
      )}
    >
      {returnPerToken.toFixed(3)} {isCollateralDai ? "sDAI" : selectedCollateral.symbol}
      {isCollateralDai ? ` (${(returnPerToken * (sDaiToDai ?? 0)).toFixed(3)} ${selectedCollateral.symbol})` : ""}
    </span>
  );
  const renderPotentialReturn = (returnPercentage: number, potentialReturn: number) => (
    <span className={clsx(returnPercentage >= 0 ? "text-success-primary" : "text-error-primary", "text-right")}>
      {potentialReturn.toFixed(3)} {isCollateralDai ? selectedCollateral.symbol : "sDAI"} ({returnPercentage.toFixed(2)}
      %)
    </span>
  );

  const {
    data: quoteData,
    isLoading: quoteIsLoading,
    // fetchStatus: quoteFetchStatus,
    // error: quoteError,
  } = useQuoteTrade(market.chainId, zeroAddress, amount, otherOutcomeToken, selectedCollateral, "buy");
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
  const otherCollateralPerShare = getCollateralPerShare(
    "buy",
    selectedCollateral,
    quoteData,
    amount,
    otherReceivedAmount,
    isCollateralDai,
    daiToSDai,
  );

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
      isCollateralDai,
      receivedAmount,
      sDaiToDai,
      false,
    );
    return {
      returnPerToken,
      potentialReturn,
      returnPercentage,
    };
  });

  const bestReturnIndex = data[1].potentialReturn > data[0].potentialReturn ? 1 : 0;
  const lowerBound = Number(market.lowerBound);
  const upperBound = Number(market.upperBound);
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
          isCollateralDai,
          inputData[outcomeIndex].receivedAmount,
          sDaiToDai,
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
        return `${value.toLocaleString()} ${isCollateralDai ? "sDAI" : selectedCollateral.symbol}`;
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
      name: isCollateralDai ? "sDAI" : selectedCollateral.symbol,
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

function getDefaultInput(market: Market, outcomeToken: Token, outcomeText: string, odds: number[]) {
  const defaultValue = {
    multiCategorical: [],
    scalar: undefined,
    multiScalar: [],
  };

  const outcomeTokenIndex = market.wrappedTokens.findIndex((x) => x === outcomeToken.address);

  const marketType = getMarketType(market);

  if (marketType === MarketTypes.SCALAR) {
    if (outcomeTokenIndex === 0 || outcomeTokenIndex === 1) {
      return {
        ...defaultValue,
        scalar: Number(outcomeTokenIndex === 0 ? market.lowerBound : market.upperBound),
      };
    }
  }

  if (marketType === MarketTypes.MULTI_CATEGORICAL) {
    return {
      ...defaultValue,
      multiCategorical: [outcomeText],
    };
  }

  if (marketType === MarketTypes.MULTI_SCALAR) {
    const multiScalar = odds.map((odd) => {
      const estimate = getMultiScalarEstimate(market, odd);

      return estimate?.value || 0;
    });

    return {
      ...defaultValue,
      multiScalar,
    };
  }

  return defaultValue;
}

type PotentialReturnInput = {
  multiCategorical: string[];
  scalar: number | undefined;
  multiScalar: number[];
};

function PotentialReturnConfig({
  market,
  selectedCollateral,
  outcomeToken,
  outcomeText,
  isCollateralDai,
  quoteIsLoading = false,
  isFetching = false,
  amount,
  receivedAmount,
  collateralPerShare,
}: {
  market: Market;
  selectedCollateral: Token;
  outcomeToken: Token;
  outcomeText: string;
  isCollateralDai: boolean;
  quoteIsLoading: boolean;
  isFetching: boolean;
  amount: string;
  receivedAmount: number;
  collateralPerShare: number;
}) {
  const { data: odds = [] } = useMarketOdds(market, true);
  const [input, setInput] = useState<PotentialReturnInput>(getDefaultInput(market, outcomeToken, outcomeText, odds));
  const { Modal, openModal, closeModal } = useModal("potential-return-config", true);

  const returnPerToken = getReturnPerToken(market, outcomeToken, outcomeText, input);

  const { sDaiToDai, daiToSDai } = useSDaiDaiRatio(market.chainId);
  const returnPerTokenDai = returnPerToken * (sDaiToDai ?? 0);

  const potentialReturnContent = (
    <div>
      <p>
        Return per token:{" "}
        <span className="font-semibold text-purple-primary">
          {returnPerToken.toFixed(3)} {isCollateralDai ? "sDAI" : selectedCollateral.symbol}
          {isCollateralDai ? ` (${returnPerTokenDai.toFixed(3)} ${selectedCollateral.symbol})` : ""}
        </span>
      </p>
      {Number(amount) === 0 && (
        <p className="text-purple-primary text-[14px]">
          You need to buy more than 0 shares to calculate your potential return.
        </p>
      )}
      {Number(amount) > 0 && (
        <div>
          Potential return:{" "}
          <PotentialReturnResult
            quoteIsLoading={quoteIsLoading}
            isFetching={isFetching}
            isCollateralDai={isCollateralDai}
            selectedCollateral={selectedCollateral}
            receivedAmount={receivedAmount}
            sDaiToDai={sDaiToDai ?? 0}
            returnPerToken={returnPerToken}
            collateralPerShare={collateralPerShare}
            isOneOrNothingPotentialReturn={false}
          />
        </div>
      )}
    </div>
  );

  const scalarPotentialReturnContent = (
    <ScalarForecastChecker
      market={market}
      outcomeToken={outcomeToken}
      selectedCollateral={selectedCollateral}
      forecast={input.scalar ?? 0}
      amount={amount}
      receivedAmount={receivedAmount}
      collateralPerShare={collateralPerShare}
      isCollateralDai={isCollateralDai}
      daiToSDai={daiToSDai ?? 0}
      sDaiToDai={sDaiToDai ?? 0}
    />
  );

  const modalContent = (
    <div className=" space-y-2 w-full -mt-[20px] ">
      <div>
        <p>Enter a possible market resolution to see your potential return.</p>
        <p className="font-semibold text-purple-primary py-1.5">Current Outcome: {outcomeText}</p>
        <div className="max-h-[200px] overflow-auto">
          <RenderInputByMarketType market={market} input={input} setInput={setInput} />
        </div>

        <div>
          {getMarketType(market) === MarketTypes.SCALAR ? scalarPotentialReturnContent : potentialReturnContent}
        </div>
        <div className="text-center pt-2">
          <Button type="button" variant="primary" size="small" text="Close" onClick={closeModal} />
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <button
        type="button"
        className="hover:opacity-80 text-purple-primary font-medium text-center w-full text-[15px]"
        onClick={openModal}
      >
        Calculate your potential return
      </button>
      <Modal title="Potential return calculator" content={modalContent} />
    </div>
  );
}

export default PotentialReturnConfig;
