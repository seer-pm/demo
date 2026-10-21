import type { Market, Token, TransactionData } from "@seer-pm/sdk";
import { type Address, parseUnits, zeroAddress } from "viem";
import { describe, expect, it } from "vitest";
import { foldCostBasis } from "./costBasis";
import { buildCostBasisEvents, conditionalEventLogIndex, swapLogIndex } from "./costBasisEvents";
import type { ConditionalEventRow, OutcomeTransferRow } from "./seerIndexerPortfolio";

const ME = "0x00000000000000000000000000000000000000a1" as Address;
const EXECUTOR = "0x00000000000000000000000000000000000000e1" as Address;
const STRANGER = "0x00000000000000000000000000000000000000f1" as Address;
const ROUTER = "0x0000000000000000000000000000000000000ee1" as Address;
const PRIMARY = "0xaf204776c7245bf4147c2612bf6e5972ee483701" as Address;
const YES = "0x0000000000000000000000000000000000000101" as Address;
const NO = "0x0000000000000000000000000000000000000102" as Address;
const INVALID = "0x0000000000000000000000000000000000000103" as Address;
const CHILD_A = "0x0000000000000000000000000000000000000201" as Address;
const CHILD_B = "0x0000000000000000000000000000000000000202" as Address;
const ROOT_MARKET = "0x0000000000000000000000000000000000000d01" as Address;
const CHILD_MARKET = "0x0000000000000000000000000000000000000d02" as Address;

const primary: Token = { address: PRIMARY, symbol: "sDAI", name: "sDAI", decimals: 18, chainId: 100 } as Token;
const wei = (n: number) => parseUnits(String(n), 18);

function market(over: Partial<Market>): Market {
  return {
    id: ROOT_MARKET,
    type: "Generic",
    marketName: "root",
    collateralToken: PRIMARY,
    wrappedTokens: [YES, NO, INVALID],
    parentMarket: { id: zeroAddress, conditionId: "0x", payoutReported: false, payoutNumerators: [] },
    parentOutcome: 0n,
    payoutReported: false,
    payoutNumerators: [],
    finalizeTs: 0,
    ...over,
  } as unknown as Market;
}
const root = market({});
const child = market({
  id: CHILD_MARKET,
  marketName: "child",
  collateralToken: YES,
  wrappedTokens: [CHILD_A, CHILD_B],
  parentMarket: { id: ROOT_MARKET, conditionId: "0x", payoutReported: false, payoutNumerators: [] },
});

function swap(over: Partial<TransactionData>): TransactionData {
  return {
    marketName: "root",
    marketId: ROOT_MARKET,
    type: "swap",
    blockNumber: 1,
    timestamp: 100,
    collateral: PRIMARY,
    transactionHash: "0xswap",
    eventId: "0xswap#3",
    ...over,
  };
}
function leg(
  over: Partial<ConditionalEventRow> & Pick<ConditionalEventRow, "eventType" | "amount">,
): ConditionalEventRow {
  const tx = over.transactionHash ?? "0xleg";
  const marketId = over.marketId ?? ROOT_MARKET;
  return {
    id: `100:${tx}-5-100:${marketId}`,
    marketId,
    marketEntityId: `100:${marketId}`,
    marketName: "root",
    collateral: PRIMARY,
    timestamp: 200,
    blockNumber: 2,
    transactionHash: tx,
    ...over,
  };
}
function transfer(over: Partial<OutcomeTransferRow>): OutcomeTransferRow {
  return {
    from: STRANGER,
    to: ME,
    token: YES,
    marketId: ROOT_MARKET,
    valueWei: wei(10),
    timestamp: 300,
    logIndex: 9,
    transactionHash: "0xp2p",
    involvesRouter: false,
    ...over,
  };
}

function build(over: Partial<Parameters<typeof buildCostBasisEvents>[0]>) {
  return buildCostBasisEvents({
    account: ME,
    chainId: 100,
    markets: [root, child],
    swaps: [],
    mints: [],
    burns: [],
    conditionalEvents: [],
    transfers: [],
    primaryCollateral: primary,
    identityWallets: new Set([ME, EXECUTOR]),
    ...over,
  });
}

describe("log index parsing", () => {
  it("reads the log index out of each id format", () => {
    expect(conditionalEventLogIndex("100:0xabc-17-100:0xmarket")).toBe(17);
    expect(swapLogIndex("0xabc#4")).toBe(4);
    expect(swapLogIndex(undefined)).toBe(0);
  });
});

