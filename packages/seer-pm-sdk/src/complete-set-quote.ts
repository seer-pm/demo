/**
 * Complete-set route quotes: mint+sell (buy) and buy+merge (sell) vs direct AMM swap.
 *
 * Both routes work on the whole outcome set. Buying an outcome splits collateral into a complete
 * set and sells every other outcome the AMM can take; selling buys every other outcome and merges
 * the set back into collateral. On a binary market that is one swap. For Invalid, which has no
 * pool of its own, it is one swap per real outcome: Invalid is priced as the complement
 * (`1 - sum of the other prices`), so minting the set and selling everything else is the only way
 * to buy it, and buying everything else and merging is the only way to sell it.
 */

import type { Address, Client, PublicClient } from "viem";
import { erc20Abi, formatUnits, parseUnits, zeroAddress } from "viem";
import { multicall } from "viem/actions";
import type { AmmTrade } from "./amm-trade";
import { isCompleteSetMarket } from "./market";
import type { Market } from "./market-types";
import { isPsm3SwapToken } from "./psm3";
import type { QuoteTradeResult } from "./quote";
import { fetchAmmQuote } from "./quote";
import { isTwoStringsEqual } from "./quote-utils";
import type { MarketLike } from "./router-addresses";
import { NATIVE_TOKEN, type Token } from "./tokens";
import { TradeType } from "./trade-type";
import { getMaximumAmountIn } from "./trade-utils";
import { isTradingCredits } from "./trading-credits";

export type CompleteSetRoute = "direct" | "mintSell" | "buyMerge" | "mintToCover";

/**
 * Minimum quoted improvement (%) to prefer mint+sell / buy+merge over a direct swap.
 * Below this threshold the simpler direct route is used (extra steps are not worth it).
 */
export const MIN_COMPLETE_SET_SAVINGS_PERCENT = 0.5;

/** A token minted as a side effect of a split that the user keeps. */
export interface CompleteSetLeftover {
  token: Token;
  amount: bigint;
}

/** One AMM swap of a complete-set route: an outcome sold (mint+sell) or bought (buy+merge). */
export interface CompleteSetSwapLeg {
  outcomeIndex: number;
  outcomeToken: Token;
  trade: AmmTrade;
  /** Outcome tokens moved through the AMM by this leg. */
  amount: bigint;
}

export interface CompleteSetLeg {
  route: "mintSell" | "buyMerge" | "mintToCover";
  splitAmount?: bigint;
  mergeAmount?: bigint;
  /**
   * Token fed into the AMM leg. Defaults to `oppositeOutcomeToken` (classic mint+sell buy);
   * mintToCover sells the target outcome instead.
   */
  swapInputToken?: Token;
  /**
   * Amount fed into the AMM leg (drives both the approval and the sell size).
   * Defaults to `splitAmount`, which is the only case mint+sell needs: there the user sells
   * exactly what was just minted. mintToCover breaks that tie — it sells minted + already held.
   */
  swapInputAmount?: bigint;
  /** mintToCover only: outcome tokens the user already held (B), so N = B + splitAmount. */
  existingBalance?: bigint;
  /** mintToCover only: the rest of the complete set, which stays in the user's wallet. */
  leftoverTokens?: CompleteSetLeftover[];
  /**
   * mint+sell / buy+merge: every AMM swap of the route, one per outcome other than the target
   * (one leg on a binary market, N-1 legs when the target is Invalid). `secondaryTrade` is the
   * first of them and is kept for the parts of the pipeline that work on a single trade.
   */
  swapLegs?: CompleteSetSwapLeg[];
  /**
   * buy+merge: outcome tokens the merge burns that are taken from the wallet instead of bought —
   * the target itself is not listed. Invalid on a regular target always is (it has no pool);
   * any other outcome is when the user already held enough of it.
   */
  heldOutcomeTokens?: CompleteSetLeftover[];
  /**
   * Collateral the wallet must hold when the route starts: the whole split on mint+sell, the
   * worst-case cost of every buy on buy+merge. Most of it comes back within the same trade, so
   * it is far above the net amount the quote reports, and it is what the balance check must use.
   */
  requiredCollateral?: bigint;
  secondaryTrade: AmmTrade;
  market: MarketLike;
  collateralToken: Address;
  targetOutcomeIndex: number;
  /** Binary routes only: mint+sell and buy+merge swap the one outcome opposite the target. */
  oppositeOutcomeIndex?: number;
  targetOutcomeToken: Token;
  /** Binary routes only, for the same reason as `oppositeOutcomeIndex`. */
  oppositeOutcomeToken?: Token;
  /** Present on buy+merge: merge burns every wrapped outcome, including Invalid. */
  invalidOutcomeToken?: Token;
}

export interface CompleteSetQuoteResult extends QuoteTradeResult {
  route: CompleteSetRoute;
  netCollateral: bigint;
  completeSetLeg?: CompleteSetLeg;
  /** Present when route is mintSell or buyMerge and beats direct. Never set for mintToCover. */
  savingsPercent?: number;
}

export function getOppositeOutcomeIndex(index: 0 | 1): 0 | 1 {
  return index === 0 ? 1 : 0;
}

export function getInvalidOutcomeIndex(market: Market): number {
  return market.wrappedTokens.length - 1;
}

