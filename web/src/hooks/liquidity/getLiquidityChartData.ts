import { isTwoStringsEqual } from "@/lib/utils";
import { TickMath } from "@uniswap/v3-sdk";
import { BigNumber } from "ethers";
import { Address, formatUnits } from "viem";

export function tickToPrice(tick: number, decimals = 18) {
  const sqrtPriceX96 = BigInt(TickMath.getSqrtRatioAtTick(tick).toString());
  const bn = BigNumber.from(sqrtPriceX96);

  const TWO_POW_96 = BigNumber.from(2).pow(96);

  const price0 = bn
    .mul(bn) // square it
    .mul(BigNumber.from(10).pow(decimals))
    .div(TWO_POW_96)
    .div(TWO_POW_96)
    .toBigInt();
  const price1 = TWO_POW_96.mul(TWO_POW_96).mul(BigNumber.from(10).pow(decimals)).div(bn).div(bn).toBigInt();

  return [Number(formatUnits(price0, 18)).toFixed(4), Number(formatUnits(price1, 18)).toFixed(4)];
}
const TICK_MAX = 69077; //soft cap at price0 = 1000, price1 = 0.001
const TICK_MIN = -69077; //soft cap at price0 = 0.001, price1 = 1000
export function getChartDataByTicks(
  pool: {
    liquidity: bigint;
    tickSpacing: number;
    tick: number;
    token0: Address;
  },
  ticks: { liquidityNet: string; tickIdx: string }[],
  zoomCount: number,
  outcome: Address,
) {
  const processedTicks: { tickIdx: string; liquidityNet: string }[] = [];
  // add filler ticks, we don't want to use every initializable ticks making the chart hard to see
  for (let i = 0; i < ticks.length - 1; i++) {
    const currentTick = Number(ticks[i].tickIdx);
    const nextTick = Number(ticks[i + 1].tickIdx);
    processedTicks.push(ticks[i]);
    const maxTickToDisplay = 100;
    const interval = Math.floor(
      (Number(ticks[ticks.length - 1].tickIdx) - Number(ticks[0].tickIdx)) /
        pool.tickSpacing /
        maxTickToDisplay /
        pool.tickSpacing,
    );
    for (let j = currentTick + pool.tickSpacing; j < nextTick; j++) {
      processedTicks.push({
        tickIdx: j.toString(),
        liquidityNet: "0",
      });
      j += pool.tickSpacing * Math.max(interval, 5);
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
    };
  } = {};
  for (let i = 0; i < higherTicks.length; i++) {
    currentLiquidity = currentLiquidity + BigInt(higherTicks[i - 1]?.liquidityNet ?? 0);
    // if (currentLiquidity === 0n) {
    //   continue;
    // }
    const sqrtP = BigInt(TickMath.getSqrtRatioAtTick(currentHighTick).toString());
    const sqrtB = BigInt(TickMath.getSqrtRatioAtTick(Number(higherTicks[i].tickIdx)).toString());

    const amount0 = (currentLiquidity * 2n ** 96n * (sqrtB - sqrtP)) / (sqrtB * sqrtP);
    const amount1Need = (currentLiquidity * (sqrtB - sqrtP)) / 2n ** 96n;

    rangeMapping[`${currentHighTick}-${Number(higherTicks[i].tickIdx)}`] = {
      amount0: Number(formatUnits(amount0, 18)),
      amount1: 0,
      amount0Need: 0,
      amount1Need: Number(formatUnits(amount1Need, 18)),
      activeLiquidity: currentLiquidity,
      currentTick: currentHighTick,
      nextTick: Number(higherTicks[i].tickIdx),
    };
    currentHighTick = Number(higherTicks[i].tickIdx);
  }
  currentLiquidity = pool.liquidity;
  for (let i = lowerTicks.length - 1; i > -1; i--) {
    currentLiquidity = currentLiquidity - BigInt(lowerTicks[i + 1]?.liquidityNet ?? 0);
    // if (currentLiquidity === 0n) {
    //   continue;
    // }
    const sqrtA = BigInt(TickMath.getSqrtRatioAtTick(Number(lowerTicks[i].tickIdx)).toString());
    const sqrtP = BigInt(TickMath.getSqrtRatioAtTick(currentLowTick).toString());
    const amount1 = (currentLiquidity * (sqrtP - sqrtA)) / 2n ** 96n;
    const amount0Need = ((currentLiquidity * 2n ** 96n * (sqrtA - sqrtP)) / (sqrtA * sqrtP)) * -1n;
    rangeMapping[`${Number(lowerTicks[i].tickIdx)}-${currentLowTick}`] = {
      amount1: Number(formatUnits(amount1, 18)),
      amount0: 0,
      amount0Need: Number(formatUnits(amount0Need, 18)),
      amount1Need: 0,
      activeLiquidity: currentLiquidity,
      currentTick: Number(lowerTicks[i].tickIdx),
      nextTick: currentLowTick,
    };
    currentLowTick = Number(lowerTicks[i].tickIdx);
  }
  const [amount0List, amount1List, amount0NeedList, amount1NeedList] = Object.values(rangeMapping)
    .sort((a, b) => Number(a.currentTick) - Number(b.currentTick))
    .reduce(
      (acc, curr) => {
        acc[0].push(curr.amount0);
        acc[1].push(curr.amount1);
        acc[2].push(curr.amount0Need);
        acc[3].push(curr.amount1Need);
        return acc;
      },
      [[], [], [], []] as number[][],
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
) {
  const chartData = getChartDataByTicks(poolInfo, ticks, zoomCount, outcome);
  const priceList = isShowToken0Price ? chartData.price0List : [...chartData.price1List].reverse();
  const amount0List = isShowToken0Price ? chartData.amount0List : [...chartData.amount0List].reverse();
  const amount1List = isShowToken0Price ? chartData.amount1List : [...chartData.amount1List].reverse();
  const amount0NeedList = isShowToken0Price ? chartData.amount0NeedList : [...chartData.amount0NeedList].reverse();
  const amount1NeedList = isShowToken0Price ? chartData.amount1NeedList : [...chartData.amount1NeedList].reverse();
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
  const sellBarsData = priceList.map((_, index) => {
    return [index + 0.5, (isShowToken0Price ? amount0List : amount1List)[index]];
  });
  const buyBarsData = priceList.map((_, index) => {
    return [index + 0.5, (isShowToken0Price ? amount0NeedList : amount1NeedList)[index]];
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
    sellLineData,
    buyLineData,
    maxYValue,
    maxZoomCount: chartData.maxZoomCount,
  };
}
