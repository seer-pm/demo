import type { PortfolioPosition, SupportedChain } from "@seer-pm/sdk";
import {
  MarketTypes,
  getMarketStatus,
  getMarketType,
  getQuestionParts,
  getRedeemedPrice,
  isParentBranchLost,
} from "@seer-pm/sdk/market";
import { getCollateralByIndex } from "@seer-pm/sdk/market-pools";
import type { Market } from "@seer-pm/sdk/market-types";
import { MarketStatus } from "@seer-pm/sdk/market-types";
import { type Address, formatUnits } from "viem";
import { outcomePriceTokensForChain } from "./marketMtmRefresh";
import { loadMarketsWithAncestors, marketsWithLocalAncestors, pricedMarketsRootFirst } from "./marketParentChain";
import { getMarketsMappings, searchAllMarkets } from "./markets";
import { getCurrentOutcomePrices } from "./onchainOutcomePrices";
import { type OutcomePriceToken, settledPayoutRatios } from "./outcomePrices";
import { fetchTokenBalances } from "./seerIndexerPortfolio";
import { getTokenDecimalsList } from "./tokenDecimals";

/** Zero-balance rows are worth nothing whatever the price, so they never need a pool read. */
function pricedPositions(positions: PortfolioPosition[]): PortfolioPosition[] {
  return positions.filter((position) => position.tokenBalance > 0);
}

function enrichPositionsWithTokenValues(
  positions: PortfolioPosition[],
  tokenIdToCurrentPrice: Record<string, number>,
): PortfolioPosition[] {
  return positions.map((position) => {
    // No `redeemedPrice ||` fallback: settled payouts are already folded into the price map, and
    // the `||` would read a settled 0 as "unknown" and resurrect a worthless position at its stale
    // pool mid. `redeemedPrice` stays on the row for the UI's "Redeem price" tooltip.
    const tokenPrice = tokenIdToCurrentPrice[position.tokenId.toLowerCase()] ?? 0;
    const tokenValue = tokenPrice * position.tokenBalance;
    return {
      ...position,
      tokenPrice,
      tokenValue,
    };
  });
}

/**
 * Pricing inputs for `positions`: their markets and every ancestor, as a root-first token list.
 *
 * A conditional outcome only ever trades against its parent's outcome token, so the parent's tokens
 * must be in the same batch and must come first — the contract `outcomePriceTokensForChain` and
 * `mapOutcomePrices` document. Markets resolved from a wallet's holdings never satisfy it on their
 * own: splitting consumed the wallet's parent tokens, so the parent market is not in the list, and
 * `mapOutcomePrices` would then store the price *relative to the parent outcome* as if it were an
 * absolute collateral price. That is how a dead conditional was worth $0.83.
 *
 * Exported because the historical side has to be given the **same** batch: current and reference
 * prices that disagree about what a conditional is quoted against do not cancel, they produce a
 * delta out of nothing. `pool` is whatever markets the caller already holds; only the rest is
 * queried, so a caller valuing several wallets against one market list pays for it once.
 *
 * Positions are taken as given — filter by balance first if that is what you want priced. The
 * historical path deliberately does not: a token at zero today can have been held at the reference.
 */
export async function outcomePriceInputsForPositions(
  positions: PortfolioPosition[],
  chainId: SupportedChain,
  pool: Market[] = [],
): Promise<{ tokens: OutcomePriceToken[]; markets: Market[] }> {
  if (positions.length === 0) {
    return { tokens: [], markets: [] };
  }

  const known = new Set(pool.map((market) => market.id.toLowerCase()));
  const missing = [
    ...new Set(positions.map((position) => position.marketId.toLowerCase()).filter((id) => !known.has(id))),
  ];
  const seed = marketsWithLocalAncestors(
    positions.map((position) => position.marketId),
    pool,
  );
  if (missing.length > 0) {
    const { markets } = await searchAllMarkets({ chainIds: [chainId], marketIds: missing });
    seed.push(...markets);
  }

  const markets = await loadMarketsWithAncestors(seed, chainId);
  return { tokens: outcomePriceTokensForChain(pricedMarketsRootFirst(markets)), markets };
}

/** Current price per held token, chained through each market's parents. */
async function currentPricesForPositions(
  positions: PortfolioPosition[],
  chainId: SupportedChain,
  pricingPool: Market[],
): Promise<Record<string, number>> {
  const priced = pricedPositions(positions);
  if (priced.length === 0) {
    return {};
  }

  const { tokens, markets } = await outcomePriceInputsForPositions(priced, chainId, pricingPool);
  return getCurrentOutcomePrices(tokens, chainId, settledPayoutRatios(markets));
}

/**
 * Builds portfolio positions from pre-resolved tokens, balances, and markets (caller loads markets).
 */
