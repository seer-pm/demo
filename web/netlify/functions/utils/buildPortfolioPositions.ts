import type { PortfolioPosition, SupportedChain } from "@seer-pm/sdk";
import { MarketTypes, getMarketStatus, getMarketType, getQuestionParts, getRedeemedPrice } from "@seer-pm/sdk/market";
import { getCollateralByIndex } from "@seer-pm/sdk/market-pools";
import type { Market } from "@seer-pm/sdk/market-types";
import { MarketStatus } from "@seer-pm/sdk/market-types";
import type { SupabaseClient } from "@supabase/supabase-js";
import { type Address, erc20Abi, formatUnits } from "viem";
import { multicall } from "viem/actions";
import { getPublicClientByChainId } from "./config";
import { getCurrentTokensPricesForPortfolio } from "./dexPoolPricesFromDb";
import { getMarketsMappings, searchAllMarkets } from "./markets";
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

/** Current holdings only: `tokens_holdings_v` with balance > 0; balances via `balanceOf` on-chain. */
export async function fetchCurrentTokenHoldings(
  supabase: SupabaseClient<Database>,
  address: Address,
  chainId: SupportedChain,
): Promise<{ tokens: Address[]; balances: bigint[] }> {
  const { data, error } = await supabase
    .from("tokens_holdings_v")
    .select("token")
    .eq("owner", address.toLowerCase())
    .gt("balance", 0)
    .eq("chain_id", chainId)
    .order("token", { ascending: true });

  if (error) {
    throw new Error(`Error fetching positions: ${error.message}`);
  }

  const rows = data ?? [];
  const tokens = rows.map((row) => row.token as Address);

  if (tokens.length === 0) {
    return { tokens, balances: [] };
  }

  const publicClient = getPublicClientByChainId(chainId);
  const balanceResults = await multicall(publicClient, {
    contracts: tokens.map((tokenAddress) => ({
      abi: erc20Abi,
      address: tokenAddress,
      functionName: "balanceOf",
      args: [address],
    })),
    allowFailure: true,
  });
  const balances = balanceResults.map((r) => (r.status === "success" ? (r.result as bigint) : 0n));

  return { tokens, balances };
}

async function fetchHistoricTokenHoldings(
  supabase: SupabaseClient<Database>,
  address: Address,
  chainId: SupportedChain,
  tokens: Address[],
): Promise<bigint[]> {
  if (tokens.length === 0) {
    return [];
  }

  const lower = tokens.map((t) => t.toLowerCase());
  const { data, error } = await supabase
    .from("tokens_holdings_v")
    .select("token, balance::text")
    .eq("owner", address.toLowerCase())
    .eq("chain_id", chainId)
    .in("token", lower);

  if (error) {
    throw new Error(`Error fetching balances from tokens_holdings_v: ${error.message}`);
  }

  const balanceByTokenLc = new Map<string, bigint>();
  for (const row of data ?? []) {
    const tok = row.token?.toLowerCase();
    if (!tok) continue;
    balanceByTokenLc.set(tok, BigInt(row.balance as string));
  }

  return tokens.map((t) => balanceByTokenLc.get(t.toLowerCase()) ?? 0n);
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

export async function buildHistoricPortfolioPositions(
  supabase: SupabaseClient<Database>,
  address: Address,
  chainId: SupportedChain,
  markets: Market[],
): Promise<PortfolioPosition[]> {
  const allTokenIds = [
    ...new Set(markets.flatMap((m) => (m.wrappedTokens ?? []).map((w) => String(w).toLowerCase()))),
  ] as Address[];
  const balances = await fetchHistoricTokenHoldings(supabase, address, chainId, allTokenIds);

  return buildPortfolioPositionsCore(supabase, chainId, allTokenIds, balances, markets, true);
}

export async function buildCurrentPortfolioPositions(
  supabase: SupabaseClient<Database>,
  address: Address,
  chainId: SupportedChain,
): Promise<PortfolioPosition[]> {
  const { tokens, balances } = await fetchCurrentTokenHoldings(supabase, address, chainId);
  if (tokens.length === 0) {
    return [];
  }

  const { markets } = await searchAllMarkets({ chainIds: [chainId], tokens });
  return buildPortfolioPositionsCore(supabase, chainId, tokens, balances, markets, false);
}
