import type { Address } from "viem";
import { gnosis, optimism } from "viem/chains";
import { describe, expect, it } from "vitest";
import type { LeaderboardCandidate, MaterializedLeaderboardRow, RolledUpLeaderboardRow } from "./pnlLeaderboardRollup";
import {
  matchesAddressSearch,
  rankForAddress,
  rollUpRows,
  sortLeaderboardRows,
  withExecutors,
} from "./pnlLeaderboardRollup";
import { OldTradeExecutorBytecode, TradeExecutorBytecode, formatBytecode } from "./tradeExecutorBytecode";
import {
  GNOSIS_TRADE_EXECUTOR_FACTORY,
  OPTIMISM_TRADE_EXECUTOR_FACTORY,
  TRADE_EXECUTOR_CHAINS,
  canonicalAddress,
  jobUsesTradeExecutors,
  predictExecutorAddress,
  predictedExecutorsForOwner,
} from "./tradeExecutorOwnersCore";

const OWNER = "0x1111111111111111111111111111111111111111" as Address;
const EXECUTOR = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const OTHER = "0x2222222222222222222222222222222222222222";

function row(overrides: Partial<MaterializedLeaderboardRow>): MaterializedLeaderboardRow {
  return {
    address: OWNER,
    chainId: 10,
    pnlUsd: 0,
    volumeUsd: 0,
    valueStart: 0,
    capitalDeployed: 0,
    collateralPriceUsd: 1,
    marketCount: 0,
    updatedAt: null,
    ...overrides,
  };
}

function rolled(overrides: Partial<RolledUpLeaderboardRow>): RolledUpLeaderboardRow {
  const address = (overrides.address ?? OWNER).toLowerCase();
  return {
    address,
    pnlUsd: 0,
    volumeUsd: 0,
    capitalUsd: 100,
    marketCount: 0,
    updatedAt: null,
    roi: 0,
    members: [address],
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
    const rolledRows = rollUpRows(
      [
        row({ address: OWNER.toLowerCase(), pnlUsd: 100, volumeUsd: 50, valueStart: 10, capitalDeployed: 50 }),
        row({
          address: EXECUTOR,
          pnlUsd: 200,
          volumeUsd: 30,
          valueStart: 5,
          capitalDeployed: 40,
        }),
      ],
      owners,
    );

    expect(rolledRows).toHaveLength(1);
    expect(rolledRows[0].address).toBe(OWNER.toLowerCase());
    expect(rolledRows[0].pnlUsd).toBe(300);
    expect(rolledRows[0].volumeUsd).toBe(80);
    expect(rolledRows[0].members.sort()).toEqual([EXECUTOR, OWNER.toLowerCase()].sort());
    expect(rolledRows[0].roi).not.toBeNull();
  });

  it("keeps separate rows when there is no owner mapping", () => {
    const rolledRows = rollUpRows(
      [row({ address: OWNER.toLowerCase(), pnlUsd: 10 }), row({ address: EXECUTOR, pnlUsd: 20 })],
      {},
    );
    expect(rolledRows).toHaveLength(2);
  });

  it("still ranks under the owner when only the executor row was materialized", () => {
    const owners = { [EXECUTOR]: OWNER.toLowerCase() };
    const rolledRows = rollUpRows([row({ address: EXECUTOR, pnlUsd: 200, volumeUsd: 30 })], owners);
    expect(rolledRows).toHaveLength(1);
    expect(rolledRows[0].address).toBe(OWNER.toLowerCase());
    expect(rolledRows[0].pnlUsd).toBe(200);
    expect(rolledRows[0].members).toEqual([EXECUTOR]);
  });

  it("rolls up Gnosis foresight rows the same way as Optimism", () => {
    const owners = { [EXECUTOR]: OWNER.toLowerCase() };
    const rolledRows = rollUpRows(
      [
        row({ chainId: gnosis.id, address: OWNER.toLowerCase(), pnlUsd: 10 }),
        row({ chainId: gnosis.id, address: EXECUTOR, pnlUsd: 40 }),
      ],
      owners,
    );
    expect(rolledRows).toHaveLength(1);
    expect(rolledRows[0].pnlUsd).toBe(50);
    expect(rolledRows[0].address).toBe(OWNER.toLowerCase());
  });
});

