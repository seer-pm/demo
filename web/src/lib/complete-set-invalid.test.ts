/**
 * Multi-leg complete-set quotes: buying Invalid mints a set and sells every other outcome, selling
 * it buys every other outcome and merges. The AMM is stubbed with flat prices per outcome.
 */
import {
  AmmTrade,
  CompleteSetLiquidityError,
  type Market,
  REALITY_TEMPLATE_SINGLE_SELECT,
  REALITY_TEMPLATE_UINT,
  type Token,
  TradeType,
  fetchCompleteSetAlternativeQuote,
  getCompleteSetRoutingDisabledReasons,
  getCompleteSetSwapOutcomeIndexes,
  getInvalidOutcomeIndex,
  withInvalidPriceAsComplement,
} from "@seer-pm/sdk";
import type { Address, Client } from "viem";
import { formatUnits, parseUnits, zeroAddress } from "viem";
import { multicall } from "viem/actions";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchAmmQuote } from "../../../packages/seer-pm-sdk/src/quote";

vi.mock("../../../packages/seer-pm-sdk/src/quote", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../../packages/seer-pm-sdk/src/quote")>()),
  fetchAmmQuote: vi.fn(),
}));

vi.mock("viem/actions", async (importOriginal) => ({
  ...(await importOriginal<typeof import("viem/actions")>()),
  multicall: vi.fn(),
}));

const ACCOUNT = "0x0000000000000000000000000000000000000009" as Address;
const COLLATERAL = "0x0000000000000000000000000000000000000001" as Address;
const INVALID = "0x00000000000000000000000000000000000000ff" as Address;
const DEX = "0x00000000000000000000000000000000000000ab" as Address;

const outcomeAddress = (index: number) => `0x${(0x20 + index).toString(16).padStart(40, "0")}` as Address;

const createMinimalMarket = (overrides: Partial<Market> = {}): Market =>
  ({
    id: zeroAddress,
    type: "Generic",
    marketName: "",
    outcomes: ["DOWN", "UP", "Invalid"],
    collateralToken: COLLATERAL,
    collateralToken1: zeroAddress,
    collateralToken2: zeroAddress,
    wrappedTokens: [outcomeAddress(0), outcomeAddress(1), INVALID],
    parentMarket: { id: zeroAddress, conditionId: "0x0", payoutReported: false, payoutNumerators: [] },
    parentOutcome: 0n,
    parentCollectionId: "0x0",
    conditionId: "0x0",
    questionId: "0x0",
    templateId: BigInt(REALITY_TEMPLATE_UINT),
    questions: [],
    openingTs: 0,
    finalizeTs: 0,
    encodedQuestions: [],
    lowerBound: 0n,
    upperBound: 0n,
    payoutReported: false,
    payoutNumerators: [],
    chainId: 100,
    outcomesSupply: 0n,
    liquidityUSD: 0,
    openInterestUSD: 0,
    maxLiquidity: 0,
    incentive: 0,
    hasLiquidity: false,
    categories: ["misc"],
    poolBalance: [],
    odds: [50, 50, 0],
    url: "",
    verification: undefined,
    ...overrides,
  }) as Market;

/** `outcomeCount` tradeable outcomes plus Invalid. */
const createCategoricalMarket = (outcomeCount: number) =>
  createMinimalMarket({
    templateId: BigInt(REALITY_TEMPLATE_SINGLE_SELECT),
    outcomes: [...Array.from({ length: outcomeCount }, (_, index) => `OUTCOME_${index}`), "Invalid"],
    wrappedTokens: [...Array.from({ length: outcomeCount }, (_, index) => outcomeAddress(index)), INVALID],
  });

const ONE = 10n ** 18n;
const units = (n: number) => parseUnits(String(n), 18);

/** Flat price per outcome address, in collateral per token. */
type PriceBook = Record<string, number>;

function priceOf(book: PriceBook, token: Token): bigint {
  const price = book[token.address.toLowerCase()];
  if (price === undefined) {
    throw new Error("No route found");
  }
  return parseUnits(String(price), 18);
}

