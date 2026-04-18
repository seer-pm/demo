import type { PortfolioPosition, SupportedChain } from "@seer-pm/sdk";
import { MarketTypes, getMarketStatus, getMarketType, getQuestionParts, getRedeemedPrice } from "@seer-pm/sdk/market";
import { getCollateralByIndex } from "@seer-pm/sdk/market-pools";
import { MarketStatus } from "@seer-pm/sdk/market-types";
import type { SupabaseClient } from "@supabase/supabase-js";
import { type Address, erc20Abi, formatUnits } from "viem";
import { multicall } from "viem/actions";
import { getPublicClientByChainId } from "./config";
import { getMarketsMappings, searchMarkets } from "./markets";
import type { Database } from "./supabase";
import { getTokenDecimalsList } from "./tokenDecimals";

async function fetchTokenHoldingsFromSupabase(
  supabase: SupabaseClient<Database>,
  address: Address,
  chainId: SupportedChain,
) {
  const { data, error } = await supabase
    .from("tokens_holdings_v")
    .select("token, owner, balance")
    .eq("owner", address.toLowerCase())
    .gt("balance", 0)
    .eq("chain_id", chainId)
    .order("token", { ascending: true })
    .order("balance", { ascending: false });

  if (error) {
    throw new Error(`Error fetching positions: ${error.message}`);
  }

  const rows = data ?? [];
  const tokens = rows.map((row) => row.token as Address);
  const balances = rows.map((row) => BigInt(row.balance as number));

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

/** Same positions list as `get-portfolio` — used by portfolio value / P&L endpoints. */
export async function buildPortfolioPositions(
  supabase: SupabaseClient<Database>,
  address: Address,
  chainId: SupportedChain,
): Promise<PortfolioPosition[]> {
  const { tokens: allTokensIds, balances } = await fetchTokenHoldingsFromSupabase(supabase, address, chainId);
  if (allTokensIds.length === 0) {
    return [];
  }

  // `searchMarkets` only needs token addresses; ERC20 metadata is independent. Run in parallel to save wall time.
  const [{ names: tokenNames, decimals: tokenDecimals }, { markets }] = await Promise.all([
    fetchErc20NamesDecimals(chainId, allTokensIds),
    searchMarkets({ chainIds: [chainId], tokens: allTokensIds }),
  ]);

  if (markets.length === 0) {
    return [];
  }

  const { marketIdToMarket, tokenToMarket } = getMarketsMappings(markets);
  return balances.reduce((acumm, balance, index) => {
    if (balance > 0n) {
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
          (market.parentMarket.payoutReported &&
            market.parentMarket.payoutNumerators[Number(market.parentOutcome)] > 0n);
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
      if (tokenBalance < 0.00001) {
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
        outcomeImage: market.images?.outcomes?.[outcomeIndex],
        isInvalidOutcome,
      });
    }
    return acumm;
  }, [] as PortfolioPosition[]);
}