/**
 * Outcomes a complete-set route swaps on the AMM when targeting `targetOutcomeIndex`: every other
 * outcome, except that Invalid is skipped when the target is a regular outcome. Invalid has no
 * pool of its own, so on a mint+sell it stays in the wallet and on a buy+merge it has to be held.
 */
export function getCompleteSetSwapOutcomeIndexes(market: Market, targetOutcomeIndex: number): number[] {
  const invalidIndex = getInvalidOutcomeIndex(market);
  const isInvalidTarget = targetOutcomeIndex === invalidIndex;
  return market.wrappedTokens
    .map((_, index) => index)
    .filter((index) => index !== targetOutcomeIndex && (isInvalidTarget || index !== invalidIndex));
}

interface BuyMergeBalanceCheck {
  role: "collateralForBuy" | "targetOutcomeForMerge" | "heldOutcomeForMerge";
  token: Token;
  balance: bigint;
  required: bigint;
  sufficient: boolean;
}

function formatBalanceCheck(check: BuyMergeBalanceCheck) {
  const { token, balance, required } = check;
  const shortfall = required > balance ? required - balance : 0n;

  return {
    role: check.role,
    symbol: token.symbol,
    address: token.address,
    balance: formatUnits(balance, token.decimals),
    required: formatUnits(required, token.decimals),
    shortfall: shortfall > 0n ? formatUnits(shortfall, token.decimals) : "0",
    sufficient: check.sufficient,
  };
}

function logBuyMergeBalanceChecks(checks: BuyMergeBalanceCheck[]): boolean {
  const insufficient = checks.filter((check) => !check.sufficient);
  if (insufficient.length === 0) {
    return true;
  }

  console.log("[complete-set] buy+merge skipped: insufficient balances", {
    missing: insufficient.map(formatBalanceCheck),
    allChecks: checks.map(formatBalanceCheck),
  });

  return false;
}

/**
 * Whether the selected collateral can be split into (and merged back from) this market's full
 * outcome set. Shared by every route that mints a complete set, whatever the outcome count.
 */
export function isSplitCollateralEnabled(market: Market, collateralToken: Address): boolean {
  return getSplitCollateralDisabledReasons(market, collateralToken).length === 0;
}

/** Debug helper: why this market's collateral cannot be split into a full outcome set. */
export function getSplitCollateralDisabledReasons(market: Market, collateralToken: Address): string[] {
  const reasons: string[] = [];

  if (market.type !== "Generic") {
    reasons.push("not a Generic market: only the Generic router splits collateral into a full outcome set");
  }
  // 2 tradeable outcomes + Invalid is the smallest set worth splitting.
  if (market.wrappedTokens.length < 3) {
    reasons.push(`market has ${market.wrappedTokens.length} wrapped tokens, need at least 3`);
  }
  // Child markets: the router takes the *base* collateral as the split/merge argument (it derives
  // the position ids from it) while the user spends the parent outcome token. `market.collateralToken`
  // is the parent outcome token, so building a split or merge from it produces a wrong position id
  // and the transaction reverts. Routing them needs the two tokens threaded separately.
  if (market.parentMarket.id !== zeroAddress) {
    reasons.push("conditional market: split/merge needs the base collateral, not the parent outcome token");
  }
  if (isTradingCredits(market.chainId, collateralToken)) {
    reasons.push("Seer Credits collateral is excluded in v1");
  }
  if (isPsm3SwapToken(market.chainId, collateralToken)) {
    reasons.push("PSM3 collateral (USDC/USDS) is excluded in v1");
  }
  if (isTwoStringsEqual(collateralToken, NATIVE_TOKEN)) {
    reasons.push("native xDAI/DAI shortcut is excluded in v1");
  }
  if (!isTwoStringsEqual(collateralToken, market.collateralToken as Address)) {
    reasons.push(`selected collateral ${collateralToken} != market collateral ${market.collateralToken as Address}`);
  }

  return reasons;
}

/**
 * mint+sell and buy+merge on a regular outcome swap the one outcome opposite the target, which
 * only exists on a binary market. Targeting Invalid swaps every other outcome instead, so it works
 * on any outcome count. mint-to-cover carries no such constraint — see `isMintToCoverRoutingEnabled`.
 */
export function isCompleteSetRoutingEnabled(market: Market, outcomeIndex: number, collateralToken: Address): boolean {
  return getCompleteSetRoutingDisabledReasons(market, outcomeIndex, collateralToken).length === 0;
}

/** Debug helper: why complete-set routing is off for this market/outcome/collateral. */
export function getCompleteSetRoutingDisabledReasons(
  market: Market,
  outcomeIndex: number,
  collateralToken: Address,
): string[] {
  const reasons = getSplitCollateralDisabledReasons(market, collateralToken);

  if (market.type === "Generic" && outcomeIndex === getInvalidOutcomeIndex(market)) {
    return reasons;
  }
  if (!isCompleteSetMarket(market)) {
    reasons.push("not a binary Generic market (need exactly 3 wrapped tokens: 2 tradeable + Invalid)");
  }
  if (outcomeIndex !== 0 && outcomeIndex !== 1) {
    reasons.push(`outcome index ${outcomeIndex} is neither a tradeable outcome (0 or 1) nor Invalid`);
  }

  return reasons;
}

