import { gnosis } from "@/lib/chains";
import { getStore } from "@netlify/blobs";
import type { SupportedChain } from "@seer-pm/sdk";
import { getCollateralSymbol, getCollateralTokenForSwap } from "@seer-pm/sdk/collateral";
import { OrderBookApi } from "@seer-pm/sdk/cow";
import { getToken0Token1, getTokensPairKey } from "@seer-pm/sdk/market-pools";
import { swaprGraphQLClient, uniswapGraphQLClient } from "@seer-pm/sdk/subgraph";
import { type GetSwapsQuery, OrderDirection, Swap_OrderBy, getSdk as getSwaprSdk } from "@seer-pm/sdk/subgraph/swapr";
import { getSdk as getUniswapSdk } from "@seer-pm/sdk/subgraph/uniswap";
import { type Address, parseUnits } from "viem";
import { getBlock } from "viem/actions";
import { getPublicClientByChainId } from "../config";
import { getCollateralFromDexTx } from "../markets";
import type { MarketDataMapping, TransactionData } from "../portfolio";

const COWSWAP_OWNER_TRADES_STORE = "cowswap-owner-trades";
/** Cache CoW swap rows (API + block timestamps) per chain + owner (Netlify Blobs). */
const COWSWAP_TRADES_CACHE_MS = 60 * 60 * 2 * 1000;

type CowswapSwapsCachePayload = {
  cachedAt: number;
  cowSwaps: TransactionData[];
};

async function getCowswapSwapsCached(
  mappings: MarketDataMapping,
  chainId: SupportedChain,
  account: Address,
): Promise<TransactionData[]> {
  const { tokenPairToMarketMapping } = mappings;
  const cacheKey = `${chainId}:${account.toLowerCase()}`;

  const store = getStore({
    name: COWSWAP_OWNER_TRADES_STORE,
    siteID: process.env.NETLIFY_SITE_ID,
    token: process.env.NETLIFY_BLOBS_TOKEN,
  });
  const cached = (await store.get(cacheKey, { type: "json" })) as CowswapSwapsCachePayload | null;
  if (
    cached &&
    typeof cached.cachedAt === "number" &&
    Array.isArray(cached.cowSwaps) &&
    Date.now() - cached.cachedAt < COWSWAP_TRADES_CACHE_MS
  ) {
    return cached.cowSwaps;
  }

  const orderBookApi = new OrderBookApi({ chainId: chainId as number });
  const trades = await orderBookApi.getTrades({ owner: account });

  type CowSwapPending = Omit<TransactionData, "timestamp">;

  const cowSwapsPartial = trades.reduce((acc, trade) => {
    const tokenIn = getCollateralTokenForSwap(trade.sellToken as Address, chainId);
    const tokenOut = getCollateralTokenForSwap(trade.buyToken as Address, chainId);
    const tokenInSymbol = getCollateralSymbol(trade.sellToken as Address, account, trade.owner as Address, chainId);
    const tokenOutSymbol = getCollateralSymbol(trade.buyToken as Address, account, trade.owner as Address, chainId);
    const market = tokenPairToMarketMapping[getTokensPairKey(tokenIn, tokenOut)];
    if (market) {
      acc.push({
        tokenIn,
        tokenOut,
        amountIn: trade.sellAmount,
        amountOut: trade.buyAmount,
        blockNumber: trade.blockNumber,
        marketName: market.marketName,
        marketId: market.id,
        type: "swap",
        collateral: getCollateralFromDexTx(market, tokenIn as Address, tokenOut as Address),
        transactionHash: trade.txHash ?? undefined,
        tokenInSymbol,
        tokenOutSymbol,
      });
    } else {
      console.log("Missing cow market", { tokenIn, tokenOut });
    }
    return acc;
  }, [] as CowSwapPending[]);

  const uniqueBlocks = [...new Set(cowSwapsPartial.map((s) => s.blockNumber))];
  const client = getPublicClientByChainId(chainId);
  const timestampByBlock = new Map<number, number>(
    await Promise.all(
      uniqueBlocks.map(async (bn) => {
        const block = await getBlock(client, { blockNumber: BigInt(bn) });
        return [bn, Number(block.timestamp)] as const;
      }),
    ),
  );

  const cowSwaps: TransactionData[] = cowSwapsPartial.map((s) => ({
    ...s,
    timestamp: timestampByBlock.get(s.blockNumber) ?? 0,
  }));

  await store.setJSON(cacheKey, { cachedAt: Date.now(), cowSwaps } satisfies CowswapSwapsCachePayload);

  return cowSwaps;
}

