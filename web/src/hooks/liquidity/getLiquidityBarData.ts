import { JSBI } from "@swapr/sdk";
import { Price, Token } from "@uniswap/sdk-core";
import { FeeAmount, TICK_SPACINGS, tickToPrice } from "@uniswap/v3-sdk";
import { ethers } from "ethers";
import { calculateActiveRangeTokensLocked, calculateTokensLocked } from "./calculateTokensLocked";
import computeSurroundingTicks from "./computeSurroundingTicks";
import { PRICE_FIXED_DIGITS } from "./constants";
import { LiquidityBarData, TickProcessed } from "./interfaces";

const ticks = [
  {
    liquidityNet: "806394836888668797",
    price0: "20322.9086376280205469831327096742",
    price1: "0.00004920555506255105448245823514063471",
    tickIdx: "99200",
  },
  {
    liquidityNet: "231718684255260540585471",
    price0: "34182.80554554387639284195151204998",
    price1: "0.00002925447411470184467399624959156822",
    tickIdx: "104400",
  },
  {
    liquidityNet: "18070724241851673845644",
    price0: "40923.88002731666886701345138320751",
    price1: "0.00002443561068335897071341785571075866",
    tickIdx: "106200",
  },
  {
    liquidityNet: "-18070724241851673845644",
    price0: "84072.35177914764508219188363327784",
    price1: "0.00001189451679223785774632716191132208",
    tickIdx: "113400",
  },
  {
    liquidityNet: "4280726983568672721",
    price0: "89270.82787808428308099543716306834",
    price1: "0.0000112018676623642801530748091828492",
    tickIdx: "114000",
  },
  {
    liquidityNet: "-4280726983568672721",
    price0: "187098.9762292924042929175643835435",
    price1: "0.000005344764680991552064483658482899162",
    tickIdx: "121400",
  },
  {
    liquidityNet: "-231718684255260540585471",
    price0: "194734.2408569045566832823759862192",
    price1: "0.000005135203729963567394707942371505455",
    tickIdx: "121800",
  },
  {
    liquidityNet: "-806394836888668797",
    price0: "202681.090652477335580820813254206",
    price1: "0.000004933859378695706533146143078739036",
    tickIdx: "122200",
  },
];

const pool = {
  id: "0x89556c9d2b44c20dc367bf24fa86e5f1f4e44c7f",
  liquidity: "231723771377080997926989",
  sqrtPrice: "24764582266176326013222805533295",
  tick: "114902",
  feeTier: "10000",
  token0: {
    id: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
  },
  token1: {
    id: "0xfd0205066521550d7d7ab19da8f72bb004b4c341",
  },
};

const getActiveTick = (
  tickCurrent: number | undefined,
  feeAmount: FeeAmount | undefined,
  tickSpacing: number | undefined,
) => (tickCurrent && feeAmount && tickSpacing ? Math.floor(tickCurrent / tickSpacing) * tickSpacing : undefined);

export async function getLiquidityBarData() {
  try {
    const currentTick = Number(pool.tick);
    const activeTick = getActiveTick(currentTick, FeeAmount.HIGH, TICK_SPACINGS[FeeAmount.HIGH]);
    if (!activeTick) {
      console.log("Cannot find active tick");
      return;
    }
    const isReversed = false;
    const pivot = ticks.findIndex((tickData) => Number(tickData.tickIdx) > activeTick) - 1;
    const token0 = new Token(1, ethers.utils.getAddress(pool.token0.id), 18);
    const token1 = new Token(1, ethers.utils.getAddress(pool.token1.id), 18);
    const sdkPrice = tickToPrice(token0, token1, activeTick);
    const activeTickProcessed: TickProcessed = {
      liquidityActive: JSBI.BigInt(pool?.liquidity ?? 0),
      tick: activeTick,
      liquidityNet:
        Number(ticks[pivot]?.tickIdx) === activeTick ? JSBI.BigInt(ticks[pivot]?.liquidityNet ?? 0) : JSBI.BigInt(0),
      price0: sdkPrice.toFixed(PRICE_FIXED_DIGITS),
      sdkPrice,
    };
    const subsequentTicks = computeSurroundingTicks(token0, token1, activeTickProcessed, ticks, pivot, true);
    const previousTicks = computeSurroundingTicks(token0, token1, activeTickProcessed, ticks, pivot, false);
    const ticksProcessed = previousTicks.concat(activeTickProcessed).concat(subsequentTicks);
    console.log(
      ticksProcessed.map((x) => {
        return {
          ...x,
          liquidityActive: x.liquidityActive.toString(),
          liquidityNet: x.liquidityNet.toString(),
        };
      }),
    );
    let activeRangePercentage: number | undefined = undefined;
    let activeRangeIndex: number | undefined = undefined;

    const barData: LiquidityBarData[] = [];
    for (let index = 0; index < ticksProcessed.length; index++) {
      const t = ticksProcessed[index];

      // Lightweight-charts require the x-axis to be time; a fake time base on index is provided
      const fakeTime = isReversed ? index * 1000 : (ticksProcessed.length - index) * 1000;
      const isActive = activeTick === t.tick;

      let price0 = t.sdkPrice;
      let price1 = t.sdkPrice.invert();

      if (isActive && activeTick && currentTick) {
        activeRangeIndex = index;
        activeRangePercentage = (currentTick - t.tick) / TICK_SPACINGS[FeeAmount.HIGH];

        price0 = tickToPrice(token0, token1, t.tick);
        price1 = price0.invert();
      }

      const { amount0Locked, amount1Locked } = await calculateTokensLocked(token0, token1, FeeAmount.HIGH, t);
      Price;
      barData.push({
        tick: t.tick,
        liquidity: Number.parseFloat(t.liquidityActive.toString()),
        price0: price0.toFixed(PRICE_FIXED_DIGITS),
        price1: price1.toFixed(PRICE_FIXED_DIGITS),
        time: fakeTime,
        amount0Locked,
        amount1Locked,
      });
    }

    // offset the values to line off bars with TVL used to swap across bar
    barData?.map((entry, i) => {
      if (i > 0) {
        barData[i - 1].amount0Locked = entry.amount0Locked;
        barData[i - 1].amount1Locked = entry.amount1Locked;
      }
    });

    const activeRangeData = activeRangeIndex !== undefined ? barData[activeRangeIndex] : undefined;
    // For active range, adjust amounts locked to adjust for where current tick/price is within the range
    if (activeRangeIndex !== undefined && activeRangeData) {
      const activeTickTvl = await calculateActiveRangeTokensLocked(
        token0,
        token1,
        FeeAmount.HIGH,
        ticksProcessed[activeRangeIndex],
        {
          sqrtPriceX96: JSBI.BigInt(pool.sqrtPrice ?? 0),
          currentTick,
          liquidity: JSBI.BigInt(pool.liquidity ?? 0),
        },
      );
      barData[activeRangeIndex] = { ...activeRangeData, ...activeTickTvl };
    }

    // Reverse data so that token0 is on the left by default
    if (!isReversed) {
      barData.reverse();
    }
    console.log(barData);
    console.log(activeRangePercentage);
  } catch (e) {
    console.log(e);
  }
}