/**
 * Whether mint-to-cover can run for this market/outcome/collateral.
 *
 * Any outcome count works: the split mints the whole set and every token other than the one being
 * sold simply stays in the wallet, so there is no second AMM leg to constrain the shape. Invalid is
 * just another outcome here, and liquidity needs no check — the route is only built on top of a live
 * direct sell quote for the target outcome, which is proof enough that its pool exists.
 */
export function isMintToCoverRoutingEnabled(market: Market, outcomeIndex: number, collateralToken: Address): boolean {
  return getMintToCoverDisabledReasons(market, outcomeIndex, collateralToken).length === 0;
}

/** Debug helper: why mint-to-cover is off for this market/outcome/collateral. */
export function getMintToCoverDisabledReasons(
  market: Market,
  outcomeIndex: number,
  collateralToken: Address,
): string[] {
  const reasons = getSplitCollateralDisabledReasons(market, collateralToken);

  if (!Number.isInteger(outcomeIndex) || outcomeIndex < 0 || outcomeIndex >= market.wrappedTokens.length) {
    reasons.push(
      `outcome index ${outcomeIndex} is out of range (market has ${market.wrappedTokens.length} wrapped tokens)`,
    );
  }

  return reasons;
}

function formatQuoteSummary(
  label: string,
  quote: CompleteSetQuoteResult | QuoteTradeResult | undefined,
  swapType: "buy" | "sell",
  tradeType: TradeType,
): Record<string, string | undefined> {
  if (!quote) {
    return { label, status: "no quote" };
  }

  const completeSetQuote = quote as CompleteSetQuoteResult;
  return {
    label,
    route: completeSetQuote.route ?? "direct",
    value: formatUnits(quote.value, quote.decimals),
    sellAmount: quote.sellAmount,
    netCollateral:
      completeSetQuote.netCollateral !== undefined ? formatUnits(completeSetQuote.netCollateral, 18) : undefined,
    swapType,
    tradeType: tradeType === TradeType.EXACT_INPUT ? "exactIn" : "exactOut",
  };
}

function logCompleteSetRouteComparison(params: {
  swapType: "buy" | "sell";
  tradeType: TradeType;
  direct: QuoteTradeResult | undefined;
  alternative: CompleteSetQuoteResult | undefined;
  winner: CompleteSetQuoteResult | undefined;
  disabledReasons?: string[];
}) {
  const { swapType, tradeType, direct, alternative, winner, disabledReasons } = params;

  if (disabledReasons && disabledReasons.length > 0) {
    console.log("[complete-set] routing disabled", { disabledReasons });
    return;
  }

  const directResult: CompleteSetQuoteResult | undefined = direct
    ? {
        ...direct,
        route: "direct",
        netCollateral: getDirectNetCollateral(direct, swapType, tradeType),
      }
    : undefined;

  let comparisonMetric = "";
  if (swapType === "buy" && tradeType === TradeType.EXACT_INPUT) {
    comparisonMetric = "higher value (tokens out) wins";
  } else if (swapType === "buy" && tradeType === TradeType.EXACT_OUTPUT) {
    comparisonMetric = "lower netCollateral (collateral in) wins";
  } else if (swapType === "sell" && tradeType === TradeType.EXACT_INPUT) {
    comparisonMetric = "higher value (collateral out) wins";
  } else {
    comparisonMetric = "lower value (tokens in) wins";
  }

  console.log("[complete-set] route comparison", {
    comparisonMetric,
    direct: formatQuoteSummary("direct", directResult, swapType, tradeType),
    alternative: formatQuoteSummary(
      alternative?.route === "mintSell" ? "mint+sell" : alternative?.route === "buyMerge" ? "buy+merge" : "alternative",
      alternative,
      swapType,
      tradeType,
    ),
    winner: winner?.route ?? "none",
    alternativeAvailable: Boolean(alternative),
  });
}

/** Every outcome token is 18 decimals; the symbol is the outcome text the subgraph returned. */
export function getOutcomeToken(market: Market, outcomeIndex: number): Token {
  return {
    address: market.wrappedTokens[outcomeIndex],
    chainId: market.chainId,
    decimals: 18,
    symbol: market.outcomes[outcomeIndex] ?? `OUTCOME_${outcomeIndex}`,
  };
}

function getDirectNetCollateral(quote: QuoteTradeResult, swapType: "buy" | "sell", tradeType: TradeType): bigint {
  if (swapType === "buy") {
    return tradeType === TradeType.EXACT_INPUT ? parseUnits(quote.sellAmount, 18) : quote.value;
  }
  return quote.value;
}

function computeSavingsPercent(
  direct: CompleteSetQuoteResult,
  alternative: CompleteSetQuoteResult,
  swapType: "buy" | "sell",
  tradeType: TradeType,
): number {
  if (swapType === "buy" && tradeType === TradeType.EXACT_INPUT) {
    if (direct.value === 0n) return 0;
    return Number(((alternative.value - direct.value) * 10000n) / direct.value) / 100;
  }
  if (swapType === "buy" && tradeType === TradeType.EXACT_OUTPUT) {
    if (direct.netCollateral === 0n) return 0;
    return Number(((direct.netCollateral - alternative.netCollateral) * 10000n) / direct.netCollateral) / 100;
  }
  if (swapType === "sell" && tradeType === TradeType.EXACT_INPUT) {
    if (direct.value === 0n) return 0;
    return Number(((alternative.value - direct.value) * 10000n) / direct.value) / 100;
  }
  if (direct.value === 0n) return 0;
  return Number(((direct.value - alternative.value) * 10000n) / direct.value) / 100;
}