function createTrade(tradeType: TradeType, tokenIn: Token, tokenOut: Token, amountIn: bigint, amountOut: bigint) {
  const trade = Object.create(AmmTrade.prototype) as AmmTrade;
  Object.assign(trade, {
    chainId: 100,
    tradeType,
    approveAddress: DEX,
    tokenIn,
    tokenOut,
    amountIn,
    amountOut,
    maximumAmountIn: () => (amountIn * 101n) / 100n,
    minimumAmountOut: () => (amountOut * 99n) / 100n,
    swapTransaction: async () => ({ to: DEX, data: "0x", value: 0n }),
  });
  return trade;
}

/**
 * Pool depth per outcome address: the most outcome tokens the pool can absorb on a sell and hand
 * out on a buy. Unlisted outcomes are bottomless.
 */
type DepthBook = Record<string, { sellDepth?: bigint; buyDepth?: bigint }>;

function swapRevertsError() {
  const error = new Error("Swap simulation reverted; the router rejected the built calldata.");
  error.name = "SwapRevertsError";
  return error;
}

/**
 * Stub the Lens quoter with flat prices: no price impact, so the math below is exact. Depth is
 * mimicked the way the real quoter misreports it: a sell past the depth still claims the whole
 * input at a collapsed output, an exact-out buy past the depth fails in the gas guard, and an
 * exact-in buy hands out whatever is left.
 */
function stubAmm(book: PriceBook, depths: DepthBook = {}) {
  vi.mocked(fetchAmmQuote).mockImplementation(
    async (_client, tradeType, _chainId, _account, amount, outcomeToken, collateralToken, swapType) => {
      const price = priceOf(book, outcomeToken);
      const depth = depths[outcomeToken.address.toLowerCase()] ?? {};
      const parsed = parseUnits(amount, 18);
      if (swapType === "sell") {
        // exact input: sell `amount` outcome tokens
        const sold = depth.sellDepth !== undefined && parsed > depth.sellDepth ? depth.sellDepth : parsed;
        const out = (sold * price) / ONE;
        return {
          value: out,
          decimals: 18,
          buyToken: collateralToken.address as Address,
          sellToken: outcomeToken.address as Address,
          sellAmount: amount,
          swapType,
          trade: createTrade(tradeType, outcomeToken, collateralToken, parsed, out),
        };
      }
      if (tradeType === TradeType.EXACT_INPUT) {
        // exact input: spend `amount` collateral on outcome tokens
        const wanted = (parsed * ONE) / price;
        const bought = depth.buyDepth !== undefined && wanted > depth.buyDepth ? depth.buyDepth : wanted;
        return {
          value: bought,
          decimals: 18,
          buyToken: outcomeToken.address as Address,
          sellToken: collateralToken.address as Address,
          sellAmount: amount,
          swapType,
          trade: createTrade(tradeType, collateralToken, outcomeToken, parsed, bought),
        };
      }
      // exact output: buy `amount` outcome tokens
      if (depth.buyDepth !== undefined && parsed > depth.buyDepth) {
        throw swapRevertsError();
      }
      const cost = (parsed * price) / ONE;
      return {
        value: cost,
        decimals: 18,
        buyToken: outcomeToken.address as Address,
        sellToken: collateralToken.address as Address,
        sellAmount: formatUnits(cost, 18),
        swapType,
        trade: createTrade(tradeType, collateralToken, outcomeToken, cost, parsed),
      };
    },
  );
}

/** Wallet balances as `fetchWalletBalances` reads them: collateral first, then every wrapped token. */
function stubBalances(collateral: bigint, outcomes: bigint[]) {
  vi.mocked(multicall).mockResolvedValue([collateral, ...outcomes]);
}

const client = {} as Client;

describe("getCompleteSetSwapOutcomeIndexes", () => {
  it("swaps the one opposite outcome for a regular target on a binary market", () => {
    expect(getCompleteSetSwapOutcomeIndexes(createMinimalMarket(), 0)).toEqual([1]);
    expect(getCompleteSetSwapOutcomeIndexes(createMinimalMarket(), 1)).toEqual([0]);
  });

  it("swaps every real outcome when the target is Invalid", () => {
    expect(getCompleteSetSwapOutcomeIndexes(createMinimalMarket(), 2)).toEqual([0, 1]);
    expect(getCompleteSetSwapOutcomeIndexes(createCategoricalMarket(4), 4)).toEqual([0, 1, 2, 3]);
  });

  it("never swaps Invalid for a regular target, since it has no pool", () => {
    expect(getCompleteSetSwapOutcomeIndexes(createCategoricalMarket(4), 1)).toEqual([0, 2, 3]);
  });
});

