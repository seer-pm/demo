import type { PortfolioPosition, SupportedChain } from "@seer-pm/sdk";
import { MarketTypes, getMarketStatus, getMarketType, getQuestionParts, getRedeemedPrice } from "@seer-pm/sdk/market";
import { getCollateralByIndex } from "@seer-pm/sdk/market-pools";
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

async function fetchTokenHoldings(
  supabase: SupabaseClient<Database>,
  address: Address,
  chainId: SupportedChain,
  forHistoricPnl: boolean,
) {
  if (forHistoricPnl) {
    const { data, error } = await supabase
      .from("tokens_holdings_v")
      .select("token, balance::text")
      .eq("owner", address.toLowerCase())
      .eq("chain_id", chainId)
      .order("token", { ascending: true });

    if (error) {
      throw new Error(`Error fetching positions: ${error.message}`);
    }

    const rows = data ?? [];
    const tokens = rows.map((row) => row.token as Address);
    const balances = rows.map((row) => BigInt(row.balance));
    return { tokens, balances };
  }

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
    return { tokens, balances: [] as bigint[] };
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

async function fetchErc20NamesDecimals(chainId: SupportedChain, tokens: Address[]) {
  if (tokens.length === 0) {
    return { names: [] as string[], decimals: [] as number[] };
  }

  const decimals = getTokenDecimalsList(chainId, tokens);
  const publicClient = getPublicClientByChainId(chainId);
  const names = (await multicall(publicClient, {
    contracts: tokens.map((tokenAddress) => ({
      abi: erc20Abi,
      address: tokenAddress,
      functionName: "name",
      args: [],
    })),
    allowFailure: false,
  })) as string[];

  return { names, decimals };
}

/**
 * Same positions list as `get-portfolio` — used by portfolio value / P&L endpoints.
 * - Default (`forHistoricPnl` false): tokens from `tokens_holdings_v` with balance above zero; balances via `balanceOf` on-chain.
 * - `forHistoricPnl` true (e.g. `get-portfolio-pl`): every row in `tokens_holdings_v` for the account, balances from Supabase
 *   so redeeming does not drop positions before the indexer/cron matches chain state; zero-balance rows are included for P/L rollbacks.
 */
export async function buildPortfolioPositions(
  supabase: SupabaseClient<Database>,
  address: Address,
  chainId: SupportedChain,
  forHistoricPnl = false,
): Promise<PortfolioPosition[]> {
  const { tokens: allTokensIds, balances } = await fetchTokenHoldings(supabase, address, chainId, forHistoricPnl);
  if (allTokensIds.length === 0) {
    return [];
  }

  // `searchAllMarkets` only needs token addresses; ERC20 metadata is independent. Run in parallel to save wall time.
  const [{ names: tokenNames, decimals: tokenDecimals }, { markets }] = await Promise.all([
    fetchErc20NamesDecimals(chainId, allTokensIds),
    searchAllMarkets({ chainIds: [chainId], tokens: allTokensIds }),
  ]);

  if (markets.length === 0) {
    return [];
  }

  const { marketIdToMarket, tokenToMarket } = getMarketsMappings(markets);
  const positions = balances.reduce((acumm, balance, index) => {
    if (!forHistoricPnl && balance <= 0n) {
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
      tokenName: tokenNames[index],
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