export function compareCompleteSetRoutes(
  direct: QuoteTradeResult | undefined,
  alternative: CompleteSetQuoteResult | undefined,
  swapType: "buy" | "sell",
  tradeType: TradeType,
): CompleteSetQuoteResult | undefined {
  if (!direct) {
    return alternative;
  }

  const directResult: CompleteSetQuoteResult = {
    ...direct,
    route: "direct",
    netCollateral: getDirectNetCollateral(direct, swapType, tradeType),
  };

  if (!alternative) {
    logCompleteSetRouteComparison({
      swapType,
      tradeType,
      direct,
      alternative,
      winner: directResult,
    });
    return directResult;
  }

  let alternativeWins = false;

  if (swapType === "buy") {
    if (tradeType === TradeType.EXACT_INPUT) {
      alternativeWins = alternative.value > direct.value;
    } else {
      alternativeWins = alternative.netCollateral < directResult.netCollateral;
    }
  } else if (tradeType === TradeType.EXACT_INPUT) {
    alternativeWins = alternative.value > direct.value;
  } else {
    alternativeWins = alternative.value < direct.value;
  }

  const savingsPercent = alternativeWins ? computeSavingsPercent(directResult, alternative, swapType, tradeType) : 0;
  const meetsMinimumSavings = savingsPercent >= MIN_COMPLETE_SET_SAVINGS_PERCENT;

  if (alternativeWins && !meetsMinimumSavings) {
    console.log("[complete-set] using direct swap: savings below minimum", {
      savingsPercent,
      minRequired: MIN_COMPLETE_SET_SAVINGS_PERCENT,
      alternativeRoute: alternative.route,
    });
  }

  const winner =
    alternativeWins && meetsMinimumSavings
      ? {
          ...alternative,
          savingsPercent,
        }
      : directResult;
  logCompleteSetRouteComparison({
    swapType,
    tradeType,
    direct,
    alternative,
    winner,
  });

  return winner;
}

/** Shared inputs of one multi-leg quote. Collateral and outcome tokens are all 18 decimals. */
interface CompleteSetQuoteContext {
  market: Market;
  marketLike: MarketLike;
  targetOutcomeIndex: number;
  targetOutcomeToken: Token;
  /** Outcomes swapped on the AMM, see `getCompleteSetSwapOutcomeIndexes`. */
  swapOutcomeIndexes: number[];
  /** Outcomes the merge burns that no pool can supply: Invalid when the target is a regular outcome. */
  heldOutcomeIndexes: number[];
  poolCollateral: Token;
  account: Address | undefined;
  client: PublicClient;
  maxSlippage: string;
}

function createQuoteContext(params: {
  market: Market;
  targetOutcomeIndex: number;
  account: Address | undefined;
  client: PublicClient;
  maxSlippage: string;
}): CompleteSetQuoteContext {
  const { market, targetOutcomeIndex, account, client, maxSlippage } = params;
  const swapOutcomeIndexes = getCompleteSetSwapOutcomeIndexes(market, targetOutcomeIndex);
  const heldOutcomeIndexes = market.wrappedTokens
    .map((_, index) => index)
    .filter((index) => index !== targetOutcomeIndex && !swapOutcomeIndexes.includes(index));

  return {
    market,
    marketLike: { id: market.id, type: market.type, chainId: market.chainId },
    targetOutcomeIndex,
    targetOutcomeToken: getOutcomeToken(market, targetOutcomeIndex),
    swapOutcomeIndexes,
    heldOutcomeIndexes,
    poolCollateral: {
      address: market.collateralToken as Address,
      chainId: market.chainId,
      decimals: 18,
      symbol: "",
    },
    account,
    client,
    maxSlippage,
  };
}

/** Wallet balances of the collateral and of every wrapped outcome, indexed like `wrappedTokens`. */
interface WalletBalances {
  collateral: bigint;
  outcomes: bigint[];
}

async function fetchWalletBalances(ctx: CompleteSetQuoteContext): Promise<WalletBalances | undefined> {
  const { account } = ctx;
  if (!account) {
    return undefined;
  }

  const tokens = [ctx.poolCollateral.address, ...(ctx.market.wrappedTokens as Address[])];
  const balances = await multicall(ctx.client, {
    allowFailure: false,
    contracts: tokens.map((address) => ({
      address,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [account],
    })),
  });

  const [collateral, ...outcomes] = balances.map((balance) => BigInt(balance));
  return { collateral, outcomes };
}

/** Binary legs keep the single-outcome fields so older consumers of the leg still work. */
function getBinaryLegFields(
  legs: CompleteSetSwapLeg[],
): Pick<CompleteSetLeg, "oppositeOutcomeIndex" | "oppositeOutcomeToken"> {
  if (legs.length !== 1) {
    return {};
  }
  const [leg] = legs;
  return { oppositeOutcomeIndex: leg.outcomeIndex, oppositeOutcomeToken: leg.outcomeToken };
}