async function fetchSwapsFromSubgraph(
  outcomeTokenToCollateral: MarketDataMapping["outcomeTokenToCollateral"],
  account: string,
  chainId: SupportedChain,
  startTime?: number,
  endTime?: number,
) {
  const graphQLClient = chainId === gnosis.id ? swaprGraphQLClient(chainId, "algebra") : uniswapGraphQLClient(chainId);

  if (!graphQLClient) {
    throw new Error("Subgraph not available");
  }

  const graphQLSdk = chainId === gnosis.id ? getSwaprSdk : getUniswapSdk;
  let totalSwaps: GetSwapsQuery["swaps"] = [];

  const tokens = Array.from(outcomeTokenToCollateral, ([tokenId, collateralToken]) =>
    getToken0Token1(tokenId, collateralToken),
  );

  let timestamp: string | undefined = endTime?.toString();

  while (true) {
    const data = await graphQLSdk(graphQLClient).GetSwaps({
      first: 1000,
      // biome-ignore lint/suspicious/noExplicitAny:
      orderBy: Swap_OrderBy.Timestamp as any,
      // biome-ignore lint/suspicious/noExplicitAny:
      orderDirection: OrderDirection.Desc as any,
      where: {
        and: [
          {
            or: tokens,
          },
          {
            recipient: account.toLocaleLowerCase() as Address,
            timestamp_lt: timestamp,
            ...(startTime && { timestamp_gte: startTime.toString() }),
          },
        ],
      },
    });

    const swaps = data.swaps as GetSwapsQuery["swaps"];
    totalSwaps = totalSwaps.concat(swaps);

    // Stop if no more swaps or same timestamp (no progress)
    if (swaps.length === 0 || swaps[swaps.length - 1]?.timestamp === timestamp) {
      break;
    }

    // Update timestamp for next page
    timestamp = swaps[swaps.length - 1]?.timestamp;

    // Stop if less than the page size (no more data)
    if (swaps.length < 1000) {
      break;
    }
  }

  return totalSwaps;
}

export async function getSwapEvents(
  mappings: MarketDataMapping,
  account: Address,
  chainId: SupportedChain,
  startTime?: number,
  endTime?: number,
) {
  const { outcomeTokenToCollateral, tokenPairToMarketMapping } = mappings;
  if (outcomeTokenToCollateral.size === 0) {
    return [];
  }

  const [dexSwaps, cowSwaps] = await Promise.all([
    fetchSwapsFromSubgraph(outcomeTokenToCollateral, account, chainId, startTime, endTime),
    getCowswapSwapsCached(mappings, chainId, account),
  ]);

  const swapsFromSubgraph = dexSwaps.reduce((acc, swap) => {
    const amount0 = parseUnits(swap.amount0.replace("-", ""), Number(swap.token0.decimals));
    const amount1 = parseUnits(swap.amount1.replace("-", ""), Number(swap.token1.decimals));
    const tokenIn = Number(swap.amount1) < 0 ? swap.token0.id : swap.token1.id;
    const tokenOut = Number(swap.amount1) < 0 ? swap.token1.id : swap.token0.id;
    const market = tokenPairToMarketMapping[getTokensPairKey(tokenIn, tokenOut)];
    if (market) {
      acc.push({
        tokenIn,
        tokenOut,
        amountIn: tokenIn.toLocaleLowerCase() > tokenOut.toLocaleLowerCase() ? amount1.toString() : amount0.toString(),
        amountOut: tokenIn.toLocaleLowerCase() > tokenOut.toLocaleLowerCase() ? amount0.toString() : amount1.toString(),
        tokenInSymbol:
          tokenIn.toLocaleLowerCase() > tokenOut.toLocaleLowerCase() ? swap.token1.symbol : swap.token0.symbol,
        tokenOutSymbol:
          tokenIn.toLocaleLowerCase() > tokenOut.toLocaleLowerCase() ? swap.token0.symbol : swap.token1.symbol,
        blockNumber: Number(swap.transaction.blockNumber),
        timestamp: Number(swap.timestamp),
        marketName: market.marketName,
        marketId: market.id,
        type: "swap",
        collateral: getCollateralFromDexTx(market, tokenIn as Address, tokenOut as Address),
        transactionHash: swap.transaction.id,
      });
    }
    return acc;
  }, [] as TransactionData[]);

  return swapsFromSubgraph.concat(cowSwaps);
}