describe("buildCostBasisEvents", () => {
  it("maps a primary-collateral buy and sale", () => {
    const { events, stats } = build({
      swaps: [
        swap({ tokenIn: PRIMARY, tokenOut: YES, amountIn: wei(30).toString(), amountOut: wei(100).toString() }),
        swap({
          tokenIn: YES,
          tokenOut: PRIMARY,
          amountIn: wei(40).toString(),
          amountOut: wei(16).toString(),
          timestamp: 101,
        }),
      ],
    });
    expect(stats.swapsUnmapped).toBe(0);
    expect(events).toEqual([
      expect.objectContaining({ kind: "swap", tokenId: YES, tokenAmount: 100, collateralAmount: 30, seq: 3 }),
      expect.objectContaining({ kind: "swap", tokenId: YES, tokenAmount: -40, collateralAmount: 16 }),
    ]);
    expect(events[0]).toMatchObject({ collateral: { kind: "primary" } });
  });

  it("maps a conditional swap to a conversion from the parent outcome", () => {
    const { events } = build({
      swaps: [
        swap({
          marketId: CHILD_MARKET,
          collateral: YES,
          tokenIn: YES,
          tokenOut: CHILD_A,
          amountIn: wei(100).toString(),
          amountOut: wei(120).toString(),
        }),
      ],
    });
    expect(events[0]).toMatchObject({
      kind: "swap",
      tokenId: CHILD_A,
      tokenAmount: 120,
      collateralAmount: 100,
      collateral: { kind: "token", tokenId: YES },
    });
  });

  it("counts a swap that pairs neither side with its market's collateral as unmapped", () => {
    const { events, stats, approximateTokens } = build({
      swaps: [swap({ tokenIn: YES, tokenOut: NO, amountIn: wei(1).toString(), amountOut: wei(1).toString() })],
    });
    expect(events).toHaveLength(0);
    expect(stats.swapsUnmapped).toBe(1);
    expect(approximateTokens).toEqual(new Set([YES, NO]));
  });

  it("turns a split into a priced split request over every outcome, invalid included", () => {
    const { events, priceRequests } = build({ conditionalEvents: [leg({ eventType: "split", amount: wei(50) })] });
    expect(events[0]).toMatchObject({ kind: "split", tokenIds: [YES, NO, INVALID], amount: 50, seq: 5 });
    expect(priceRequests).toHaveLength(1);
    expect(priceRequests[0].apply({})).toBe(false);
    expect(priceRequests[0].apply({ [YES]: 0.9, [NO]: 0.1 })).toBe(true);
    expect((events[0] as { prices?: unknown }).prices).toEqual([0.9, 0.1, undefined]);
    expect((events[0] as { fallbackWeights?: unknown }).fallbackWeights).toEqual([0.5, 0.5, 0]);
  });

  it("without any price, a split leaves Invalid at zero cost", () => {
    const { events } = build({ conditionalEvents: [leg({ eventType: "split", amount: wei(100) })] });
    const basis = foldCostBasis(events);
    expect(basis.get(YES)!.cost).toBeCloseTo(50);
    expect(basis.get(INVALID)!.cost).toBe(0);
    expect(basis.get(YES)!.evenSplit).toBe(true);
  });

  it("collapses a fanned-out split to one leg", () => {
    const fanned = [
      leg({ eventType: "split", amount: wei(50) }),
      leg({ eventType: "split", amount: wei(50), marketId: CHILD_MARKET }),
    ];
    const { events } = build({ conditionalEvents: fanned });
    expect(events.filter((event) => event.kind === "split")).toHaveLength(1);
  });

  it("apportions a redeem's payout across the burned tokens by payout ratio", () => {
    const settled = market({ payoutReported: true, payoutNumerators: [1n, 0n, 0n] });
    const { events } = build({
      markets: [settled],
      conditionalEvents: [leg({ eventType: "redeem", amount: wei(70), transactionHash: "0xredeem" })],
      transfers: [
        transfer({
          from: ME,
          to: ROUTER,
          token: YES,
          valueWei: wei(70),
          transactionHash: "0xredeem",
          involvesRouter: true,
        }),
        transfer({
          from: ME,
          to: ROUTER,
          token: NO,
          valueWei: wei(70),
          transactionHash: "0xredeem",
          involvesRouter: true,
        }),
      ],
    });
    const redeems = events.filter((event) => event.kind === "redeem");
    expect(redeems).toEqual([
      expect.objectContaining({ tokenId: YES, amount: 70, payout: 70 }),
      expect.objectContaining({ tokenId: NO, amount: 70, payout: 0 }),
    ]);
  });

  it("derives the burned amount from the payout when the burn leg is missing and one outcome won", () => {
    const settled = market({ payoutReported: true, payoutNumerators: [0n, 1n, 0n] });
    const { events, stats } = build({
      markets: [settled],
      conditionalEvents: [leg({ eventType: "redeem", amount: wei(12) })],
    });
    expect(stats.redeemsUnresolved).toBe(0);
    expect(events[0]).toMatchObject({ kind: "redeem", tokenId: NO, amount: 12, payout: 12 });
  });

  it("flags a redeem it cannot attribute", () => {
    const { events, stats, approximateTokens } = build({
      conditionalEvents: [leg({ eventType: "redeem", amount: wei(12) })],
    });
    expect(events).toHaveLength(0);
    expect(stats.redeemsUnresolved).toBe(1);
    expect(approximateTokens.has(YES)).toBe(true);
  });

  it("ignores transfers that are legs of a swap, an LP move or a router event", () => {
    const { events, stats } = build({
      swaps: [swap({ tokenIn: PRIMARY, tokenOut: YES, amountIn: wei(1).toString(), amountOut: wei(1).toString() })],
      transfers: [
        transfer({ transactionHash: "0xswap" }),
        transfer({ involvesRouter: true, transactionHash: "0xrouter" }),
        transfer({ from: zeroAddress as Address, transactionHash: "0xmint" }),
      ],
    });
    expect(events.filter((event) => event.kind !== "swap")).toHaveLength(0);
    expect(stats.transfersIgnored).toBe(3);
  });

  it("books an external transfer in at fair value and out at the average", () => {
    const { events, priceRequests } = build({
      transfers: [transfer({}), transfer({ from: ME, to: STRANGER, logIndex: 10, timestamp: 301 })],
    });
    expect(events[0]).toMatchObject({ kind: "transferIn", tokenId: YES, amount: 10, unitCost: 0 });
    expect(priceRequests[0].apply({})).toBe(false);
    expect(priceRequests[0].apply({ [YES]: 0.42 })).toBe(true);
    expect(events[0]).toMatchObject({ unitCost: 0.42 });
    expect(events[1]).toMatchObject({ kind: "transferOut", amount: 10, handoffKey: undefined });
  });

  it("hands cost over between wallets of the same identity", () => {
    const owner = build({ transfers: [transfer({ from: ME, to: EXECUTOR, transactionHash: "0xhand", logIndex: 4 })] });
    expect(owner.events[0]).toMatchObject({ kind: "transferOut", handoffKey: "0xhand:4" });

    const executor = build({
      account: EXECUTOR,
      transfers: [transfer({ from: ME, to: EXECUTOR, transactionHash: "0xhand", logIndex: 4 })],
      handoffs: new Map([["0xhand:4", 0.25]]),
    });
    expect(executor.events[0]).toMatchObject({ kind: "transferIn", unitCost: 0.25 });
    expect(executor.priceRequests).toHaveLength(0);
    expect(executor.stats.transfersHandedOver).toBe(1);
    expect(executor.approximateTokens.has(YES)).toBe(false);
  });

  it("marks an internal transfer as approximate when the sender's cost is unavailable", () => {
    const { events, priceRequests, approximateTokens } = build({
      transfers: [transfer({ from: EXECUTOR, to: ME })],
    });
    expect(priceRequests[0].apply({ [YES]: 0.42 })).toBe(true);
    expect(events[0]).toMatchObject({ kind: "transferIn", unitCost: 0.42 });
    expect(approximateTokens.has(YES)).toBe(true);
  });

  it("marks tokens that entered or left an AMM position", () => {
    const { events } = build({
      mints: [{ ...swap({ type: "lp", token0: YES, token1: PRIMARY, transactionHash: "0xlp" }) }],
    });
    expect(events).toEqual([expect.objectContaining({ kind: "lp", tokenId: YES })]);
  });

  it("end to end: split by price, sell the dear side, keep the cheap side flat", () => {
    const { events, priceRequests } = build({
      conditionalEvents: [leg({ eventType: "split", amount: wei(100), timestamp: 100 })],
      swaps: [
        swap({
          tokenIn: YES,
          tokenOut: PRIMARY,
          amountIn: wei(100).toString(),
          amountOut: wei(88).toString(),
          timestamp: 150,
        }),
      ],
    });
    priceRequests[0].apply({ [YES]: 0.9, [NO]: 0.1, [INVALID]: 0 });
    const basis = foldCostBasis(events);
    expect(basis.get(YES)!.realized).toBeCloseTo(-2);
    expect(basis.get(NO)!.averageCost).toBeCloseTo(0.1);
    expect(basis.get(INVALID)!.cost).toBe(0);
  });
});
