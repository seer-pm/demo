import { isTwoStringsEqual } from "@/lib/utils";
import { getSqrtRatioAtTick, tickToPrice } from "@seer-pm/sdk/tick-math";
import { Address, formatUnits } from "viem";

const TICK_MAX = 69077; //soft cap at price0 = 1000, price1 = 0.001
const TICK_MIN = -69077; //soft cap at price0 = 0.001, price1 = 1000

/** A resting limit order level: single-tick-spacing liquidity starting at `tickLower`. */
export type ChartOrderLevel = {
  tickLower: number;
  liquidity: bigint;
  /** Distinct accounts with an order at the level. */
  orders: number;
};

/** Token amounts held by `liquidity` across `[tickLower, tickUpper]` (ticks in ascending order). */
export function getRangeAmounts(liquidity: bigint, tickLower: number, tickUpper: number) {
  const sqrtA = getSqrtRatioAtTick(tickLower);
  const sqrtB = getSqrtRatioAtTick(tickUpper);
  return {
    amount0: (liquidity * 2n ** 96n * (sqrtB - sqrtA)) / (sqrtA * sqrtB),
    amount1: (liquidity * (sqrtB - sqrtA)) / 2n ** 96n,
  };
}

export function getChartDataByTicks(
  pool: {
    liquidity: bigint;
    tickSpacing: number;
    tick: number;
    token0: Address;
  },
  initialTicks: { liquidityNet: string; tickIdx: string }[],
  zoomCount: number,
  outcome: Address,
  orderLevels: ChartOrderLevel[] = [],
) {
  const ticks = initialTicks.filter((tick) => tick.liquidityNet !== "0");
  const processedTicks: { tickIdx: string; liquidityNet: string }[] = [];
  // add filler ticks, we don't want to use every initializable ticks making the chart hard to see
  const maxTickToDisplay = 100;
  const interval =
    pool.tickSpacing *
    Math.ceil(
      (Number(ticks[ticks.length - 1].tickIdx) - Number(ticks[0].tickIdx)) / (pool.tickSpacing * maxTickToDisplay),
    );

  for (let i = 0; i < ticks.length - 1; i++) {
    const currentTick = Number(ticks[i].tickIdx);
    const nextTick = Number(ticks[i + 1].tickIdx);
    processedTicks.push(ticks[i]);
    for (let j = currentTick + interval; j < nextTick; j += interval) {
      processedTicks.push({
        tickIdx: j.toString(),
        liquidityNet: "0",
      });
    }
  }
  const isOutcomeToken0 = isTwoStringsEqual(pool.token0, outcome);
  const tickMax = isOutcomeToken0 ? 0 : TICK_MAX;
  const tickMin = isOutcomeToken0 ? TICK_MIN : 0;
  processedTicks.push(ticks[ticks.length - 1]);
  const processedHigherTicks = processedTicks.filter(
    (tick) => Number(tick.tickIdx) > pool.tick && Number(tick.tickIdx) < tickMax,
  );
  const processedLowerTicks = processedTicks.filter(
    (tick) => Number(tick.tickIdx) < pool.tick && Number(tick.tickIdx) > tickMin,
  );
  const higherTicks = processedHigherTicks.slice(0, zoomCount);
  const lowerTicks = processedLowerTicks.slice(zoomCount * -1);
  let currentLiquidity = pool.liquidity;
  let currentHighTick = pool.tick;
  let currentLowTick = pool.tick;
  const rangeMapping: {
    [key: string]: {
      amount0: number;
      amount1: number;
      activeLiquidity: bigint;
      currentTick: number;
      nextTick: number;
      amount0Need: number;
      amount1Need: number;
      /** Outcome tokens of the resting limit orders inside the range. */
      orderAmount: number;
      /** Accounts with a resting limit order inside the range. */
      orderCount: number;
    };
  } = {};
  for (let i = 0; i < higherTicks.length; i++) {
    currentLiquidity = currentLiquidity + BigInt(higherTicks[i - 1]?.liquidityNet ?? 0);
    // if (currentLiquidity === 0n) {
    //   continue;
    // }
    const { amount0, amount1: amount1Need } = getRangeAmounts(
      currentLiquidity,
      currentHighTick,
      Number(higherTicks[i].tickIdx),
    );

    rangeMapping[`${currentHighTick}-${Number(higherTicks[i].tickIdx)}`] = {
      amount0: Number(formatUnits(amount0, 18)),
      amount1: 0,
      amount0Need: 0,
      amount1Need: Number(formatUnits(amount1Need, 18)),
      activeLiquidity: currentLiquidity,
      currentTick: currentHighTick,
      nextTick: Number(higherTicks[i].tickIdx),
      orderAmount: 0,
      orderCount: 0,
    };
    currentHighTick = Number(higherTicks[i].tickIdx);
  }
  // A position whose upper tick is the current tick is not active (tick >= tickUpper), so it is
  // not in pool.liquidity, and its negative net at that tick is skipped by both walks. Walking
  // down crosses it first.
  const tickAtPrice = ticks.find((tick) => Number(tick.tickIdx) === pool.tick);
  currentLiquidity = pool.liquidity - BigInt(tickAtPrice?.liquidityNet ?? 0);
  for (let i = lowerTicks.length - 1; i > -1; i--) {
    currentLiquidity = currentLiquidity - BigInt(lowerTicks[i + 1]?.liquidityNet ?? 0);
    // if (currentLiquidity === 0n) {
    //   continue;
    // }
    const { amount0: amount0Need, amount1 } = getRangeAmounts(
      currentLiquidity,
      Number(lowerTicks[i].tickIdx),
      currentLowTick,
    );
    rangeMapping[`${Number(lowerTicks[i].tickIdx)}-${currentLowTick}`] = {
      amount1: Number(formatUnits(amount1, 18)),
      amount0: 0,
      amount0Need: Number(formatUnits(amount0Need, 18)),
      amount1Need: 0,
      activeLiquidity: currentLiquidity,
      currentTick: Number(lowerTicks[i].tickIdx),
      nextTick: currentLowTick,
      orderAmount: 0,
      orderCount: 0,
    };
    currentLowTick = Number(lowerTicks[i].tickIdx);
  }
  // Limit orders are single-tick-spacing liquidity already counted in the ticks above. Attribute
  // each level to the range holding its lower tick so the bar can show how much of it is orders.
  const ranges = Object.values(rangeMapping);
  for (const level of orderLevels) {
    const range = ranges.find((r) => r.currentTick <= level.tickLower && level.tickLower < r.nextTick);
    if (!range) continue;
    const { amount0, amount1 } = getRangeAmounts(level.liquidity, level.tickLower, level.tickLower + pool.tickSpacing);
    range.orderAmount += Number(formatUnits(isOutcomeToken0 ? amount0 : amount1, 18));
    range.orderCount += level.orders;
  }
  for (const range of ranges) {
    // Every bar is expressed in outcome tokens; keep the order portion within the bar.
    const barAmount = isOutcomeToken0
      ? Math.max(range.amount0, range.amount0Need)
      : Math.max(range.amount1, range.amount1Need);
    range.orderAmount = Math.min(range.orderAmount, barAmount);
  }

  const [amount0List, amount1List, amount0NeedList, amount1NeedList, orderAmountList, orderCountList] = ranges
    .sort((a, b) => Number(a.currentTick) - Number(b.currentTick))
    .reduce(
      (acc, curr) => {
        acc[0].push(curr.amount0);
        acc[1].push(curr.amount1);
        acc[2].push(curr.amount0Need);
        acc[3].push(curr.amount1Need);
        acc[4].push(curr.orderAmount);
        acc[5].push(curr.orderCount);
        return acc;
      },
      [[], [], [], [], [], []] as number[][],
    );

  const sortedTickIndices = [
    ...new Set(
      Object.values(rangeMapping).reduce((acc, curr) => {
        acc.push(curr.currentTick);
        acc.push(curr.nextTick);
        return acc;
      }, [] as number[]),
    ),
  ].sort((a, b) => a - b);
  const [price0List, price1List] = sortedTickIndices.reduce(
    (acc, tickIdx) => {
      const [price0, price1] = tickToPrice(tickIdx);
      acc[0].push(price0);
      acc[1].push(price1);
      return acc;
    },
    [[], []] as string[][],
  );

  return {
    price0List,
    price1List,
    amount0List,
    amount1List,
    amount0NeedList,
    amount1NeedList,
    orderAmountList,
    orderCountList,
    maxZoomCount: Math.max(processedHigherTicks.length, processedLowerTicks.length),
  };
}

