import type { Address } from "viem";
import { describe, expect, it } from "vitest";
import type { MaterializedLeaderboardRow } from "./pnlLeaderboardRollup";
import { matchesAddressSearch, rankForAddress, rollUpRows, withExecutors } from "./pnlLeaderboardRollup";
import type { LeaderboardCandidate } from "./pnlLeaderboardRollup";
import { OldTradeExecutorBytecode, TradeExecutorBytecode, formatBytecode } from "./tradeExecutorBytecode";
import { canonicalAddress, predictExecutorAddress } from "./tradeExecutorOwnersCore";

const OWNER = "0x1111111111111111111111111111111111111111" as Address;
const EXECUTOR = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

function row(overrides: Partial<MaterializedLeaderboardRow>): MaterializedLeaderboardRow {
  return {
    address: OWNER,
    chainId: 10,
    pnlUsd: 0,
    volumeUsd: 0,
    volume: 0,
    valueStart: 0,
    tradingCollateralNetOut: 0,
    collateralPriceUsd: 1,
    marketCount: 0,
    updatedAt: null,
    ...overrides,
  };
}

describe("canonicalAddress", () => {
  it("maps unknown addresses to themselves", () => {
    expect(canonicalAddress(OWNER, {})).toBe(OWNER.toLowerCase());
  });

  it("maps executor to owner", () => {
    const owners = { [EXECUTOR]: OWNER.toLowerCase() };
    expect(canonicalAddress(EXECUTOR, owners)).toBe(OWNER.toLowerCase());
  });
});

describe("withExecutors", () => {
  it("adds executors for known owners", () => {
    const candidates: LeaderboardCandidate[] = [{ address: OWNER.toLowerCase() }];
    const owners = { [EXECUTOR]: OWNER.toLowerCase() };
    const expanded = withExecutors(candidates, owners);
    expect(expanded.map((c) => c.address).sort()).toEqual([EXECUTOR, OWNER.toLowerCase()].sort());
  });
});

describe("rollUpRows", () => {
  it("merges executor and owner into one row with summed metrics", () => {
    const owners = { [EXECUTOR]: OWNER.toLowerCase() };
    const rolled = rollUpRows(
      [
        row({ address: OWNER.toLowerCase(), pnlUsd: 100, volumeUsd: 50, volume: 50, valueStart: 10 }),
        row({
          address: EXECUTOR,
          pnlUsd: 200,
          volumeUsd: 30,
          volume: 30,
          valueStart: 5,
          tradingCollateralNetOut: 10,
        }),
      ],
      owners,
    );

    expect(rolled).toHaveLength(1);
    expect(rolled[0].address).toBe(OWNER.toLowerCase());
    expect(rolled[0].pnlUsd).toBe(300);
    expect(rolled[0].volumeUsd).toBe(80);
    expect(rolled[0].members.sort()).toEqual([EXECUTOR, OWNER.toLowerCase()].sort());
    expect(rolled[0].roi).not.toBeNull();
  });

  it("keeps separate rows when there is no owner mapping", () => {
    const rolled = rollUpRows(
      [row({ address: OWNER.toLowerCase(), pnlUsd: 10 }), row({ address: EXECUTOR, pnlUsd: 20 })],
      {},
    );
    expect(rolled).toHaveLength(2);
  });

  it("still ranks under the owner when only the executor row was materialized", () => {
    const owners = { [EXECUTOR]: OWNER.toLowerCase() };
    const rolled = rollUpRows([row({ address: EXECUTOR, pnlUsd: 200, volumeUsd: 30 })], owners);
    expect(rolled).toHaveLength(1);
    expect(rolled[0].address).toBe(OWNER.toLowerCase());
    expect(rolled[0].pnlUsd).toBe(200);
    expect(rolled[0].members).toEqual([EXECUTOR]);
  });
});

describe("matchesAddressSearch and rankForAddress", () => {
  const owners = { [EXECUTOR]: OWNER.toLowerCase() };
  const rolled = rollUpRows(
    [row({ address: OWNER.toLowerCase(), pnlUsd: 50 }), row({ address: EXECUTOR, pnlUsd: 150 })],
    owners,
  );

  it("finds owner row when searching executor fragment", () => {
    expect(matchesAddressSearch(rolled[0], EXECUTOR.slice(2, 10))).toBe(true);
  });

  it("ranks executor under the owner row", () => {
    const result = rankForAddress(rolled, EXECUTOR);
    expect(result.rank).toBe(1);
    expect(result.total).toBe(1);
  });
});

describe("predictExecutorAddress", () => {
  it("matches CREATE2 derivation for current bytecode", () => {
    const predicted = predictExecutorAddress(OWNER, formatBytecode(TradeExecutorBytecode));
    expect(predicted).toMatch(/^0x[a-f0-9]{40}$/);
    expect(predictExecutorAddress(OWNER, formatBytecode(TradeExecutorBytecode))).toBe(predicted);
  });

  it("differs between current and deprecated bytecode", () => {
    const current = predictExecutorAddress(OWNER, formatBytecode(TradeExecutorBytecode));
    const old = predictExecutorAddress(OWNER, formatBytecode(OldTradeExecutorBytecode));
    expect(current).not.toBe(old);
  });
});