describe("getCompleteSetRoutingDisabledReasons", () => {
  it("enables Invalid on markets of any size while regular outcomes stay binary-only", () => {
    const market = createCategoricalMarket(5);
    expect(getCompleteSetRoutingDisabledReasons(market, getInvalidOutcomeIndex(market), COLLATERAL)).toEqual([]);
    expect(getCompleteSetRoutingDisabledReasons(market, 0, COLLATERAL)).not.toEqual([]);
    expect(getCompleteSetRoutingDisabledReasons(market, 2, COLLATERAL)).not.toEqual([]);
  });
});

describe("withInvalidPriceAsComplement", () => {
  const market = createCategoricalMarket(3);

  it("prices Invalid as one minus the other outcomes, whatever its pool said", () => {
    const result = withInvalidPriceAsComplement(market, [0.5, 0.3, 0.1, 0.9]);
    expect(result.slice(0, 3)).toEqual([0.5, 0.3, 0.1]);
    expect(result[3]).toBeCloseTo(0.1, 12);
  });

  it("floors at zero when the others already sum past one", () => {
    expect(withInvalidPriceAsComplement(market, [0.6, 0.4, 0.2, 0])).toEqual([0.6, 0.4, 0.2, 0]);
  });

  it("is unknown while any other outcome has no price", () => {
    const result = withInvalidPriceAsComplement(market, [0.6, Number.NaN, 0.2, 0.1]);
    expect(result.slice(0, 3)).toEqual([0.6, Number.NaN, 0.2]);
    expect(Number.isNaN(result[3])).toBe(true);
  });

  it("leaves markets without an Invalid outcome alone", () => {
    expect(withInvalidPriceAsComplement(createMinimalMarket({ type: "Futarchy" }), [0.5, 0.5, 0.5])).toEqual([
      0.5, 0.5, 0.5,
    ]);
  });
});

describe("buying Invalid: mint + sell every other outcome", () => {
  // Three real outcomes worth 0.5 + 0.3 + 0.15, so Invalid is worth 0.05.
  const market = createCategoricalMarket(3);
  const invalidIndex = getInvalidOutcomeIndex(market);
  const book: PriceBook = {
    [outcomeAddress(0)]: 0.5,
    [outcomeAddress(1)]: 0.3,
    [outcomeAddress(2)]: 0.15,
  };

  beforeEach(() => {
    vi.mocked(fetchAmmQuote).mockReset();
    vi.mocked(multicall).mockReset();
    stubAmm(book);
  });

  it("exact output: splits the requested amount and sells one leg per real outcome", async () => {
    const quote = await fetchCompleteSetAlternativeQuote({
      market,
      targetOutcomeIndex: invalidIndex,
      tradeType: TradeType.EXACT_OUTPUT,
      swapType: "buy",
      amount: "100",
      account: undefined,
      client,
      maxSlippage: "1",
    });

    expect(quote?.route).toBe("mintSell");
    expect(quote?.value).toBe(units(100));
    // 100 - (50 + 30 + 15)
    expect(quote?.netCollateral).toBe(units(5));
    const leg = quote?.completeSetLeg;
    expect(leg?.splitAmount).toBe(units(100));
    expect(leg?.requiredCollateral).toBe(units(100));
    expect(leg?.swapLegs?.map((swapLeg) => swapLeg.outcomeIndex)).toEqual([0, 1, 2]);
    expect(leg?.swapLegs?.every((swapLeg) => swapLeg.amount === units(100))).toBe(true);
    // Not a binary leg: the single-outcome fields stay empty.
    expect(leg?.oppositeOutcomeToken).toBeUndefined();
    expect(quote?.trade).toBe(leg?.swapLegs?.[0].trade);
  });

  it("exact input: grows the split until the net cost spends the budget", async () => {
    const quote = await fetchCompleteSetAlternativeQuote({
      market,
      targetOutcomeIndex: invalidIndex,
      tradeType: TradeType.EXACT_INPUT,
      swapType: "buy",
      amount: "5",
      account: undefined,
      client,
      maxSlippage: "1",
    });

    // Net cost is 5% of the split, so 5 collateral buys 100 Invalid.
    expect(quote?.route).toBe("mintSell");
    expect(quote?.value).toBe(units(100));
    expect(quote?.netCollateral).toBe(units(5));
    expect(quote?.completeSetLeg?.requiredCollateral).toBe(units(100));
  });

  it("exact input: caps the split at the collateral the wallet holds", async () => {
    stubBalances(units(40), [0n, 0n, 0n, 0n]);

    const quote = await fetchCompleteSetAlternativeQuote({
      market,
      targetOutcomeIndex: invalidIndex,
      tradeType: TradeType.EXACT_INPUT,
      swapType: "buy",
      amount: "5",
      account: ACCOUNT,
      client,
      maxSlippage: "1",
    });

    expect(quote?.value).toBe(units(40));
    expect(quote?.netCollateral).toBe(units(2));
    expect(quote?.completeSetLeg?.requiredCollateral).toBe(units(40));
  });

  it("regular target on a binary market: still one leg, Invalid stays in the wallet", async () => {
    const binary = createMinimalMarket();
    stubAmm({ [outcomeAddress(0)]: 0.4, [outcomeAddress(1)]: 0.55 });

    const quote = await fetchCompleteSetAlternativeQuote({
      market: binary,
      targetOutcomeIndex: 0,
      tradeType: TradeType.EXACT_OUTPUT,
      swapType: "buy",
      amount: "10",
      account: undefined,
      client,
      maxSlippage: "1",
    });

    const leg = quote?.completeSetLeg;
    expect(leg?.swapLegs).toHaveLength(1);
    expect(leg?.oppositeOutcomeIndex).toBe(1);
    expect(leg?.oppositeOutcomeToken?.address).toBe(outcomeAddress(1));
    expect(quote?.netCollateral).toBe(units(4.5));
  });
});

