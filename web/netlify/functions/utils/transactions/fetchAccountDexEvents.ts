import type { MarketDataMapping, SupportedChain, TransactionData } from "@seer-pm/sdk";
import { getTokensPairKey } from "@seer-pm/sdk/market-pools";
import type { GetAccountDexEventsQuery } from "@seer-pm/sdk/subgraph/swapr";
import { OrderDirection } from "@seer-pm/sdk/subgraph/swapr";
import { type Address, parseUnits } from "viem";
import { getDexSubgraphSdk } from "../goldskyClient";
import { getCollateralFromDexTx } from "../markets";
import { getCowswapSwapsCached } from "./cowswapSwaps";
import {
  type TimestampIdCursor,
  type TimestampIdPageItem,
  buildTimestampIdPageWhere,
} from "./subgraphTimestampIdPagination";

const DEFAULT_PAGE_SIZE = 1000;
const DEFAULT_MAX_PAGES = 20;
/** Chunk token `in` filters — large market sets exceed practical GraphQL variable size. */
const TOKEN_IN_CHUNK = 100;
/** Filter that matches no rows — used when a paginated stream is exhausted. */
const EXHAUSTED_STREAM_WHERE = { id: "" };

type AccountDexEvents = {
  swaps: TransactionData[];
  mints: TransactionData[];
  burns: TransactionData[];
};

function mappingTokenIds(mappings: MarketDataMapping): string[] {
  return [...mappings.allTokensIds];
}

/** Intersect mapping tokens with tokens the wallet has actually held (TokenBalance keys). */
function dexTokenIdsForWallet(mappingTokenIds: Iterable<string>, walletTokenIds: Iterable<string>): string[] {
  const wallet = new Set([...walletTokenIds].map((id) => id.toLowerCase()));
  return [...mappingTokenIds].filter((id) => wallet.has(id.toLowerCase()));
}

function chunkIds(ids: string[], size: number): string[][] {
  const out: string[][] = [];
  for (let i = 0; i < ids.length; i += size) {
    out.push(ids.slice(i, i + size));
  }
  return out;
}

function assertAccountDexEventsPayload(
  data: GetAccountDexEventsQuery | null | undefined,
): asserts data is GetAccountDexEventsQuery {
  if (!data || !Array.isArray(data.swaps) || !Array.isArray(data.mints) || !Array.isArray(data.burns)) {
    throw new Error("DEX subgraph GetAccountDexEvents missing swaps, mints, or burns in response");
  }
}

type RawSwap = GetAccountDexEventsQuery["swaps"][number];
type RawMint = GetAccountDexEventsQuery["mints"][number];
type RawBurn = GetAccountDexEventsQuery["burns"][number];

function mapSwapToTransaction(
  swap: RawSwap,
  tokenPairToMarketMapping: MarketDataMapping["tokenPairToMarketMapping"],
): TransactionData | null {
  const amount0 = parseUnits(swap.amount0.replace("-", ""), Number(swap.token0.decimals));
  const amount1 = parseUnits(swap.amount1.replace("-", ""), Number(swap.token1.decimals));
  const tokenIn = Number(swap.amount1) < 0 ? swap.token0.id : swap.token1.id;
  const tokenOut = Number(swap.amount1) < 0 ? swap.token1.id : swap.token0.id;
  const market = tokenPairToMarketMapping[getTokensPairKey(tokenIn, tokenOut)];
  if (!market) return null;

  return {
    eventId: swap.id,
    tokenIn,
    tokenOut,
    amountIn: tokenIn.toLocaleLowerCase() > tokenOut.toLocaleLowerCase() ? amount1.toString() : amount0.toString(),
    amountOut: tokenIn.toLocaleLowerCase() > tokenOut.toLocaleLowerCase() ? amount0.toString() : amount1.toString(),
    tokenInSymbol: tokenIn.toLocaleLowerCase() > tokenOut.toLocaleLowerCase() ? swap.token1.symbol : swap.token0.symbol,
    tokenOutSymbol:
      tokenIn.toLocaleLowerCase() > tokenOut.toLocaleLowerCase() ? swap.token0.symbol : swap.token1.symbol,
    blockNumber: Number(swap.transaction.blockNumber),
    timestamp: Number(swap.timestamp),
    marketName: market.marketName,
    marketId: market.id,
    type: "swap",
    collateral: getCollateralFromDexTx(market, tokenIn as Address, tokenOut as Address),
    transactionHash: swap.transaction.id,
  };
}