export async function buildPortfolioPositionsCore(
  chainId: SupportedChain,
  allTokensIds: Address[],
  balances: bigint[],
  markets: Market[],
  includeZeroBalances: boolean,
  pricingPool: Market[] = markets,
): Promise<PortfolioPosition[]> {
  if (allTokensIds.length === 0 || markets.length === 0) {
    return [];
  }

  if (allTokensIds.length !== balances.length) {
    throw new Error("buildPortfolioPositionsCore: tokens and balances length mismatch");
  }

  const tokenDecimals = getTokenDecimalsList(chainId, allTokensIds);

  const { tokenToMarket } = getMarketsMappings(markets);

  // The parent chain of every market these tokens belong to, resolved once. `markets` cannot supply
  // it: that list comes from the wallet's own tokens, and splitting consumed the parent tokens it
  // would have needed to include the parent. Both the prices below and the "conditional on X" label
  // on each row depend on having it.
  const heldMarkets = [
    ...new Map(
      allTokensIds
        .map((token) => tokenToMarket[token]?.market)
        .filter(Boolean)
        .map((market) => [market.id, market]),
    ).values(),
  ];
  const chainMarkets = await loadMarketsWithAncestors(
    marketsWithLocalAncestors(
      heldMarkets.map((market) => market.id),
      [...heldMarkets, ...pricingPool],
    ),
    chainId,
  );
  const { marketIdToMarket } = getMarketsMappings(chainMarkets);

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

    // Checked before the market's own status, because it does not depend on it: once the parent has
    // settled on another branch these tokens can never pay out, whether this market is closed, open
    // or still waiting for an answer. Gating it on CLOSED — as this used to — left a wallet holding
    // an open conditional of a long-decided parent carrying its full pool value.
    if (isParentBranchLost(market)) {
      return acumm;
    }

    if (marketStatus === MarketStatus.CLOSED && !(market.payoutReported && market.payoutNumerators[tokenIndex] > 0n)) {
      return acumm;
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

  const currentPrices = await currentPricesForPositions(positions, chainId, chainMarkets);
  return enrichPositionsWithTokenValues(positions, currentPrices);
}

/**
 * Re-price cached positions (DEX prices change even when balances do not).
 *
 * Reloads the markets behind the cached rows rather than pricing the rows alone: a cached
 * `PortfolioPosition` carries no payout data, so without them a conditional cannot be chained to
 * its parent and a branch that died since the blob was written would keep being served at its old
 * price for the rest of the TTL. One query per chain buys a cache hit that self-corrects.
 */
export async function repricePortfolioPositions(positions: PortfolioPosition[]): Promise<PortfolioPosition[]> {
  if (positions.length === 0) return positions;

  const byChain = new Map<SupportedChain, PortfolioPosition[]>();
  for (const position of positions) {
    const list = byChain.get(position.chainId) ?? [];
    list.push(position);
    byChain.set(position.chainId, list);
  }

  const priced = await Promise.all(
    [...byChain.entries()].map(async ([chainId, subset]) => {
      const marketIds = [...new Set(subset.map((position) => position.marketId.toLowerCase()))];
      const { markets } = await searchAllMarkets({ chainIds: [chainId], marketIds });
      const deadMarketIds = new Set(markets.filter(isParentBranchLost).map((market) => market.id.toLowerCase()));
      const live = subset.filter((position) => !deadMarketIds.has(position.marketId.toLowerCase()));

      const prices = await currentPricesForPositions(live, chainId, markets);
      return enrichPositionsWithTokenValues(live, prices);
    }),
  );
  return priced.flat();
}

/**
 * Positions from indexer balances: intersection of market wrappedTokens with `relevantTokens` ∪ holdings keys.
 */
export async function buildPortfolioPositionsFromBalances(
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

  return buildPortfolioPositionsCore(chainId, allTokenIds, balances, markets, true);
}

/**
 * Current portfolio UI for a whole wallet set — the account and the TradeExecutors it owns.
 *
 * One row per `(token, wallet)`, never summed per token. The rows carry `sourceWallet` so the UI can
 * say which holdings sit in an executor and are therefore not redeemable from the EOA, and value is
 * linear in balance, so leaving them separate sums to exactly the same total.
 *
 * `searchAllMarkets` runs once over the union of the wallets' tokens rather than once per wallet: it
 * is the expensive half of this function, and the wallets of one owner overlap heavily by nature.
 */
export async function buildCurrentPortfolioPositionsForWallets(
  wallets: Address[],
  chainId: SupportedChain,
  collateralProfile: string,
): Promise<PortfolioPosition[]> {
  const holdingsPerWallet = await Promise.all(
    wallets.map(async (wallet) => ({ wallet, holdings: await fetchTokenBalances(wallet, chainId) })),
  );
  const perWallet = holdingsPerWallet.map(({ wallet, holdings }) => ({
    wallet,
    tokens: [...holdings.entries()].filter(([, balance]) => balance > 0n).map(([token]) => token as Address),
    holdings,
  }));

  const tokens = [...new Set(perWallet.flatMap((entry) => entry.tokens))];
  if (tokens.length === 0) {
    return [];
  }

  const { markets } = await searchAllMarkets({ chainIds: [chainId], tokens, collateralProfile });
  // Expanded once for the whole wallet set: the per-wallet calls below then resolve every parent
  // chain locally instead of each issuing its own ancestor query.
  const pricingPool = await loadMarketsWithAncestors(markets, chainId, collateralProfile);

  const positionsPerWallet = await Promise.all(
    perWallet.map(async ({ wallet, tokens: walletTokens, holdings }) => {
      if (walletTokens.length === 0) return [];
      const balances = walletTokens.map((token) => holdings.get(token.toLowerCase()) ?? 0n);
      const positions = await buildPortfolioPositionsCore(chainId, walletTokens, balances, markets, false, pricingPool);
      return positions.map((position) => ({ ...position, sourceWallet: wallet }));
    }),
  );
  return positionsPerWallet.flat();
}

/** Current portfolio UI: TokenBalance rows with balance > 0 from HyperIndex. */
export async function buildCurrentPortfolioPositions(
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
  return buildPortfolioPositionsCore(chainId, tokens, balances, markets, false);
}