interface SellLegsQuote {
  legs: CompleteSetSwapLeg[];
  /** Collateral every sell returns, added up. */
  proceeds: bigint;
}

/** Sell `amount` of every swapped outcome for collateral. The legs are quoted in parallel. */
async function quoteSellLegs(ctx: CompleteSetQuoteContext, amount: bigint): Promise<SellLegsQuote> {
  const quoted = await Promise.all(
    ctx.swapOutcomeIndexes.map(async (outcomeIndex) => {
      const outcomeToken = getOutcomeToken(ctx.market, outcomeIndex);
      const quote = await fetchAmmQuote(
        ctx.client,
        TradeType.EXACT_INPUT,
        ctx.market.chainId,
        ctx.account,
        formatUnits(amount, outcomeToken.decimals),
        outcomeToken,
        ctx.poolCollateral,
        "sell",
        ctx.maxSlippage,
      );
      return { leg: { outcomeIndex, outcomeToken, trade: quote.trade, amount }, proceeds: quote.value };
    }),
  );

  return {
    legs: quoted.map((entry) => entry.leg),
    proceeds: quoted.reduce((acc, entry) => acc + entry.proceeds, 0n),
  };
}

interface BuyLegsQuote {
  legs: CompleteSetSwapLeg[];
  /** Collateral every buy costs at the quoted price, added up. */
  buyCost: bigint;
  /** Same, at the slippage limit: what the wallet must hold for the buys to go through. */
  maxCollateralIn: bigint;
  heldOutcomeTokens: CompleteSetLeftover[];
}

/**
 * Buy what is missing of every swapped outcome to merge `mergeAmount` sets. Outcome tokens the
 * wallet already holds are used first, so a user sitting on part of the set only buys the rest.
 */
async function quoteBuyLegs(
  ctx: CompleteSetQuoteContext,
  mergeAmount: bigint,
  balances: WalletBalances | undefined,
): Promise<BuyLegsQuote> {
  const quoted = await Promise.all(
    ctx.swapOutcomeIndexes.map(async (outcomeIndex) => {
      const outcomeToken = getOutcomeToken(ctx.market, outcomeIndex);
      const balance = balances?.outcomes[outcomeIndex] ?? 0n;
      const held = balance < mergeAmount ? balance : mergeAmount;
      const buyAmount = mergeAmount - held;
      if (buyAmount === 0n) {
        return { outcomeToken, held, leg: undefined, cost: 0n, maxIn: 0n };
      }
      const quote = await fetchAmmQuote(
        ctx.client,
        TradeType.EXACT_OUTPUT,
        ctx.market.chainId,
        ctx.account,
        formatUnits(buyAmount, outcomeToken.decimals),
        outcomeToken,
        ctx.poolCollateral,
        "buy",
        ctx.maxSlippage,
      );
      return {
        outcomeToken,
        held,
        leg: { outcomeIndex, outcomeToken, trade: quote.trade, amount: buyAmount },
        cost: quote.value,
        maxIn: getMaximumAmountIn(quote.trade),
      };
    }),
  );

  const result: BuyLegsQuote = {
    legs: [],
    buyCost: 0n,
    maxCollateralIn: 0n,
    heldOutcomeTokens: ctx.heldOutcomeIndexes.map((index) => ({
      token: getOutcomeToken(ctx.market, index),
      amount: mergeAmount,
    })),
  };
  for (const entry of quoted) {
    if (entry.held > 0n) {
      result.heldOutcomeTokens.push({ token: entry.outcomeToken, amount: entry.held });
    }
    if (entry.leg) {
      result.legs.push(entry.leg);
      result.buyCost += entry.cost;
      result.maxCollateralIn += entry.maxIn;
    }
  }
  return result;
}

const MINT_SELL_EXACT_INPUT_MAX_QUOTES = 6;
/** Stop the exact-input split search once the net cost is within this much of the budget. */
const MINT_SELL_EXACT_INPUT_TOLERANCE_BPS = 5n;

/**
 * Largest split whose net cost (split minus sell proceeds) stays within `budget`.
 *
 * Splitting exactly `budget` always fits, since the sells only give collateral back, but it leaves
 * most of the budget unspent — and for Invalid nearly all of it, as the other outcomes sell for
 * almost the whole split. The user asked to spend the budget, so the split has to grow until the
 * net cost meets it. Net cost is `split * (1 - r)` with `r` the proceeds per split token, and `r`
 * only falls as the sells push the pools, so iterating `split = budget / (1 - r)` closes in from
 * both sides within a few quotes; the best fitting split seen is what gets returned.
 *
 * The wallet balance caps the split: the whole amount has to be there when the split runs, even
 * though the sells return most of it in the same trade.
 */
