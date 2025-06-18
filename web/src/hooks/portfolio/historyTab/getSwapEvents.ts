import {
  GetSwapsQuery,
  OrderDirection,
  Swap_OrderBy,
  getSdk as getSwaprSdk,
} from "@/hooks/queries/gql-generated-swapr";
import { getSdk as getUniswapSdk } from "@/hooks/queries/gql-generated-uniswap";
import { SupportedChain, gnosis } from "@/lib/chains";
import { COLLATERAL_TOKENS } from "@/lib/config";
import { Token0Token1, getCollateralFromDexTx, getToken0Token1 } from "@/lib/market";
import { swaprGraphQLClient, uniswapGraphQLClient } from "@/lib/subgraph";
import { NATIVE_TOKEN, isTwoStringsEqual } from "@/lib/utils";
import { OrderBookApi } from "@cowprotocol/cow-sdk";
import { DAI, WXDAI } from "@swapr/sdk";
import { Address, parseUnits } from "viem";
import { MarketDataMapping } from "../getMappings";
import { TransactionData } from "./types";

export async function fetchSwapsFromSubgraph(
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
  const batchSize = 100;
  const maxAttemptsPerBatch = 5;
  let totalSwaps: GetSwapsQuery["swaps"] = [];

  // Split tokens into batches
  const tokenBatches: Array<Token0Token1>[] = [];
  const tokens = Array.from(outcomeTokenToCollateral, ([tokenId, collateralToken]) =>
    getToken0Token1(tokenId, collateralToken),
  );
  for (let i = 0; i < tokens.length; i += batchSize) {
    tokenBatches.push(tokens.slice(i, i + batchSize));
  }

  // Process each batch
  for (const batch of tokenBatches) {
    let attempt = 1;
    let timestamp: string | undefined = endTime?.toString();

    while (attempt < maxAttemptsPerBatch) {
      const data = await graphQLSdk(graphQLClient).GetSwaps({
        first: 1000,
        // biome-ignore lint/suspicious/noExplicitAny:
        orderBy: Swap_OrderBy.Timestamp as any,
        // biome-ignore lint/suspicious/noExplicitAny:
        orderDirection: OrderDirection.Desc as any,
        where: {
          and: [
            {
              or: batch,
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

      attempt++;
    }
  }

  return totalSwaps;
}

export async function getSwapEvents(
  mappings: MarketDataMapping,
  account: string,
  chainId: SupportedChain,
  startTime?: number,
  endTime?: number,
) {
  const { outcomeTokenToCollateral, tokenPairToMarketMapping } = mappings;
  if (outcomeTokenToCollateral.size === 0) return [];
  const total = await fetchSwapsFromSubgraph(outcomeTokenToCollateral, account, chainId, startTime, endTime);
  const swapsFromSubgraph = total.reduce((acc, swap) => {
    const amount0 = parseUnits(swap.amount0.replace("-", ""), Number(swap.token0.decimals));
    const amount1 = parseUnits(swap.amount1.replace("-", ""), Number(swap.token1.decimals));
    const tokenIn = Number(swap.amount1) < 0 ? swap.token0.id : swap.token1.id;
    const tokenOut = Number(swap.amount1) < 0 ? swap.token1.id : swap.token0.id;
    const market =
      tokenPairToMarketMapping[
        tokenIn.toLocaleLowerCase() > tokenOut.toLocaleLowerCase()
          ? `${tokenOut.toLocaleLowerCase()}-${tokenIn.toLocaleLowerCase()}`
          : `${tokenIn.toLocaleLowerCase()}-${tokenOut.toLocaleLowerCase()}`
      ];
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
  // get cowswap trades
  const orderBookApi = new OrderBookApi({ chainId: chainId as number });
  const trades = await orderBookApi.getTrades({ owner: account });
  const isWXDAI = (tokenAddress: string) =>
    isTwoStringsEqual(tokenAddress, WXDAI[chainId]?.address) ||
    isTwoStringsEqual(tokenAddress, DAI[chainId]?.address) ||
    isTwoStringsEqual(tokenAddress, NATIVE_TOKEN);
  const getWXDAISymbol = (tokenAddress: string, owner: string) => {
    if (isTwoStringsEqual(tokenAddress, WXDAI[chainId]?.address)) {
      if (!isTwoStringsEqual(owner, account) && chainId === gnosis.id) {
        return "xDAI";
      }
      return WXDAI[chainId]?.symbol;
    }
    if (isTwoStringsEqual(tokenAddress, DAI[chainId]?.address)) {
      return DAI[chainId]?.symbol;
    }
    if (isTwoStringsEqual(tokenAddress, NATIVE_TOKEN) && chainId === gnosis.id) {
      return "xDAI";
    }
  };
  const sDAIAddress = COLLATERAL_TOKENS[chainId].primary.address;
  const cowSwaps = trades.reduce((acc, trade) => {
    const tokenIn = isWXDAI(trade.sellToken) ? sDAIAddress : trade.sellToken;
    const tokenOut = isWXDAI(trade.buyToken) ? sDAIAddress : trade.buyToken;
    const tokenInSymbol = getWXDAISymbol(trade.sellToken, trade.owner);
    const tokenOutSymbol = getWXDAISymbol(trade.buyToken, trade.owner);
    const market =
      tokenPairToMarketMapping[
        tokenIn.toLocaleLowerCase() > tokenOut.toLocaleLowerCase()
          ? `${tokenOut.toLocaleLowerCase()}-${tokenIn.toLocaleLowerCase()}`
          : `${tokenIn.toLocaleLowerCase()}-${tokenOut.toLocaleLowerCase()}`
      ];
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
    }
    return acc;
  }, [] as TransactionData[]);
  return swapsFromSubgraph.concat(cowSwaps);
}
