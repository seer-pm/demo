/**
 * Complete-set route quotes: mint+sell (buy) and buy+merge (sell) vs direct AMM swap.
 */

import { type SwaprV3Trade, TradeType, type UniswapTrade } from "@swapr/sdk";
import type { Address, Client } from "viem";
import { erc20Abi, formatUnits, parseUnits } from "viem";
import { multicall } from "viem/actions";
import { gnosis } from "viem/chains";
import { isCompleteSetMarket } from "./market";
import type { Market } from "./market-types";
import { isPsm3SwapToken } from "./psm3";
import type { QuoteTradeResult } from "./quote";
import { fetchSwaprQuote, fetchUniswapQuote } from "./quote";
import { isTwoStringsEqual } from "./quote-utils";
import type { MarketLike } from "./router-addresses";
import { isSeerCredits } from "./seer-credits";
import { NATIVE_TOKEN, type Token } from "./tokens";
import { getMaximumAmountIn } from "./trade-utils";

export type CompleteSetRoute = "direct" | "mintSell" | "buyMerge";

/**
 * Minimum quoted improvement (%) to prefer mint+sell / buy+merge over a direct swap.
 * Below this threshold the simpler direct route is used (extra steps are not worth it).
 */
export const MIN_COMPLETE_SET_SAVINGS_PERCENT = 0.5;

export interface CompleteSetLeg {
  route: "mintSell" | "buyMerge";
  splitAmount?: bigint;
  mergeAmount?: bigint;
  secondaryTrade: SwaprV3Trade | UniswapTrade;
  market: MarketLike;
  collateralToken: Address;
  targetOutcomeIndex: 0 | 1;
  oppositeOutcomeIndex: 0 | 1;
  targetOutcomeToken: Token;
  oppositeOutcomeToken: Token;
  /** Present on buy+merge: merge burns every wrapped outcome, including Invalid. */
  invalidOutcomeToken?: Token;
}

export interface CompleteSetQuoteResult extends QuoteTradeResult {
  route: CompleteSetRoute;
  netCollateral: bigint;
  completeSetLeg?: CompleteSetLeg;
  /** Present when route is mintSell or buyMerge and beats direct. */
  savingsPercent?: number;
}

export function getOppositeOutcomeIndex(index: 0 | 1): 0 | 1 {
  return index === 0 ? 1 : 0;
}

export function getInvalidOutcomeIndex(market: Market): number {
  return market.wrappedTokens.length - 1;
}

interface BuyMergeBalanceCheck {
  role: "collateralForBuy" | "targetOutcomeForMerge" | "invalidOutcomeForMerge";
  token: Token;
  balance: bigint;
  required: bigint;
  sufficient: boolean;
}