async function findLargestSplitWithinBudget(
  ctx: CompleteSetQuoteContext,
  budget: bigint,
  collateralBalance: bigint | undefined,
): Promise<{ splitAmount: bigint; sellQuote: SellLegsQuote }> {
  const cap = collateralBalance !== undefined && collateralBalance > 0n ? collateralBalance : undefined;
  const clamp = (amount: bigint) => (cap !== undefined && amount > cap ? cap : amount);
  const tolerance = (budget * MINT_SELL_EXACT_INPUT_TOLERANCE_BPS) / 10_000n;

  let splitAmount = clamp(budget);
  let sellQuote = await quoteSellLegs(ctx, splitAmount);
  let best = { splitAmount, sellQuote };

  for (let quotes = 1; ; quotes++) {
    const netCost = splitAmount > sellQuote.proceeds ? splitAmount - sellQuote.proceeds : 0n;
    const fits = netCost <= budget;
    if (fits && splitAmount >= best.splitAmount) {
      best = { splitAmount, sellQuote };
    }
    if ((fits && budget - netCost <= tolerance) || quotes >= MINT_SELL_EXACT_INPUT_MAX_QUOTES) {
      break;
    }
    // Proceeds at or above the split means the set sells for more than it costs to mint: no finite
    // split spends the budget, and there is nothing sensible to iterate towards.
    if (sellQuote.proceeds >= splitAmount) {
      break;
    }
    const next = clamp((budget * splitAmount) / (splitAmount - sellQuote.proceeds));
    if (next === splitAmount) {
      break;
    }
    splitAmount = next;
    sellQuote = await quoteSellLegs(ctx, splitAmount);
  }

  return best;
}

async function quoteMintSellBuy(params: {
  market: Market;
  targetOutcomeIndex: number;
  tradeType: TradeType;
  amount: string;
  account: Address | undefined;
  client: PublicClient;
  maxSlippage: string;
}): Promise<CompleteSetQuoteResult | undefined> {
  const { market, targetOutcomeIndex, tradeType, amount, account, client, maxSlippage } = params;
  const ctx = createQuoteContext({ market, targetOutcomeIndex, account, client, maxSlippage });
  if (ctx.swapOutcomeIndexes.length === 0) {
    return undefined;
  }

  // Outcome tokens (exact output) and the collateral (exact input) are both 18 decimals.
  const parsedAmount = parseUnits(amount, ctx.targetOutcomeToken.decimals);
  if (parsedAmount <= 0n) {
    return undefined;
  }

  let splitAmount: bigint;
  let sellQuote: SellLegsQuote;
  if (tradeType === TradeType.EXACT_OUTPUT) {
    splitAmount = parsedAmount;
    sellQuote = await quoteSellLegs(ctx, splitAmount);
  } else {
    const balances = await fetchWalletBalances(ctx);
    ({ splitAmount, sellQuote } = await findLargestSplitWithinBudget(ctx, parsedAmount, balances?.collateral));
  }

  const netCollateralIn = splitAmount > sellQuote.proceeds ? splitAmount - sellQuote.proceeds : 0n;
  const [firstLeg] = sellQuote.legs;

  return {
    value: splitAmount,
    decimals: ctx.targetOutcomeToken.decimals,
    buyToken: ctx.targetOutcomeToken.address,
    sellToken: ctx.poolCollateral.address,
    sellAmount: formatUnits(netCollateralIn, ctx.poolCollateral.decimals),
    swapType: "buy",
    trade: firstLeg.trade,
    route: "mintSell",
    netCollateral: netCollateralIn,
    completeSetLeg: {
      route: "mintSell",
      splitAmount,
      swapLegs: sellQuote.legs,
      requiredCollateral: splitAmount,
      secondaryTrade: firstLeg.trade,
      market: ctx.marketLike,
      collateralToken: ctx.poolCollateral.address,
      targetOutcomeIndex,
      targetOutcomeToken: ctx.targetOutcomeToken,
      ...getBinaryLegFields(sellQuote.legs),
    },
  };
}

function getBuyMergeBalanceChecks(
  ctx: CompleteSetQuoteContext,
  balances: WalletBalances,
  mergeAmount: bigint,
  maxCollateralIn: bigint,
): BuyMergeBalanceCheck[] {
  const checks: Omit<BuyMergeBalanceCheck, "sufficient">[] = [
    {
      role: "collateralForBuy",
      token: ctx.poolCollateral,
      balance: balances.collateral,
      required: maxCollateralIn,
    },
    {
      role: "targetOutcomeForMerge",
      token: ctx.targetOutcomeToken,
      balance: balances.outcomes[ctx.targetOutcomeIndex],
      required: mergeAmount,
    },
    ...ctx.heldOutcomeIndexes.map((index) => ({
      role: "heldOutcomeForMerge" as const,
      token: getOutcomeToken(ctx.market, index),
      balance: balances.outcomes[index],
      required: mergeAmount,
    })),
  ];

  return checks.map((check) => ({ ...check, sufficient: check.balance >= check.required }));
}

