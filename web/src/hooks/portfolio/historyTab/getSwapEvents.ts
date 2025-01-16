import {
  GetSwapsQuery,
  OrderDirection,
  Swap_OrderBy,
  getSdk as getSwaprSdk,
} from "@/hooks/queries/gql-generated-swapr";
import { getSdk as getUniswapSdk } from "@/hooks/queries/gql-generated-uniswap";
import { SupportedChain, gnosis } from "@/lib/chains";
import { COLLATERAL_TOKENS } from "@/lib/config";
import { swaprGraphQLClient, uniswapGraphQLClient } from "@/lib/subgraph";
import { NATIVE_TOKEN, isTwoStringsEqual } from "@/lib/utils";
import { OrderBookApi } from "@cowprotocol/cow-sdk";
import { DAI, WXDAI } from "@swapr/sdk";
import { Address, parseUnits } from "viem";
import { MarketDataMapping } from "../getMappings";
import { TransactionData } from "./types";

export async function getSwapEvents(mappings: MarketDataMapping, account: string, chainId: SupportedChain) {
  const { outcomeTokenToCollateral, tokenPairToMarketMapping, marketIdToCollateral } = mappings;
  const tokens = Object.keys(outcomeTokenToCollateral).map((x) => {
    return {
      tokenId: x,
      parentTokenId: outcomeTokenToCollateral[x],
    };
  });
  if (!tokens) return [];
  const graphQLClient = chainId === gnosis.id ? swaprGraphQLClient(chainId, "algebra") : uniswapGraphQLClient(chainId);

  if (!graphQLClient) {
    throw new Error("Subgraph not available");
  }
  const graphQLSdk = chainId === gnosis.id ? getSwaprSdk : getUniswapSdk;
  let total: GetSwapsQuery["swaps"] = [];
  const maxAttempts = 20;
  let attempt = 1;
  let timestamp = undefined;
  while (attempt < maxAttempts) {
    const data = await graphQLSdk(graphQLClient).GetSwaps({
      first: 1000,
      // biome-ignore lint/suspicious/noExplicitAny:
      orderBy: Swap_OrderBy.Timestamp as any,
      // biome-ignore lint/suspicious/noExplicitAny:
      orderDirection: OrderDirection.Desc as any,
      where: {
        and: [
          {
            or: tokens.reduce(
              (acc, { tokenId, parentTokenId }) => {
                if (parentTokenId) {
                  acc.push(
                    tokenId.toLocaleLowerCase() > parentTokenId.toLocaleLowerCase()
                      ? { token1: tokenId.toLocaleLowerCase(), token0: parentTokenId.toLocaleLowerCase() }
                      : { token0: tokenId.toLocaleLowerCase(), token1: parentTokenId.toLocaleLowerCase() },
                  );
                } else {
                  acc.push({ token0: tokenId.toLocaleLowerCase() }, { token1: tokenId.toLocaleLowerCase() });
                }
                return acc;
              },
              [] as { [key: string]: string }[],
            ),
          },
          {
            recipient: account.toLocaleLowerCase() as Address,
            timestamp_lt: timestamp,
          },
        ],
      },
    });
    const swaps = data.swaps as GetSwapsQuery["swaps"];
    total = total.concat(swaps);
    if (swaps[swaps.length - 1]?.timestamp === timestamp) {
      break;
    }
    if (swaps.length < 1000) {
      break;
    }
    timestamp = swaps[swaps.length - 1]?.timestamp;
    attempt++;
  }
  const swapsFromSubgraph = total.reduce((acc, swap) => {
    const amount0 = parseUnits(Math.abs(Number(swap.amount0)).toString(), Number(swap.token0.decimals));
    const amount1 = parseUnits(Math.abs(Number(swap.amount1)).toString(), Number(swap.token1.decimals));
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
        collateral: marketIdToCollateral[market.id.toLocaleLowerCase()],
        transactionHash: swap.transaction.id,
      });
    }
    return acc;
  }, [] as TransactionData[]);
  // get cowswap trades
  const orderBookApi = new OrderBookApi({ chainId });
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
        collateral: marketIdToCollateral[market.id.toLocaleLowerCase()],
        transactionHash: trade.txHash ?? undefined,
        tokenInSymbol,
        tokenOutSymbol,
      });
    }
    return acc;
  }, [] as TransactionData[]);
  return swapsFromSubgraph.concat(cowSwaps);
}