function mapMintToTransaction(
  mint: RawMint,
  tokenPairToMarketMapping: MarketDataMapping["tokenPairToMarketMapping"],
): TransactionData | null {
  const amount0 = parseUnits(mint.amount0.replace("-", ""), Number(mint.token0.decimals));
  const amount1 = parseUnits(mint.amount1.replace("-", ""), Number(mint.token1.decimals));
  const market = tokenPairToMarketMapping[getTokensPairKey(mint.token0.id, mint.token1.id)];
  if (!market) return null;

  return {
    eventId: mint.id,
    token0: mint.token0.id,
    token1: mint.token1.id,
    amount0: amount0.toString(),
    amount1: amount1.toString(),
    token0Symbol: mint.token0.symbol,
    token1Symbol: mint.token1.symbol,
    blockNumber: Number(mint.transaction.blockNumber),
    timestamp: Number(mint.timestamp),
    marketName: market.marketName,
    marketId: market.id,
    type: "lp",
    collateral: getCollateralFromDexTx(market, mint.token0.id as Address, mint.token1.id as Address),
    transactionHash: mint.transaction.id,
  };
}

function mapBurnToTransaction(
  burn: RawBurn,
  tokenPairToMarketMapping: MarketDataMapping["tokenPairToMarketMapping"],
): TransactionData | null {
  const amount0 = parseUnits(burn.amount0.replace("-", ""), Number(burn.token0.decimals));
  const amount1 = parseUnits(burn.amount1.replace("-", ""), Number(burn.token1.decimals));
  const market = tokenPairToMarketMapping[getTokensPairKey(burn.token0.id, burn.token1.id)];
  if (!market) return null;

  return {
    eventId: burn.id,
    token0: burn.token0.id,
    token1: burn.token1.id,
    amount0: amount0.toString(),
    amount1: amount1.toString(),
    token0Symbol: burn.token0.symbol,
    token1Symbol: burn.token1.symbol,
    blockNumber: Number(burn.transaction.blockNumber),
    timestamp: Number(burn.timestamp),
    marketName: market.marketName,
    marketId: market.id,
    type: "lp-burn",
    collateral: getCollateralFromDexTx(market, burn.token0.id as Address, burn.token1.id as Address),
    transactionHash: burn.transaction.id,
  };
}

function appendUnique<T extends TimestampIdPageItem>(
  page: T[],
  seen: Set<string>,
  out: T[],
  pageSize: number,
): TimestampIdCursor | "done" {
  for (const item of page) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    out.push(item);
  }
  if (page.length === 0 || page.length < pageSize) return "done";
  const last = page[page.length - 1];
  return { timestamp: last.timestamp, id: last.id };
}

async function paginateCombinedTokenChunk(args: {
  chainId: SupportedChain;
  accountLc: Address;
  tokenIds: string[];
  startTime?: number;
  endTime?: number;
  pageSize: number;
  maxPages: number;
}): Promise<{ swaps: RawSwap[]; mints: RawMint[]; burns: RawBurn[] }> {
  const sdk = getDexSubgraphSdk(args.chainId);
  const endInclusive = args.endTime?.toString();

  const swapSeen = new Set<string>();
  const mintSeen = new Set<string>();
  const burnSeen = new Set<string>();
  const swaps: RawSwap[] = [];
  const mints: RawMint[] = [];
  const burns: RawBurn[] = [];

  let swapCursor: TimestampIdCursor | undefined;
  let mintCursor: TimestampIdCursor | undefined;
  let burnCursor: TimestampIdCursor | undefined;
  let swapDone = false;
  let mintDone = false;
  let burnDone = false;
  let pages = 0;

  while (!swapDone || !mintDone || !burnDone) {
    if (pages >= args.maxPages) {
      throw new Error(
        `dex subgraph combined pagination hit page cap (${args.maxPages}): swaps=${swaps.length} mints=${mints.length} burns=${burns.length} tokenCount=${args.tokenIds.length}`,
      );
    }

    const swapWhere = swapDone
      ? EXHAUSTED_STREAM_WHERE
      : buildTimestampIdPageWhere({
          // Swaps: user as maker (origin) or taker (recipient).
          accountFilters: [{ origin: args.accountLc }, { recipient: args.accountLc }],
          tokenIds: args.tokenIds,
          startTime: args.startTime,
          endInclusive: swapCursor ? undefined : endInclusive,
          cursor: swapCursor,
        });

    const mintBurnWhere = (done: boolean, cursor?: TimestampIdCursor) =>
      done
        ? EXHAUSTED_STREAM_WHERE
        : buildTimestampIdPageWhere({
            // Mints/burns: LP provider is always origin.
            accountFilters: [{ origin: args.accountLc }],
            tokenIds: args.tokenIds,
            startTime: args.startTime,
            endInclusive: cursor ? undefined : endInclusive,
            cursor,
          });

    const variables = {
      first: args.pageSize,
      // biome-ignore lint/suspicious/noExplicitAny: Swapr/Uniswap generated enum union
      orderDirection: OrderDirection.Desc as any,
      swapWhere,
      mintWhere: mintBurnWhere(mintDone, mintCursor),
      burnWhere: mintBurnWhere(burnDone, burnCursor),
    };

    const data = await sdk.GetAccountDexEvents(variables);
    assertAccountDexEventsPayload(data);
    pages += 1;

    if (!swapDone) {
      const next = appendUnique(data.swaps, swapSeen, swaps, args.pageSize);
      if (next === "done") swapDone = true;
      else swapCursor = next;
    }

    if (!mintDone) {
      const next = appendUnique(data.mints, mintSeen, mints, args.pageSize);
      if (next === "done") mintDone = true;
      else mintCursor = next;
    }

    if (!burnDone) {
      const next = appendUnique(data.burns, burnSeen, burns, args.pageSize);
      if (next === "done") burnDone = true;
      else burnCursor = next;
    }
  }

  return { swaps, mints, burns };
}