function buildBuyMergeResult(
  ctx: CompleteSetQuoteContext,
  params: { mergeAmount: bigint; buyQuote: BuyLegsQuote; value: bigint; sellAmount: string },
): CompleteSetQuoteResult {
  const { mergeAmount, buyQuote, value, sellAmount } = params;
  const [firstLeg] = buyQuote.legs;
  const invalidOutcomeIndex = getInvalidOutcomeIndex(ctx.market);

  return {
    value,
    decimals: ctx.poolCollateral.decimals,
    buyToken: ctx.poolCollateral.address,
    sellToken: ctx.targetOutcomeToken.address,
    sellAmount,
    swapType: "sell",
    trade: firstLeg.trade,
    route: "buyMerge",
    netCollateral: buyQuote.buyCost,
    completeSetLeg: {
      route: "buyMerge",
      mergeAmount,
      swapLegs: buyQuote.legs,
      heldOutcomeTokens: buyQuote.heldOutcomeTokens,
      requiredCollateral: buyQuote.maxCollateralIn,
      secondaryTrade: firstLeg.trade,
      market: ctx.marketLike,
      collateralToken: ctx.poolCollateral.address,
      targetOutcomeIndex: ctx.targetOutcomeIndex,
      targetOutcomeToken: ctx.targetOutcomeToken,
      ...getBinaryLegFields(buyQuote.legs),
      invalidOutcomeToken:
        ctx.targetOutcomeIndex === invalidOutcomeIndex ? undefined : getOutcomeToken(ctx.market, invalidOutcomeIndex),
    },
  };
}

/**
 * Whether the wallet can run the buys and the merge. Without an account there is nothing to
 * check. A set the wallet already holds in full is not a buy+merge at all: the Merge tab does that.
 */
function canExecuteBuyMerge(
  ctx: CompleteSetQuoteContext,
  balances: WalletBalances | undefined,
  mergeAmount: bigint,
  buyQuote: BuyLegsQuote,
): boolean {
  if (buyQuote.legs.length === 0) {
    console.log("[complete-set] buy+merge skipped: every other outcome is already held, merge instead");
    return false;
  }
  if (!balances) {
    return true;
  }
  return logBuyMergeBalanceChecks(getBuyMergeBalanceChecks(ctx, balances, mergeAmount, buyQuote.maxCollateralIn));
}

async function quoteBuyMergeSellExactInput(params: {
  market: Market;
  targetOutcomeIndex: number;
  amount: string;
  account: Address | undefined;
  client: PublicClient;
  maxSlippage: string;
}): Promise<CompleteSetQuoteResult | undefined> {
  const { market, targetOutcomeIndex, amount, account, client, maxSlippage } = params;
  const ctx = createQuoteContext({ market, targetOutcomeIndex, account, client, maxSlippage });
  if (ctx.swapOutcomeIndexes.length === 0) {
    return undefined;
  }

  const mergeAmount = parseUnits(amount, ctx.targetOutcomeToken.decimals);
  if (mergeAmount <= 0n) {
    return undefined;
  }

  const balances = await fetchWalletBalances(ctx);
  const buyQuote = await quoteBuyLegs(ctx, mergeAmount, balances);
  if (!canExecuteBuyMerge(ctx, balances, mergeAmount, buyQuote)) {
    return undefined;
  }

  const netCollateralOut = mergeAmount > buyQuote.buyCost ? mergeAmount - buyQuote.buyCost : 0n;
  return buildBuyMergeResult(ctx, { mergeAmount, buyQuote, value: netCollateralOut, sellAmount: amount });
}

const BUY_MERGE_SEARCH_MAX_EXPONENTIAL_STEPS = 32;
const BUY_MERGE_SEARCH_MAX_BINARY_STEPS = 32;

/** Minimal amount such that evaluate(amount).netOut >= desiredOut (exponential + binary search). */
export async function searchMinimalAmountForTargetNetOut<T>(params: {
  desiredOut: bigint;
  initialGuess: bigint;
  evaluate: (amount: bigint) => Promise<{ netOut: bigint; payload: T } | undefined>;
  maxExponentialSteps?: number;
  maxBinarySteps?: number;
}): Promise<{ amount: bigint; netOut: bigint; payload: T } | undefined> {
  const {
    desiredOut,
    initialGuess,
    evaluate,
    maxExponentialSteps = BUY_MERGE_SEARCH_MAX_EXPONENTIAL_STEPS,
    maxBinarySteps = BUY_MERGE_SEARCH_MAX_BINARY_STEPS,
  } = params;

  if (desiredOut <= 0n || initialGuess <= 0n) {
    return undefined;
  }

  let lowerBound = 0n;
  let upperBound = initialGuess;

  let upperEval = await evaluate(upperBound);
  if (!upperEval) {
    return undefined;
  }

  if (upperEval.netOut < desiredOut) {
    lowerBound = upperBound;
    let found = false;

    for (let step = 0; step < maxExponentialSteps; step++) {
      const nextUpper = upperBound * 2n;
      if (nextUpper <= upperBound) {
        break;
      }
      upperBound = nextUpper;

      upperEval = await evaluate(upperBound);
      if (!upperEval) {
        break;
      }
      if (upperEval.netOut >= desiredOut) {
        found = true;
        break;
      }
      lowerBound = upperBound;
    }

    if (!found || !upperEval) {
      return undefined;
    }
  }

  let bestEval = upperEval;
  let bestAmount = upperBound;

  for (let step = 0; step < maxBinarySteps && upperBound - lowerBound > 1n; step++) {
    const mid = (lowerBound + upperBound) / 2n;
    const midEval = await evaluate(mid);
    if (!midEval || midEval.netOut < desiredOut) {
      lowerBound = mid;
      continue;
    }
    upperBound = mid;
    bestEval = midEval;
    bestAmount = mid;
  }

  return { amount: bestAmount, netOut: bestEval.netOut, payload: bestEval.payload };
}

