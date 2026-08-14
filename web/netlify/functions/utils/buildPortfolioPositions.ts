import type { PortfolioPosition, SupportedChain } from "@seer-pm/sdk";
import { MarketTypes, getMarketStatus, getMarketType, getQuestionParts, getRedeemedPrice } from "@seer-pm/sdk/market";
import { getCollateralByIndex } from "@seer-pm/sdk/market-pools";
import type { Market } from "@seer-pm/sdk/market-types";
import { MarketStatus } from "@seer-pm/sdk/market-types";
import type { SupabaseClient } from "@supabase/supabase-js";
import { type Address, formatUnits } from "viem";
import { getCurrentTokensPricesForPortfolio } from "./dexPoolPricesFromDb";
import { getMarketsMappings, searchAllMarkets } from "./markets";
import { fetchTokenBalances } from "./seerIndexerPortfolio";
import type { Database } from "./supabase";
import { getTokenDecimalsList } from "./tokenDecimals";

function enrichPositionsWithTokenValues(
  positions: PortfolioPosition[],
  tokenIdToCurrentPrice: Record<string, number | undefined>,
): PortfolioPosition[] {
  return positions.map((position) => {
    let tokenPrice = tokenIdToCurrentPrice[position.tokenId.toLowerCase()] ?? 0;
    tokenPrice = position.redeemedPrice || tokenPrice;
    const tokenValue = tokenPrice * position.tokenBalance;
    return {
      ...position,
      tokenPrice,
      tokenValue,
    };
  });
}

/**
 * Builds portfolio positions from pre-resolved tokens, balances, and markets (caller loads markets).
 */
export async function buildPortfolioPositionsCore(
  supabase: SupabaseClient<Database>,
  chainId: SupportedChain,
  allTokensIds: Address[],
  balances: bigint[],
  markets: Market[],
  includeZeroBalances: boolean,
): Promise<PortfolioPosition[]> {
  if (allTokensIds.length === 0 || markets.length === 0) {
    return [];
  }

  if (allTokensIds.length !== balances.length) {
    throw new Error("buildPortfolioPositionsCore: tokens and balances length mismatch");
  }

  const tokenDecimals = getTokenDecimalsList(chainId, allTokensIds);

  const { marketIdToMarket, tokenToMarket } = getMarketsMappings(markets);
  const positions = balances.reduce((acumm, balance, index) => {
    if (!includeZeroBalances && balance <= 0n) {
      return acumm;
    }

    if (!tokenToMarket[allTokensIds[index]]) {
      console.log("Missing market for token", allTokensIds[index]);
      return acumm;
    }

    const { market, tokenIndex } = tokenToMarket[allTokensIds[index]];
    const parentMarket = marketIdToMarket[market.parentMarket.id];
    const outcomeIndex = market.wrappedTokens.indexOf(allTokensIds[index]);
    const isInvalidOutcome = market.type === "Generic" && outcomeIndex === market.wrappedTokens.length - 1;
    const marketType = getMarketType(market);
    const marketStatus = getMarketStatus(market);

    if (marketStatus === MarketStatus.CLOSED) {
      const isWinningPayout = market.payoutReported && market.payoutNumerators[tokenIndex] > 0n;
      const isParentPayoutPendingOrWinning =
        !market.parentMarket.payoutReported ||
        (market.parentMarket.payoutReported && market.parentMarket.payoutNumerators[Number(market.parentOutcome)] > 0n);
      if (!isWinningPayout || !isParentPayoutPendingOrWinning) {
        return acumm;
      }
    }

    const parts = getQuestionParts(market.marketName, marketType);
    const marketName =
      marketType === MarketTypes.MULTI_SCALAR && parts
        ? `${parts?.questionStart} ${market.outcomes[outcomeIndex]} ${parts?.questionEnd}`.trim()
        : market.marketName;
    const tokenBalance = Number(formatUnits(balance, Number(tokenDecimals[index])));
    if (balance > 0n && tokenBalance < 0.00001) {
      return acumm;
    }
    acumm.push({
      marketId: market.id,
      tokenIndex,
      tokenId: allTokensIds[index],
      tokenBalance,
      rawBalance: balance.toString(),
      marketName,
      marketStatus,
      marketFinalizeTs: market.finalizeTs,
      outcome: market.outcomes[outcomeIndex],
      chainId,
      collateralToken: getCollateralByIndex(market, tokenIndex),
      parentMarketName: parentMarket?.marketName,
      parentMarketId: parentMarket?.id,
      parentOutcome: parentMarket ? parentMarket.outcomes[Number(market.parentOutcome)] : undefined,
      redeemedPrice: getRedeemedPrice(market, tokenIndex),
      tokenPrice: 0,
      tokenValue: 0,
      outcomeImage: market.images?.outcomes?.[outcomeIndex],
      isInvalidOutcome,
    });
    return acumm;
  }, [] as PortfolioPosition[]);

  const currentPrices = await getCurrentTokensPricesForPortfolio(supabase, positions, chainId);
  return enrichPositionsWithTokenValues(positions, currentPrices);
}

/** Re-price cached positions (DEX prices change even when balances do not). */
export async function repricePortfolioPositions(
  supabase: SupabaseClient<Database>,
  positions: PortfolioPosition[],
): Promise<PortfolioPosition[]> {
  if (positions.length === 0) return positions;

  const byChain = new Map<SupportedChain, PortfolioPosition[]>();
  for (const position of positions) {
    const list = byChain.get(position.chainId) ?? [];
    list.push(position);
    byChain.set(position.chainId, list);
  }

  const priced = await Promise.all(
    [...byChain.entries()].map(async ([chainId, subset]) => {
      const prices = await getCurrentTokensPricesForPortfolio(supabase, subset, chainId);
      return enrichPositionsWithTokenValues(subset, prices);
    }),
  );
  return priced.flat();
}

/**
 * Positions from indexer balances: intersection of market wrappedTokens with `relevantTokens` ∪ holdings keys.
 */
export async function buildPortfolioPositionsFromBalances(
  supabase: SupabaseClient<Database>,
  chainId: SupportedChain,
  markets: Market[],
  relevantTokens: Address[],
  holdings: Map<string, bigint>,
): Promise<PortfolioPosition[]> {
  const relevant = new Set<string>([...relevantTokens.map((t) => t.toLowerCase()), ...holdings.keys()]);
  const allTokenIds = [
    ...new Set(
      markets
        .flatMap((m) => (m.wrappedTokens ?? []).map((w) => String(w).toLowerCase()))
        .filter((t) => relevant.has(t)),
    ),
  ] as Address[];
  const balances = allTokenIds.map((t) => holdings.get(t.toLowerCase()) ?? 0n);

  return buildPortfolioPositionsCore(supabase, chainId, allTokenIds, balances, markets, true);
}

/** Current portfolio UI: TokenBalance rows with balance > 0 from HyperIndex. */
export async function buildCurrentPortfolioPositions(
  supabase: SupabaseClient<Database>,
  address: Address,
  chainId: SupportedChain,
  collateralProfile: string,
): Promise<PortfolioPosition[]> {
  const holdings = await fetchTokenBalances(address, chainId);
  const tokens = [...holdings.entries()].filter(([, bal]) => bal > 0n).map(([t]) => t as Address);
  if (tokens.length === 0) {
    return [];
  }
  const balances = tokens.map((t) => holdings.get(t.toLowerCase()) ?? 0n);

  const { markets } = await searchAllMarkets({ chainIds: [chainId], tokens, collateralProfile });
  return buildPortfolioPositionsCore(supabase, chainId, tokens, balances, markets, false);
}