async function fetchDexEventsFromSubgraph(
  mappings: MarketDataMapping,
  account: Address,
  chainId: SupportedChain,
  startTime?: number,
  endTime?: number,
  walletTokenIds?: Iterable<string>,
): Promise<Omit<AccountDexEvents, "swaps"> & { swaps: TransactionData[] }> {
  const { outcomeTokenToCollateral, tokenPairToMarketMapping } = mappings;
  const mappedIds = mappingTokenIds(mappings);
  const tokenIds = walletTokenIds == null ? mappedIds : dexTokenIdsForWallet(mappedIds, walletTokenIds);
  if (outcomeTokenToCollateral.size === 0 || tokenIds.length === 0) {
    return { swaps: [], mints: [], burns: [] };
  }

  const accountLc = account.toLowerCase() as Address;
  const tokenChunks = chunkIds([...new Set(tokenIds.map((t) => t.toLowerCase()))], TOKEN_IN_CHUNK);

  const rawSwaps: RawSwap[] = [];
  const rawMints: RawMint[] = [];
  const rawBurns: RawBurn[] = [];
  const globalSwapSeen = new Set<string>();
  const globalMintSeen = new Set<string>();
  const globalBurnSeen = new Set<string>();

  for (let i = 0; i < tokenChunks.length; i++) {
    const chunk = tokenChunks[i];
    const page = await paginateCombinedTokenChunk({
      chainId,
      accountLc,
      tokenIds: chunk,
      startTime,
      endTime,
      pageSize: DEFAULT_PAGE_SIZE,
      maxPages: DEFAULT_MAX_PAGES,
    });

    for (const s of page.swaps) {
      if (globalSwapSeen.has(s.id)) continue;
      globalSwapSeen.add(s.id);
      rawSwaps.push(s);
    }
    for (const m of page.mints) {
      if (globalMintSeen.has(m.id)) continue;
      globalMintSeen.add(m.id);
      rawMints.push(m);
    }
    for (const b of page.burns) {
      if (globalBurnSeen.has(b.id)) continue;
      globalBurnSeen.add(b.id);
      rawBurns.push(b);
    }
  }

  const swaps = rawSwaps.reduce((acc, swap) => {
    const mapped = mapSwapToTransaction(swap, tokenPairToMarketMapping);
    if (mapped) acc.push(mapped);
    return acc;
  }, [] as TransactionData[]);

  const mints = rawMints.reduce((acc, mint) => {
    const mapped = mapMintToTransaction(mint, tokenPairToMarketMapping);
    if (mapped) acc.push(mapped);
    return acc;
  }, [] as TransactionData[]);

  const burns = rawBurns.reduce((acc, burn) => {
    const mapped = mapBurnToTransaction(burn, tokenPairToMarketMapping);
    if (mapped) acc.push(mapped);
    return acc;
  }, [] as TransactionData[]);

  return { swaps, mints, burns };
}

/**
 * Single Goldsky pass: swaps + mints + burns in one GraphQL POST per pagination page,
 * plus CoW fills (separate API, not rate-limited by Goldsky gate).
 */
export async function fetchAccountDexEvents(
  mappings: MarketDataMapping,
  account: Address,
  chainId: SupportedChain,
  startTime?: number,
  endTime?: number,
  opts?: { walletTokenIds?: Iterable<string> },
): Promise<AccountDexEvents> {
  const [dex, cowSwaps] = await Promise.all([
    fetchDexEventsFromSubgraph(mappings, account, chainId, startTime, endTime, opts?.walletTokenIds),
    getCowswapSwapsCached(mappings, chainId, account),
  ]);

  const filteredCow =
    startTime != null || endTime != null
      ? cowSwaps.filter((s) => {
          const ts = Number(s.timestamp ?? 0);
          if (startTime != null && ts < startTime) return false;
          if (endTime != null && ts > endTime) return false;
          return true;
        })
      : cowSwaps;

  return {
    swaps: dex.swaps.concat(filteredCow),
    mints: dex.mints,
    burns: dex.burns,
  };
}

/** Flat list for `/get-transactions` (swaps + LP mints + LP burns). */
export async function fetchAccountDexTransactions(
  mappings: MarketDataMapping,
  account: Address,
  chainId: SupportedChain,
  startTime?: number,
  endTime?: number,
): Promise<TransactionData[]> {
  const { swaps, mints, burns } = await fetchAccountDexEvents(mappings, account, chainId, startTime, endTime);
  return swaps.concat(mints, burns);
}