/** Minimal mergeAmount such that mergeAmount - buyCost(mergeAmount) >= desiredOut. */
async function findMinimalMergeAmountForDesiredOut(
  ctx: CompleteSetQuoteContext,
  desiredOut: bigint,
  balances: WalletBalances | undefined,
): Promise<{ mergeAmount: bigint; buyQuote: BuyLegsQuote; netCollateralOut: bigint } | undefined> {
  const searchResult = await searchMinimalAmountForTargetNetOut({
    desiredOut,
    initialGuess: desiredOut,
    evaluate: async (mergeAmount) => {
      if (mergeAmount <= 0n) {
        return undefined;
      }
      const buyQuote = await quoteBuyLegs(ctx, mergeAmount, balances);
      const netOut = mergeAmount > buyQuote.buyCost ? mergeAmount - buyQuote.buyCost : 0n;
      return { netOut, payload: buyQuote };
    },
  });

  if (!searchResult) {
    return undefined;
  }

  return {
    mergeAmount: searchResult.amount,
    buyQuote: searchResult.payload,
    netCollateralOut: searchResult.netOut,
  };
}

async function quoteBuyMergeSellExactOutput(params: {
  market: Market;
  targetOutcomeIndex: number;
  amount: string;
  account: Address | undefined;
  client: PublicClient;
  maxSlippage: string;
}): Promise<CompleteSetQuoteResult | undefined> {
  const { market, targetOutcomeIndex, amount, account, client, maxSlippage } = params;
  const ctx = createQuoteContext({ market, targetOutcomeIndex, account, client, maxSlippage });
  if (ctx.swapOutcomeIndexes.length === 0) {
    return undefined;
  }

  const desiredOut = parseUnits(amount, ctx.poolCollateral.decimals);
  if (desiredOut <= 0n) {
    return undefined;
  }

  const balances = await fetchWalletBalances(ctx);
  const searchResult = await findMinimalMergeAmountForDesiredOut(ctx, desiredOut, balances);
  if (!searchResult || searchResult.netCollateralOut < desiredOut) {
    return undefined;
  }

  const { mergeAmount, buyQuote } = searchResult;
  if (!canExecuteBuyMerge(ctx, balances, mergeAmount, buyQuote)) {
    return undefined;
  }

  return buildBuyMergeResult(ctx, {
    mergeAmount,
    buyQuote,
    value: mergeAmount,
    sellAmount: formatUnits(mergeAmount, ctx.targetOutcomeToken.decimals),
  });
}

export async function fetchCompleteSetAlternativeQuote(params: {
  market: Market;
  targetOutcomeIndex: number;
  tradeType: TradeType;
  swapType: "buy" | "sell";
  amount: string;
  account: Address | undefined;
  client?: Client;
  maxSlippage: string;
}): Promise<CompleteSetQuoteResult | undefined> {
  const { market, targetOutcomeIndex, tradeType, swapType, amount, account, client, maxSlippage } = params;

  if (!isCompleteSetRoutingEnabled(market, targetOutcomeIndex, market.collateralToken as Address)) {
    return undefined;
  }
  if (!client) {
    throw new Error("Public client is required for complete-set AMM quotes");
  }

  const quoteParams = {
    market,
    targetOutcomeIndex,
    amount,
    account,
    client: client as PublicClient,
    maxSlippage,
  };

  if (swapType === "buy") {
    return quoteMintSellBuy({ ...quoteParams, tradeType });
  }
  if (tradeType === TradeType.EXACT_INPUT) {
    return quoteBuyMergeSellExactInput(quoteParams);
  }
  return quoteBuyMergeSellExactOutput(quoteParams);
}

export async function fetchBestCompleteSetQuote(params: {
  market: Market;
  targetOutcomeIndex: number;
  tradeType: TradeType;
  swapType: "buy" | "sell";
  amount: string;
  account: Address | undefined;
  client?: Client;
  maxSlippage: string;
  directQuote: QuoteTradeResult | undefined;
  selectedCollateralToken?: Address;
}): Promise<CompleteSetQuoteResult | undefined> {
  const collateralToken = params.selectedCollateralToken ?? (params.market.collateralToken as Address);
  const disabledReasons = getCompleteSetRoutingDisabledReasons(
    params.market,
    params.targetOutcomeIndex,
    collateralToken,
  );

  if (disabledReasons.length > 0) {
    logCompleteSetRouteComparison({
      swapType: params.swapType,
      tradeType: params.tradeType,
      direct: params.directQuote,
      alternative: undefined,
      winner: params.directQuote
        ? {
            ...params.directQuote,
            route: "direct",
            netCollateral: getDirectNetCollateral(params.directQuote, params.swapType, params.tradeType),
          }
        : undefined,
      disabledReasons,
    });
    return compareCompleteSetRoutes(params.directQuote, undefined, params.swapType, params.tradeType);
  }

  const alternative = await fetchCompleteSetAlternativeQuote(params);
  return compareCompleteSetRoutes(params.directQuote, alternative, params.swapType, params.tradeType);
}
