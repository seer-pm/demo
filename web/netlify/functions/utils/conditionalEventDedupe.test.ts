import type { Address } from "viem";
import { describe, expect, it } from "vitest";
import {
  type ConditionalEventRow,
  conditionalEventLegKey,
  dedupeConditionalEventLegs,
  routerPrimaryNetFromConditionalEvents,
} from "./seerIndexerPortfolio";

const TX = "0xeb54b8839e6a83d5dce5ffda4bbc421bf26998cf43a8b04fc8ec71194c1918d0";
const PRIMARY = {
  address: "0xaf204776c7245bf4147c2612bf6e5972ee483701" as Address,
  decimals: 18,
  symbol: "sDAI",
  name: "sDAI",
};

/** Same shape the indexer emits: id ends in `-{chainId}:{marketAddress}`. */
function ev(marketAddress: string, logIndex: number, over: Partial<ConditionalEventRow> = {}): ConditionalEventRow {
  const marketEntityId = `100:${marketAddress}`;
  return {
    id: `100:${TX}-${logIndex}-${marketEntityId}`,
    marketId: marketAddress,
    marketEntityId,
    marketName: `market ${marketAddress.slice(0, 6)}`,
    eventType: "split",
    amount: 10n ** 18n,
    collateral: PRIMARY.address,
    timestamp: 1_800_000_000,
    blockNumber: 1,
    transactionHash: TX,
    ...over,
  };
}

// The five markets the live indexer fans this condition out to.
const FANOUT = [
  "0xeef5e81147d510a6d7cd07d6d41c8e714790ae02",
  "0x59498fb20fd50706ae4737d5710bfcacbb174460",
  "0xbf3e3768ae88b4dbcea75500ed61fe99f3af42dc",
  "0x4ef14dead52b9d703c903e3e04bacb0d4793bc5e",
  "0x89afa5848a9bcc224b8f00690eae657886ff0102",
];

describe("conditionalEventLegKey", () => {
  it("strips the market suffix so every fanned-out row shares one key", () => {
    const keys = new Set(FANOUT.map((m) => conditionalEventLegKey(ev(m, 151))));
    expect(keys).toEqual(new Set([`100:${TX}-151`]));
  });

  it("keeps distinct CTF events in the same tx apart", () => {
    expect(conditionalEventLegKey(ev(FANOUT[0], 151))).not.toBe(conditionalEventLegKey(ev(FANOUT[0], 184)));
  });

  it("falls back to the whole id when the suffix does not match", () => {
    const row = { id: "100:0xdeadbeef-7", marketEntityId: "100:0xsomethingelse" };
    expect(conditionalEventLegKey(row)).toBe("100:0xdeadbeef-7");
  });
});

describe("dedupeConditionalEventLegs", () => {
  it("collapses a fan-out group to one row and reports it", () => {
    const { events, fannedOutLegs } = dedupeConditionalEventLegs(FANOUT.map((m) => ev(m, 151)));
    expect(events).toHaveLength(1);
    expect(fannedOutLegs).toBe(1);
  });

  it("attributes to a preferred market when the caller knows one", () => {
    const { events } = dedupeConditionalEventLegs(
      FANOUT.map((m) => ev(m, 151)),
      [FANOUT[2].toUpperCase()],
    );
    expect(events[0].marketId).toBe(FANOUT[2]);
  });

  it("falls back to the lowest market address, so attribution is reproducible", () => {
    const lowest = [...FANOUT].sort()[0];
    const forward = dedupeConditionalEventLegs(FANOUT.map((m) => ev(m, 151)));
    const reversed = dedupeConditionalEventLegs([...FANOUT].reverse().map((m) => ev(m, 151)));
    expect(forward.events[0].marketId).toBe(lowest);
    expect(reversed.events[0].marketId).toBe(lowest);
  });

  it("leaves ungrouped legs untouched and preserves their order", () => {
    const rows = [ev(FANOUT[0], 10), ev(FANOUT[1], 11), ev(FANOUT[2], 12)];
    const { events, fannedOutLegs } = dedupeConditionalEventLegs(rows);
    expect(fannedOutLegs).toBe(0);
    expect(events.map((e) => e.marketId)).toEqual([FANOUT[0], FANOUT[1], FANOUT[2]]);
  });

  it("collapses each CTF event of a multi-leg tx independently", () => {
    const rows = [...FANOUT.map((m) => ev(m, 151)), ...FANOUT.map((m) => ev(m, 184))];
    const { events, fannedOutLegs } = dedupeConditionalEventLegs(rows);
    expect(events).toHaveLength(2);
    expect(fannedOutLegs).toBe(2);
  });
});

describe("routerPrimaryNetFromConditionalEvents", () => {
  it("books a fanned-out split once instead of once per duplicate market", () => {
    const { netHuman, splitOutHuman, fannedOutLegs } = routerPrimaryNetFromConditionalEvents(
      FANOUT.map((m) => ev(m, 151)),
      PRIMARY,
    );
    expect(splitOutHuman).toBe(1);
    expect(netHuman).toBe(-1);
    expect(fannedOutLegs).toBe(1);
  });

  it("still ignores legs whose collateral is not the primary token", () => {
    const parentOutcome = "0x9c58bacc331c9aa871afd802db6379a98e80cedb" as Address;
    const { netHuman, splitOutHuman } = routerPrimaryNetFromConditionalEvents(
      FANOUT.map((m) => ev(m, 151, { collateral: parentOutcome })),
      PRIMARY,
    );
    expect(splitOutHuman).toBe(0);
    expect(netHuman).toBe(0);
  });

  it("nets a split against a later merge of the same size", () => {
    const rows = [...FANOUT.map((m) => ev(m, 151)), ...FANOUT.map((m) => ev(m, 184, { eventType: "merge" as const }))];
    const { netHuman, splitOutHuman } = routerPrimaryNetFromConditionalEvents(rows, PRIMARY);
    expect(netHuman).toBe(0);
    // Gross deployment survives the round trip — that is the ROI denominator.
    expect(splitOutHuman).toBe(1);
  });
});