export function getLiquidityChartData(
  poolInfo: {
    liquidity: bigint;
    tickSpacing: number;
    tick: number;
    token0: Address;
  },
  ticks: { liquidityNet: string; tickIdx: string }[],
  isShowToken0Price: boolean,
  zoomCount: number,
  outcome: Address,
  orderLevels: ChartOrderLevel[] = [],
) {
  if (!ticks.length) {
    return {
      priceList: [],
      sellBarsData: [],
      buyBarsData: [],
      sellOrderBarsData: [],
      buyOrderBarsData: [],
      orderCounts: [],
      sellLineData: [],
      buyLineData: [],
      maxYValue: 0,
      maxZoomCount: 0,
    };
  }
  const chartData = getChartDataByTicks(poolInfo, ticks, zoomCount, outcome, orderLevels);
  const priceList = isShowToken0Price ? chartData.price0List : [...chartData.price1List].reverse();
  const amount0List = isShowToken0Price ? chartData.amount0List : [...chartData.amount0List].reverse();
  const amount1List = isShowToken0Price ? chartData.amount1List : [...chartData.amount1List].reverse();
  const amount0NeedList = isShowToken0Price ? chartData.amount0NeedList : [...chartData.amount0NeedList].reverse();
  const amount1NeedList = isShowToken0Price ? chartData.amount1NeedList : [...chartData.amount1NeedList].reverse();
  const orderAmountList = isShowToken0Price ? chartData.orderAmountList : [...chartData.orderAmountList].reverse();
  const orderCounts = isShowToken0Price ? chartData.orderCountList : [...chartData.orderCountList].reverse();
  const accAmount0List = amount0List.reduce((acc, curr) => {
    if (acc.length === 0) return [curr];
    acc.push(acc[acc.length - 1] + curr);
    return acc;
  }, [] as number[]);
  const accAmount1List = amount1List.reduce((acc, curr) => {
    if (acc.length === 0) return [curr];
    acc.push(acc[acc.length - 1] + curr);
    return acc;
  }, [] as number[]);
  const accAmount0NeedList = amount0NeedList.reduceRight((acc, curr) => {
    if (acc.length === 0) return [curr];
    acc.unshift(curr + acc[0]);
    return acc;
  }, [] as number[]);
  const accAmount1NeedList = amount1NeedList.reduceRight((acc, curr) => {
    if (acc.length === 0) return [curr];
    acc.unshift(curr + acc[0]);
    return acc;
  }, [] as number[]);
  // Bars are split into the liquidity-position portion and the resting limit-order portion; the
  // two stack to the full amount of the range. A range only has one side, so the order portion
  // goes to whichever side holds the amount.
  const sellAmountList = isShowToken0Price ? amount0List : amount1List;
  const buyAmountList = isShowToken0Price ? amount0NeedList : amount1NeedList;
  const sellOrderList = orderAmountList.map((amount, index) => (sellAmountList[index] > 0 ? amount : 0));
  const buyOrderList = orderAmountList.map((amount, index) => (buyAmountList[index] > 0 ? amount : 0));
  // The price list has one more entry than there are ranges; the last point stays empty.
  const sellBarsData = priceList.map((_, index) => {
    return [index + 0.5, index < sellAmountList.length ? sellAmountList[index] - sellOrderList[index] : undefined];
  });
  const buyBarsData = priceList.map((_, index) => {
    return [index + 0.5, index < buyAmountList.length ? buyAmountList[index] - buyOrderList[index] : undefined];
  });
  const sellOrderBarsData = priceList.map((_, index) => {
    return [index + 0.5, sellOrderList[index]];
  });
  const buyOrderBarsData = priceList.map((_, index) => {
    return [index + 0.5, buyOrderList[index]];
  });
  const sellLineData = priceList.reduce<[number, number | null][]>((acc, _, index) => {
    acc.push([index, (isShowToken0Price ? accAmount0List : accAmount1List)[index] || null]);
    acc.push([index + 1, (isShowToken0Price ? accAmount0List : accAmount1List)[index] || null]);
    return acc;
  }, []);
  const buyLineData = priceList.reduce<[number, number | null][]>((acc, _, index) => {
    acc.push([index, (isShowToken0Price ? accAmount0NeedList : accAmount1NeedList)[index] || null]);
    acc.push([index + 1, (isShowToken0Price ? accAmount0NeedList : accAmount1NeedList)[index] || null]);
    return acc;
  }, []);
  const maxYValue = Math.max(...[...accAmount0List, ...accAmount1List, ...accAmount0NeedList, ...accAmount1NeedList]);
  return {
    priceList,
    sellBarsData,
    buyBarsData,
    sellOrderBarsData,
    buyOrderBarsData,
    orderCounts,
    sellLineData,
    buyLineData,
    maxYValue,
    maxZoomCount: chartData.maxZoomCount,
  };
}
