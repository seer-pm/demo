import {
  MAX_UINT160,
  type V4Position,
  buildCollectV4FeesExecution,
  buildRemoveV4PositionExecution,
  computeV4PositionAmounts,
  decodePositionInfo,
  getMintV4PositionMaxAmounts,
  getV4PositionManagerAddress,
} from "@seer-pm/order-book/v4";
import { getSqrtRatioAtTick } from "@seer-pm/sdk/tick-math";
import { decodeFunctionData, parseAbi } from "viem";
import { describe, expect, it } from "vitest";

const CHAIN_ID = 8453;
const POOL_KEY = {
  currency0: "0x1111111111111111111111111111111111111111",
  currency1: "0x2222222222222222222222222222222222222222",
  fee: 3000,
  tickSpacing: 60,
  hooks: "0x19E8B37E9f4d69927Da1e13e989a2f955ee39040",
} as const;

const POSITION: V4Position = {
  tokenId: 1234n,
  owner: "0x3333333333333333333333333333333333333333",
  poolId: "0xabc",
  poolKey: POOL_KEY,
  tickLower: -600,
  tickUpper: 600,
  liquidity: 10n ** 18n,
};

const positionManagerAbi = parseAbi([
  "function modifyLiquidities(bytes unlockData, uint256 deadline) payable",
  "function multicall(bytes[] data) payable returns (bytes[])",
]);

function encodePositionInfo(poolIdPrefix: bigint, tickUpper: number, tickLower: number, hasSubscriber = false) {
  const toU24 = (tick: number) => BigInt.asUintN(24, BigInt(tick));
  return (poolIdPrefix << 56n) | (toU24(tickUpper) << 32n) | (toU24(tickLower) << 8n) | (hasSubscriber ? 1n : 0n);
}

describe("v4 positions", () => {
  it("MAX_UINT160 fits Permit2 allowances", () => {
    expect(MAX_UINT160).toBe(2n ** 160n - 1n);
  });

  it("decodePositionInfo unpacks negative and positive ticks", () => {
    const prefix = (1n << 200n) - 1n;
    const info = encodePositionInfo(prefix, 600, -600, true);
    const decoded = decodePositionInfo(info);
    expect(decoded.tickLower).toBe(-600);
    expect(decoded.tickUpper).toBe(600);
    expect(decoded.hasSubscriber).toBe(true);
    expect(decoded.poolIdPrefix).toBe(`0x${"f".repeat(50)}`);
  });

  it("decodePositionInfo handles the min/max int24 range", () => {
    const decoded = decodePositionInfo(encodePositionInfo(0n, 8_388_607, -8_388_608));
    expect(decoded.tickLower).toBe(-8_388_608);
    expect(decoded.tickUpper).toBe(8_388_607);
    expect(decoded.hasSubscriber).toBe(false);
  });

  it("computeV4PositionAmounts is single-sided outside the range", () => {
    const below = computeV4PositionAmounts(POSITION, { chainId: CHAIN_ID, sqrtPriceX96: getSqrtRatioAtTick(-1200) });
    expect(below.amount0).toBeGreaterThan(0n);
    expect(below.amount1).toBe(0n);

    const above = computeV4PositionAmounts(POSITION, { chainId: CHAIN_ID, sqrtPriceX96: getSqrtRatioAtTick(1200) });
    expect(above.amount0).toBe(0n);
    expect(above.amount1).toBeGreaterThan(0n);

    const inside = computeV4PositionAmounts(POSITION, { chainId: CHAIN_ID, sqrtPriceX96: getSqrtRatioAtTick(0) });
    expect(inside.amount0).toBeGreaterThan(0n);
    expect(inside.amount1).toBeGreaterThan(0n);
  });

  it("buildRemoveV4PositionExecution targets the PositionManager with modifyLiquidities calldata", () => {
    const execution = buildRemoveV4PositionExecution({
      chainId: CHAIN_ID,
      position: POSITION,
      sqrtPriceX96: getSqrtRatioAtTick(0),
      tick: 0,
      percentageBps: 5_000,
    });
    expect(execution.to.toLowerCase()).toBe(getV4PositionManagerAddress(CHAIN_ID)?.toLowerCase());
    expect(execution.chainId).toBe(CHAIN_ID);
    expect(execution.value).toBe(0n);

    const decoded = decodeFunctionData({ abi: positionManagerAbi, data: execution.data });
    expect(decoded.functionName).toBe("modifyLiquidities");
  });

  it("buildRemoveV4PositionExecution rejects invalid percentages", () => {
    const params = {
      chainId: CHAIN_ID,
      position: POSITION,
      sqrtPriceX96: getSqrtRatioAtTick(0),
    };
    expect(() => buildRemoveV4PositionExecution({ ...params, percentageBps: 0 })).toThrow();
    expect(() => buildRemoveV4PositionExecution({ ...params, percentageBps: 10_001 })).toThrow();
  });

  it("buildCollectV4FeesExecution encodes a modifyLiquidities call", () => {
    const execution = buildCollectV4FeesExecution({
      chainId: CHAIN_ID,
      position: POSITION,
      sqrtPriceX96: getSqrtRatioAtTick(0),
      recipient: POSITION.owner,
    });
    const decoded = decodeFunctionData({ abi: positionManagerAbi, data: execution.data });
    expect(decoded.functionName).toBe("modifyLiquidities");
  });

  it("getMintV4PositionMaxAmounts is at least the quoted amounts", () => {
    const params = {
      chainId: CHAIN_ID,
      poolKey: POOL_KEY,
      sqrtPriceX96: getSqrtRatioAtTick(0),
      tickLower: -600,
      tickUpper: 600,
      amount0: 10n ** 18n,
      amount1: 0n,
    };
    const max = getMintV4PositionMaxAmounts(params);
    expect(max.amount0).toBeGreaterThanOrEqual(params.amount0);
    expect(max.amount1).toBeGreaterThan(0n);
  });
});