describe("sortLeaderboardRows", () => {
  const rows = [
    rolled({ address: OWNER, pnlUsd: 100, volumeUsd: 10, roi: 0.5, marketCount: 2 }),
    rolled({ address: OTHER, pnlUsd: 50, volumeUsd: 90, roi: 1.2, marketCount: 5 }),
    rolled({ address: EXECUTOR, pnlUsd: 200, volumeUsd: 40, roi: null, marketCount: 1, capitalUsd: 0 }),
  ];

  it("sorts by pnl desc by default metric order", () => {
    expect(sortLeaderboardRows(rows, "pnl", "desc").map((r) => r.address)).toEqual([
      EXECUTOR,
      OWNER.toLowerCase(),
      OTHER,
    ]);
  });

  it("sorts by volume asc", () => {
    expect(sortLeaderboardRows(rows, "volume", "asc").map((r) => r.address)).toEqual([
      OWNER.toLowerCase(),
      EXECUTOR,
      OTHER,
    ]);
  });

  it("sorts by markets desc", () => {
    expect(sortLeaderboardRows(rows, "markets", "desc").map((r) => r.address)).toEqual([
      OTHER,
      OWNER.toLowerCase(),
      EXECUTOR,
    ]);
  });

  it("puts null ROI last in both directions", () => {
    expect(sortLeaderboardRows(rows, "roi", "desc").map((r) => r.address)).toEqual([
      OTHER,
      OWNER.toLowerCase(),
      EXECUTOR,
    ]);
    expect(sortLeaderboardRows(rows, "roi", "asc").map((r) => r.address)).toEqual([
      OWNER.toLowerCase(),
      OTHER,
      EXECUTOR,
    ]);
  });
});

describe("matchesAddressSearch and rankForAddress", () => {
  const owners = { [EXECUTOR]: OWNER.toLowerCase() };
  const rolledRows = sortLeaderboardRows(
    rollUpRows([row({ address: OWNER.toLowerCase(), pnlUsd: 50 }), row({ address: EXECUTOR, pnlUsd: 150 })], owners),
    "pnl",
    "desc",
  );

  it("finds owner row when searching executor fragment", () => {
    expect(matchesAddressSearch(rolledRows[0], EXECUTOR.slice(2, 10))).toBe(true);
  });

  it("ranks executor under the owner row", () => {
    const result = rankForAddress(rolledRows, EXECUTOR);
    expect(result.rank).toBe(1);
    expect(result.total).toBe(1);
  });
});

describe("predictExecutorAddress", () => {
  const oldBytecode = formatBytecode(OldTradeExecutorBytecode);
  const currentBytecode = formatBytecode(TradeExecutorBytecode);

  it("matches CREATE2 derivation for Optimism current bytecode", () => {
    const predicted = predictExecutorAddress(OWNER, currentBytecode, OPTIMISM_TRADE_EXECUTOR_FACTORY);
    expect(predicted).toMatch(/^0x[a-f0-9]{40}$/);
    expect(predictExecutorAddress(OWNER, currentBytecode, OPTIMISM_TRADE_EXECUTOR_FACTORY)).toBe(predicted);
  });

  it("differs between current and deprecated bytecode on Optimism", () => {
    const current = predictExecutorAddress(OWNER, currentBytecode, OPTIMISM_TRADE_EXECUTOR_FACTORY);
    const old = predictExecutorAddress(OWNER, oldBytecode, OPTIMISM_TRADE_EXECUTOR_FACTORY);
    expect(current).not.toBe(old);
  });

  it("differs between Optimism and Gnosis factories for the same bytecode", () => {
    const onOptimism = predictExecutorAddress(OWNER, oldBytecode, OPTIMISM_TRADE_EXECUTOR_FACTORY);
    const onGnosis = predictExecutorAddress(OWNER, oldBytecode, GNOSIS_TRADE_EXECUTOR_FACTORY);
    expect(onOptimism).not.toBe(onGnosis);
    expect(onGnosis).toMatch(/^0x[a-f0-9]{40}$/);
  });

  it("Gnosis config probes only the old bytecode", () => {
    const gnosisConfig = TRADE_EXECUTOR_CHAINS[gnosis.id];
    expect(gnosisConfig.bytecodes).toHaveLength(1);
    expect(gnosisConfig.bytecodes[0]).toBe(oldBytecode);
    const predicted = predictedExecutorsForOwner(OWNER, gnosisConfig);
    expect(predicted).toEqual([
      predictExecutorAddress(OWNER, oldBytecode, GNOSIS_TRADE_EXECUTOR_FACTORY).toLowerCase(),
    ]);
  });

  it("Optimism config probes current and old bytecodes", () => {
    const optimismConfig = TRADE_EXECUTOR_CHAINS[optimism.id];
    expect(predictedExecutorsForOwner(OWNER, optimismConfig)).toHaveLength(2);
  });
});

describe("jobUsesTradeExecutors", () => {
  it("enables deepfund, foresight, and all on their TradeExecutor chains", () => {
    expect(jobUsesTradeExecutors("deepfund:octant", optimism.id)).toBe(true);
    expect(jobUsesTradeExecutors("foresight:movies-1", gnosis.id)).toBe(true);
    expect(jobUsesTradeExecutors("all", optimism.id)).toBe(true);
    expect(jobUsesTradeExecutors("all", gnosis.id)).toBe(true);
  });

  it("skips opportunity, cross-chain app jobs, and unsupported chains", () => {
    expect(jobUsesTradeExecutors("opportunity", gnosis.id)).toBe(false);
    expect(jobUsesTradeExecutors("opportunity", optimism.id)).toBe(false);
    expect(jobUsesTradeExecutors("deepfund:octant", gnosis.id)).toBe(false);
    expect(jobUsesTradeExecutors("foresight:movies-1", optimism.id)).toBe(false);
    expect(jobUsesTradeExecutors("foresight:movies-1", 1)).toBe(false);
  });
});