async function getBuyMergeBalanceChecks(params: {
  client: Client;
  account: Address;
  collateralToken: Token;
  targetOutcomeToken: Token;
  invalidOutcomeToken: Token;
  mergeAmount: bigint;
  maxCollateralSpend: bigint;
}): Promise<BuyMergeBalanceCheck[]> {
  const { client, account, collateralToken, targetOutcomeToken, invalidOutcomeToken, mergeAmount, maxCollateralSpend } =
    params;

  const tokens = [collateralToken, targetOutcomeToken, invalidOutcomeToken];
  const balances = await multicall(client, {
    allowFailure: false,
    contracts: tokens.map((token) => ({
      address: token.address,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [account],
    })),
  });

  const [collateralBalance, targetBalance, invalidBalance] = balances.map((balance) => BigInt(balance));

  return [
    {
      role: "collateralForBuy",
      token: collateralToken,
      balance: collateralBalance,
      required: maxCollateralSpend,
      sufficient: collateralBalance >= maxCollateralSpend,
    },
    {
      role: "targetOutcomeForMerge",
      token: targetOutcomeToken,
      balance: targetBalance,
      required: mergeAmount,
      sufficient: targetBalance >= mergeAmount,
    },
    {
      role: "invalidOutcomeForMerge",
      token: invalidOutcomeToken,
      balance: invalidBalance,
      required: mergeAmount,
      sufficient: invalidBalance >= mergeAmount,
    },
  ];
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

export function isCompleteSetRoutingEnabled(market: Market, outcomeIndex: number, collateralToken: Address): boolean {
  if (!isCompleteSetMarket(market)) {
    return false;
  }
  if (outcomeIndex !== 0 && outcomeIndex !== 1) {
    return false;
  }
  if (isSeerCredits(market.chainId, collateralToken)) {
    return false;
  }
  if (isPsm3SwapToken(market.chainId, collateralToken)) {
    return false;
  }
  if (isTwoStringsEqual(collateralToken, NATIVE_TOKEN)) {
    return false;
  }
  return isTwoStringsEqual(collateralToken, market.collateralToken as Address);
}

/** Debug helper: why complete-set routing is off for this market/outcome/collateral. */
export function getCompleteSetRoutingDisabledReasons(
  market: Market,
  outcomeIndex: number,
  collateralToken: Address,
): string[] {
  const reasons: string[] = [];

  if (!isCompleteSetMarket(market)) {
    reasons.push("not a binary Generic market (need exactly 3 wrapped tokens: 2 tradeable + Invalid)");
  }
  if (outcomeIndex !== 0 && outcomeIndex !== 1) {
    reasons.push(`outcome index ${outcomeIndex} is not tradeable (only 0 or 1)`);
  }
  if (isSeerCredits(market.chainId, collateralToken)) {
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

function getOutcomeToken(market: Market, outcomeIndex: number): Token {
  return {
    address: market.wrappedTokens[outcomeIndex],
    chainId: market.chainId,
    decimals: 18,
    symbol: market.outcomes[outcomeIndex] ?? `OUTCOME_${outcomeIndex}`,
  };
}

async function fetchAmmQuote(
  tradeType: TradeType,
  chainId: number,
  account: Address | undefined,
  amount: string,
  outcomeToken: Token,
  collateralToken: Token,
  swapType: "buy" | "sell",
  maxSlippage: string,
): Promise<QuoteTradeResult> {
  if (chainId === gnosis.id) {
    return fetchSwaprQuote(tradeType, chainId, account, amount, outcomeToken, collateralToken, swapType, maxSlippage);
  }
  return fetchUniswapQuote(tradeType, chainId, account, amount, outcomeToken, collateralToken, swapType, maxSlippage);
}

function getDirectNetCollateral(quote: QuoteTradeResult, swapType: "buy" | "sell", tradeType: TradeType): bigint {
  if (swapType === "buy") {
    return tradeType === TradeType.EXACT_INPUT ? parseUnits(quote.sellAmount, 18) : quote.value;
  }
  return tradeType === TradeType.EXACT_INPUT ? quote.value : quote.value;
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

async function quoteMintSellBuy(params: {
  market: Market;
  targetOutcomeIndex: 0 | 1;
  tradeType: TradeType;
  amount: string;
  account: Address | undefined;
  maxSlippage: string;
}): Promise<CompleteSetQuoteResult | undefined> {
  const { market, targetOutcomeIndex, tradeType, amount, account, maxSlippage } = params;
  const oppositeOutcomeIndex = getOppositeOutcomeIndex(targetOutcomeIndex);
  const targetOutcomeToken = getOutcomeToken(market, targetOutcomeIndex);
  const oppositeOutcomeToken = getOutcomeToken(market, oppositeOutcomeIndex);
  const poolCollateral: Token = {
    address: market.collateralToken as Address,
    chainId: market.chainId,
    decimals: 18,
    symbol: "",
  };

  let splitAmount: bigint;
  if (tradeType === TradeType.EXACT_OUTPUT) {
    splitAmount = parseUnits(amount, targetOutcomeToken.decimals);
  } else {
    splitAmount = parseUnits(amount, poolCollateral.decimals);
  }

  if (splitAmount <= 0n) {
    return undefined;
  }

  const sellQuote = await fetchAmmQuote(
    TradeType.EXACT_INPUT,
    market.chainId,
    account,
    formatUnits(splitAmount, oppositeOutcomeToken.decimals),
    oppositeOutcomeToken,
    poolCollateral,
    "sell",
    maxSlippage,
  );

  const sellProceeds = sellQuote.value;
  const netCollateralIn = splitAmount > sellProceeds ? splitAmount - sellProceeds : 0n;
  const tokensOut = splitAmount;

  const marketLike: MarketLike = { id: market.id, type: market.type, chainId: market.chainId };

  return {
    value: tokensOut,
    decimals: targetOutcomeToken.decimals,
    buyToken: targetOutcomeToken.address,
    sellToken: poolCollateral.address,
    sellAmount: formatUnits(netCollateralIn, poolCollateral.decimals),
    swapType: "buy",
    trade: sellQuote.trade as SwaprV3Trade | UniswapTrade,
    route: "mintSell",
    netCollateral: netCollateralIn,
    completeSetLeg: {
      route: "mintSell",
      splitAmount,
      secondaryTrade: sellQuote.trade as SwaprV3Trade | UniswapTrade,
      market: marketLike,
      collateralToken: poolCollateral.address,
      targetOutcomeIndex,
      oppositeOutcomeIndex,
      targetOutcomeToken,
      oppositeOutcomeToken,
    },
  };
}

async function assertBuyMergeBalances(
  client: Client | undefined,
  account: Address | undefined,
  collateralToken: Token,
  targetOutcomeToken: Token,
  invalidOutcomeToken: Token,
  mergeAmount: bigint,
  buyTrade: SwaprV3Trade | UniswapTrade,
): Promise<boolean> {
  if (!client || !account) {
    return true;
  }

  const checks = await getBuyMergeBalanceChecks({
    client,
    account,
    collateralToken,
    targetOutcomeToken,
    invalidOutcomeToken,
    mergeAmount,
    maxCollateralSpend: getMaximumAmountIn(buyTrade),
  });

  return logBuyMergeBalanceChecks(checks);
}

async function quoteBuyMergeSellExactInput(params: {
  market: Market;
  targetOutcomeIndex: 0 | 1;
  amount: string;
  account: Address | undefined;
  client: Client | undefined;
  maxSlippage: string;
}): Promise<CompleteSetQuoteResult | undefined> {
  const { market, targetOutcomeIndex, amount, account, client, maxSlippage } = params;
  const oppositeOutcomeIndex = getOppositeOutcomeIndex(targetOutcomeIndex);
  const targetOutcomeToken = getOutcomeToken(market, targetOutcomeIndex);
  const oppositeOutcomeToken = getOutcomeToken(market, oppositeOutcomeIndex);
  const poolCollateral: Token = {
    address: market.collateralToken as Address,
    chainId: market.chainId,
    decimals: 18,
    symbol: "",
  };

  const mergeAmount = parseUnits(amount, targetOutcomeToken.decimals);
  if (mergeAmount <= 0n) {
    return undefined;
  }

  const buyQuote = await fetchAmmQuote(
    TradeType.EXACT_OUTPUT,
    market.chainId,
    account,
    formatUnits(mergeAmount, oppositeOutcomeToken.decimals),
    oppositeOutcomeToken,
    poolCollateral,
    "buy",
    maxSlippage,
  );

  const buyTrade = buyQuote.trade as SwaprV3Trade | UniswapTrade;
  const invalidOutcomeToken = getOutcomeToken(market, getInvalidOutcomeIndex(market));
  const hasBalances = await assertBuyMergeBalances(
    client,
    account,
    poolCollateral,
    targetOutcomeToken,
    invalidOutcomeToken,
    mergeAmount,
    buyTrade,
  );
  if (!hasBalances) {
    return undefined;
  }

  const buyCost = buyQuote.value;
  const netCollateralOut = mergeAmount > buyCost ? mergeAmount - buyCost : 0n;
  const marketLike: MarketLike = { id: market.id, type: market.type, chainId: market.chainId };

  return {
    value: netCollateralOut,
    decimals: poolCollateral.decimals,
    buyToken: poolCollateral.address,
    sellToken: targetOutcomeToken.address,
    sellAmount: amount,
    swapType: "sell",
    trade: buyTrade,
    route: "buyMerge",
    netCollateral: buyCost,
    completeSetLeg: {
      route: "buyMerge",
      mergeAmount,
      secondaryTrade: buyTrade,
      market: marketLike,
      collateralToken: poolCollateral.address,
      targetOutcomeIndex,
      oppositeOutcomeIndex,
      targetOutcomeToken,
      oppositeOutcomeToken,
      invalidOutcomeToken,
    },
  };
}

async function quoteBuyMergeSellExactOutput(params: {
  market: Market;
  targetOutcomeIndex: 0 | 1;
  amount: string;
  account: Address | undefined;
  client: Client | undefined;
  maxSlippage: string;
}): Promise<CompleteSetQuoteResult | undefined> {
  const { market, targetOutcomeIndex, amount, account, client, maxSlippage } = params;
  const oppositeOutcomeIndex = getOppositeOutcomeIndex(targetOutcomeIndex);
  const targetOutcomeToken = getOutcomeToken(market, targetOutcomeIndex);
  const oppositeOutcomeToken = getOutcomeToken(market, oppositeOutcomeIndex);
  const poolCollateral: Token = {
    address: market.collateralToken as Address,
    chainId: market.chainId,
    decimals: 18,
    symbol: "",
  };

  const desiredOut = parseUnits(amount, poolCollateral.decimals);
  if (desiredOut <= 0n) {
    return undefined;
  }

  let mergeAmount = desiredOut;
  let buyQuote: QuoteTradeResult | undefined;
  let netCollateralOut = 0n;

  for (let attempt = 0; attempt < 8; attempt++) {
    buyQuote = await fetchAmmQuote(
      TradeType.EXACT_OUTPUT,
      market.chainId,
      account,
      formatUnits(mergeAmount, oppositeOutcomeToken.decimals),
      oppositeOutcomeToken,
      poolCollateral,
      "buy",
      maxSlippage,
    );
    const buyCost = buyQuote.value;
    netCollateralOut = mergeAmount > buyCost ? mergeAmount - buyCost : 0n;
    if (netCollateralOut >= desiredOut) {
      break;
    }
    mergeAmount = (mergeAmount * 11n) / 10n + 1n;
  }

  if (!buyQuote || netCollateralOut < desiredOut) {
    return undefined;
  }

  const buyTrade = buyQuote.trade as SwaprV3Trade | UniswapTrade;
  const invalidOutcomeToken = getOutcomeToken(market, getInvalidOutcomeIndex(market));
  const hasBalances = await assertBuyMergeBalances(
    client,
    account,
    poolCollateral,
    targetOutcomeToken,
    invalidOutcomeToken,
    mergeAmount,
    buyTrade,
  );
  if (!hasBalances) {
    return undefined;
  }

  const marketLike: MarketLike = { id: market.id, type: market.type, chainId: market.chainId };

  return {
    value: mergeAmount,
    decimals: targetOutcomeToken.decimals,
    buyToken: poolCollateral.address,
    sellToken: targetOutcomeToken.address,
    sellAmount: formatUnits(mergeAmount, targetOutcomeToken.decimals),
    swapType: "sell",
    trade: buyTrade,
    route: "buyMerge",
    netCollateral: buyQuote.value,
    completeSetLeg: {
      route: "buyMerge",
      mergeAmount,
      secondaryTrade: buyTrade,
      market: marketLike,
      collateralToken: poolCollateral.address,
      targetOutcomeIndex,
      oppositeOutcomeIndex,
      targetOutcomeToken,
      oppositeOutcomeToken,
      invalidOutcomeToken,
    },
  };
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

  const index = targetOutcomeIndex as 0 | 1;

  if (swapType === "buy") {
    return quoteMintSellBuy({
      market,
      targetOutcomeIndex: index,
      tradeType,
      amount,
      account,
      maxSlippage,
    });
  }

  if (tradeType === TradeType.EXACT_INPUT) {
    return quoteBuyMergeSellExactInput({
      market,
      targetOutcomeIndex: index,
      amount,
      account,
      client,
      maxSlippage,
    });
  }

  return quoteBuyMergeSellExactOutput({
    market,
    targetOutcomeIndex: index,
    amount,
    account,
    client,
    maxSlippage,
  });
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