describe("selling Invalid: buy every other outcome + merge", () => {
  const market = createCategoricalMarket(3);
  const invalidIndex = getInvalidOutcomeIndex(market);
  const book: PriceBook = {
    [outcomeAddress(0)]: 0.5,
    [outcomeAddress(1)]: 0.3,
    [outcomeAddress(2)]: 0.15,
  };

  beforeEach(() => {
    vi.mocked(fetchAmmQuote).mockReset();
    vi.mocked(multicall).mockReset();
    stubAmm(book);
  });

  it("exact input: buys what the wallet lacks of each outcome and merges", async () => {
    // Holds 30 of outcome 0, 100 Invalid, and plenty of collateral.
    stubBalances(units(1000), [units(30), 0n, 0n, units(100)]);

    const quote = await fetchCompleteSetAlternativeQuote({
      market,
      targetOutcomeIndex: invalidIndex,
      tradeType: TradeType.EXACT_INPUT,
      swapType: "sell",
      amount: "100",
      account: ACCOUNT,
      client,
      maxSlippage: "1",
    });

    expect(quote?.route).toBe("buyMerge");
    const leg = quote?.completeSetLeg;
    expect(leg?.mergeAmount).toBe(units(100));
    expect(leg?.swapLegs?.map((swapLeg) => [swapLeg.outcomeIndex, swapLeg.amount])).toEqual([
      [0, units(70)],
      [1, units(100)],
      [2, units(100)],
    ]);
    expect(leg?.heldOutcomeTokens).toEqual([
      { token: expect.objectContaining({ address: outcomeAddress(0) }), amount: units(30) },
    ]);
    // 70 * 0.5 + 100 * 0.3 + 100 * 0.15
    expect(quote?.netCollateral).toBe(units(80));
    expect(quote?.value).toBe(units(20));
    // Buys at the slippage limit (1% over in the stub).
    expect(leg?.requiredCollateral).toBe((units(80) * 101n) / 100n);
    // Invalid is the target here, so it is not reported as a held token.
    expect(leg?.invalidOutcomeToken).toBeUndefined();
  });

  it("is skipped when the wallet cannot fund the buys", async () => {
    stubBalances(units(10), [0n, 0n, 0n, units(100)]);

    const quote = await fetchCompleteSetAlternativeQuote({
      market,
      targetOutcomeIndex: invalidIndex,
      tradeType: TradeType.EXACT_INPUT,
      swapType: "sell",
      amount: "100",
      account: ACCOUNT,
      client,
      maxSlippage: "1",
    });

    expect(quote).toBeUndefined();
  });

  it("exact output: finds the merge amount that nets the requested collateral", async () => {
    stubBalances(units(1000), [0n, 0n, 0n, units(1000)]);

    const quote = await fetchCompleteSetAlternativeQuote({
      market,
      targetOutcomeIndex: invalidIndex,
      tradeType: TradeType.EXACT_OUTPUT,
      swapType: "sell",
      amount: "5",
      account: ACCOUNT,
      client,
      maxSlippage: "1",
    });

    // Every merged set nets 0.05, so 5 collateral takes 100 Invalid (the search lands within a wei).
    expect(quote?.route).toBe("buyMerge");
    expect(quote?.value).toBeGreaterThanOrEqual(units(100));
    expect(quote?.value).toBeLessThan(units(100) + 1000n);
  });

  it("regular target on a binary market: Invalid must already be held for the merge", async () => {
    const binary = createMinimalMarket();
    stubAmm({ [outcomeAddress(0)]: 0.4, [outcomeAddress(1)]: 0.55 });
    stubBalances(units(1000), [units(100), 0n, 0n]);

    const missingInvalid = await fetchCompleteSetAlternativeQuote({
      market: binary,
      targetOutcomeIndex: 0,
      tradeType: TradeType.EXACT_INPUT,
      swapType: "sell",
      amount: "100",
      account: ACCOUNT,
      client,
      maxSlippage: "1",
    });
    expect(missingInvalid).toBeUndefined();

    stubBalances(units(1000), [units(100), 0n, units(100)]);
    const quote = await fetchCompleteSetAlternativeQuote({
      market: binary,
      targetOutcomeIndex: 0,
      tradeType: TradeType.EXACT_INPUT,
      swapType: "sell",
      amount: "100",
      account: ACCOUNT,
      client,
      maxSlippage: "1",
    });
    const leg = quote?.completeSetLeg;
    expect(leg?.swapLegs).toHaveLength(1);
    expect(leg?.oppositeOutcomeToken?.address).toBe(outcomeAddress(1));
    expect(leg?.invalidOutcomeToken?.address).toBe(INVALID);
    expect(leg?.heldOutcomeTokens).toEqual([
      { token: expect.objectContaining({ address: INVALID }), amount: units(100) },
    ]);
  });
});

describe("buying Invalid when a pool cannot absorb its leg", () => {
  const market = createCategoricalMarket(3);
  const invalidIndex = getInvalidOutcomeIndex(market);
  const book: PriceBook = {
    [outcomeAddress(0)]: 0.5,
    [outcomeAddress(1)]: 0.3,
    [outcomeAddress(2)]: 0.15,
  };

  beforeEach(() => {
    vi.mocked(fetchAmmQuote).mockReset();
    vi.mocked(multicall).mockReset();
  });

  it("exact output: refuses and names the outcome whose pool runs dry", async () => {
    stubAmm(book, { [outcomeAddress(1)]: { sellDepth: units(60) } });

    const attempt = fetchCompleteSetAlternativeQuote({
      market,
      targetOutcomeIndex: invalidIndex,
      tradeType: TradeType.EXACT_OUTPUT,
      swapType: "buy",
      amount: "100",
      account: undefined,
      client,
      maxSlippage: "1",
    });

    await expect(attempt).rejects.toBeInstanceOf(CompleteSetLiquidityError);
    await expect(attempt).rejects.toMatchObject({
      outcomes: [expect.objectContaining({ address: outcomeAddress(1) })],
      message: expect.stringContaining("Not enough liquidity to sell"),
    });
  });

  it("exact input: settles on a split the shallow pool still absorbs, leaving budget unspent", async () => {
    stubAmm(book, { [outcomeAddress(2)]: { sellDepth: units(60) } });

    const quote = await fetchCompleteSetAlternativeQuote({
      market,
      targetOutcomeIndex: invalidIndex,
      tradeType: TradeType.EXACT_INPUT,
      swapType: "buy",
      amount: "5",
      account: undefined,
      client,
      maxSlippage: "1",
    });

    // A split of 100 would spend the budget but sells past the depth, so the search keeps the
    // largest split that fits and sells in full; every leg still moves the whole split.
    expect(quote?.route).toBe("mintSell");
    expect(quote?.value).toBeLessThanOrEqual(units(60));
    expect(quote?.netCollateral).toBeLessThan(units(5));
    expect(quote?.completeSetLeg?.swapLegs?.every((swapLeg) => swapLeg.amount === quote?.value)).toBe(true);
  });

  it("passes when every pool absorbs its leg, at the cost of one probe per leg", async () => {
    // The probe sells 1% more than the leg, so the pool has to take a little more than the amount.
    stubAmm(book, { [outcomeAddress(1)]: { sellDepth: units(101) } });

    const quote = await fetchCompleteSetAlternativeQuote({
      market,
      targetOutcomeIndex: invalidIndex,
      tradeType: TradeType.EXACT_OUTPUT,
      swapType: "buy",
      amount: "100",
      account: undefined,
      client,
      maxSlippage: "1",
    });

    expect(quote?.route).toBe("mintSell");
    expect(quote?.netCollateral).toBe(units(5));
    expect(vi.mocked(fetchAmmQuote)).toHaveBeenCalledTimes(3 + 3);
  });

  it("refuses a market with more legs than fit one transaction", async () => {
    stubAmm(book);
    const wide = createCategoricalMarket(34);

    await expect(
      fetchCompleteSetAlternativeQuote({
        market: wide,
        targetOutcomeIndex: getInvalidOutcomeIndex(wide),
        tradeType: TradeType.EXACT_OUTPUT,
        swapType: "buy",
        amount: "1",
        account: undefined,
        client,
        maxSlippage: "1",
      }),
    ).rejects.toThrow("Too many outcomes to trade");
    expect(vi.mocked(fetchAmmQuote)).not.toHaveBeenCalled();
  });
});

describe("selling Invalid when a pool cannot supply its leg: sell what you can", () => {
  const market = createCategoricalMarket(3);
  const invalidIndex = getInvalidOutcomeIndex(market);
  const book: PriceBook = {
    [outcomeAddress(0)]: 0.5,
    [outcomeAddress(1)]: 0.3,
    [outcomeAddress(2)]: 0.15,
  };
  // 40 tokens of depth, less the 0.5% the quote keeps clear of the edge.
  const cappedAt = (units(40) * 9_950n) / 10_000n;

  beforeEach(() => {
    vi.mocked(fetchAmmQuote).mockReset();
    vi.mocked(multicall).mockReset();
  });

  it("exact input: caps the sale at the shallowest pool and says which one", async () => {
    stubAmm(book, { [outcomeAddress(1)]: { buyDepth: units(40) } });
    stubBalances(units(1000), [0n, 0n, 0n, units(100)]);

    const quote = await fetchCompleteSetAlternativeQuote({
      market,
      targetOutcomeIndex: invalidIndex,
      tradeType: TradeType.EXACT_INPUT,
      swapType: "sell",
      amount: "100",
      account: ACCOUNT,
      client,
      maxSlippage: "1",
    });

    expect(quote?.route).toBe("buyMerge");
    expect(quote?.completeSetLeg?.mergeAmount).toBe(cappedAt);
    expect(quote?.sellAmount).toBe(formatUnits(cappedAt, 18));
    expect(quote?.completeSetLeg?.swapLegs?.every((swapLeg) => swapLeg.amount === cappedAt)).toBe(true);
    // Every merged set nets 0.05 collateral.
    expect(quote?.value).toBe((cappedAt * 5n) / 100n);
    expect(quote?.partialFill).toEqual({
      filledAmount: cappedAt,
      requestedAmount: units(100),
      limitingOutcomes: [expect.objectContaining({ address: outcomeAddress(1) })],
    });
  });

  it("counts what the wallet already holds of the shallow outcome towards the cap", async () => {
    stubAmm(book, { [outcomeAddress(0)]: { buyDepth: units(40) } });
    stubBalances(units(1000), [units(30), 0n, 0n, units(100)]);

    const quote = await fetchCompleteSetAlternativeQuote({
      market,
      targetOutcomeIndex: invalidIndex,
      tradeType: TradeType.EXACT_INPUT,
      swapType: "sell",
      amount: "100",
      account: ACCOUNT,
      client,
      maxSlippage: "1",
    });

    const expected = units(30) + cappedAt;
    expect(quote?.completeSetLeg?.mergeAmount).toBe(expected);
    expect(quote?.completeSetLeg?.swapLegs?.find((swapLeg) => swapLeg.outcomeIndex === 0)?.amount).toBe(cappedAt);
    expect(quote?.partialFill?.filledAmount).toBe(expected);
  });

  it("exact output: returns the most that can be sold when the target is out of reach", async () => {
    stubAmm(book, { [outcomeAddress(2)]: { buyDepth: units(40) } });
    stubBalances(units(1000), [0n, 0n, 0n, units(1000)]);

    const quote = await fetchCompleteSetAlternativeQuote({
      market,
      targetOutcomeIndex: invalidIndex,
      tradeType: TradeType.EXACT_OUTPUT,
      swapType: "sell",
      amount: "5",
      account: ACCOUNT,
      client,
      maxSlippage: "1",
    });

    expect(quote?.value).toBe(cappedAt);
    expect(quote?.completeSetLeg?.mergeAmount).toBe(cappedAt);
    expect(quote?.partialFill).toEqual({
      filledAmount: cappedAt,
      limitingOutcomes: [expect.objectContaining({ address: outcomeAddress(2) })],
    });
    // The search quotes 5, 10, 20, 40 and 80 (five rounds of 3 legs) before the shallow pool
    // refuses; then one depth probe and one round at the cap. Every later step reuses the capped
    // quote instead of asking the pools again.
    expect(vi.mocked(fetchAmmQuote)).toHaveBeenCalledTimes(5 * 3 + 1 + 3);
  });

  it("exact output: is not partial when the cap still nets the requested collateral", async () => {
    stubAmm(book, { [outcomeAddress(2)]: { buyDepth: units(150) } });
    stubBalances(units(1000), [0n, 0n, 0n, units(1000)]);

    const quote = await fetchCompleteSetAlternativeQuote({
      market,
      targetOutcomeIndex: invalidIndex,
      tradeType: TradeType.EXACT_OUTPUT,
      swapType: "sell",
      amount: "5",
      account: ACCOUNT,
      client,
      maxSlippage: "1",
    });

    expect(quote?.partialFill).toBeUndefined();
    expect(quote?.value).toBeGreaterThanOrEqual(units(100));
    expect(quote?.value).toBeLessThan(units(100) + 1000n);
  });

  it("gives up when a pool has nothing at all", async () => {
    stubAmm(book, { [outcomeAddress(1)]: { buyDepth: 0n } });
    stubBalances(units(1000), [0n, 0n, 0n, units(100)]);

    await expect(
      fetchCompleteSetAlternativeQuote({
        market,
        targetOutcomeIndex: invalidIndex,
        tradeType: TradeType.EXACT_INPUT,
        swapType: "sell",
        amount: "100",
        account: ACCOUNT,
        client,
        maxSlippage: "1",
      }),
    ).rejects.toBeInstanceOf(CompleteSetLiquidityError);
  });

  it("asks the pools nothing extra while every leg fills", async () => {
    stubAmm(book);
    stubBalances(units(1000), [0n, 0n, 0n, units(100)]);

    await fetchCompleteSetAlternativeQuote({
      market,
      targetOutcomeIndex: invalidIndex,
      tradeType: TradeType.EXACT_INPUT,
      swapType: "sell",
      amount: "100",
      account: ACCOUNT,
      client,
      maxSlippage: "1",
    });

    expect(vi.mocked(fetchAmmQuote)).toHaveBeenCalledTimes(3);
  });

  it("lets errors that are not about liquidity through untouched", async () => {
    stubAmm(book);
    vi.mocked(fetchAmmQuote).mockRejectedValueOnce(new Error("RPC timeout"));
    stubBalances(units(1000), [0n, 0n, 0n, units(100)]);

    await expect(
      fetchCompleteSetAlternativeQuote({
        market,
        targetOutcomeIndex: invalidIndex,
        tradeType: TradeType.EXACT_INPUT,
        swapType: "sell",
        amount: "100",
        account: ACCOUNT,
        client,
        maxSlippage: "1",
      }),
    ).rejects.toThrow("RPC timeout");
  });
});
