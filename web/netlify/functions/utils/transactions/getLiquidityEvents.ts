import { MarketDataMapping } from "@/hooks/portfolio/getMappings";
import { TransactionData } from "@/hooks/portfolio/historyTab/types";
import {
  GetMintsQuery,
  Mint_OrderBy,
  OrderDirection,
  getSdk as getSwaprSdk,
} from "@/hooks/queries/gql-generated-swapr";
import { getSdk as getUniswapSdk } from "@/hooks/queries/gql-generated-uniswap";
import { SupportedChain, gnosis } from "@/lib/chains";
import { getCollateralFromDexTx, getToken0Token1, getTokensPairKey } from "@/lib/market";
import { swaprGraphQLClient, uniswapGraphQLClient } from "@/lib/subgraph";
import { Address, parseUnits } from "viem";

async function fetchMintsFromSubgraph(
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
  let totalMints: GetMintsQuery["mints"] = [];

  const tokens = Array.from(outcomeTokenToCollateral, ([tokenId, collateralToken]) =>
    getToken0Token1(tokenId, collateralToken),
  );

  let timestamp: string | undefined = endTime?.toString();

  while (true) {
    const data = await graphQLSdk(graphQLClient).GetMints({
      first: 1000,
      // biome-ignore lint/suspicious/noExplicitAny:
      orderBy: Mint_OrderBy.Timestamp as any,
      // biome-ignore lint/suspicious/noExplicitAny:
      orderDirection: OrderDirection.Desc as any,
      where: {
        and: [
          {
            or: tokens,
          },
          {
            origin: account.toLocaleLowerCase() as Address,
            timestamp_lt: timestamp,
            ...(startTime && { timestamp_gte: startTime.toString() }),
          },
        ],
      },
    });

    const mints = data.mints as GetMintsQuery["mints"];
    totalMints = totalMints.concat(mints);

    // Stop if no more mints or same timestamp (no progress)
    if (mints.length === 0 || mints[mints.length - 1]?.timestamp === timestamp) {
      break;
    }

    // Update timestamp for next page
    timestamp = mints[mints.length - 1]?.timestamp;

    // Stop if less than the page size (no more data)
    if (mints.length < 1000) {
      break;
    }
  }

  return totalMints;
}

export async function getLiquidityEvents(
  mappings: MarketDataMapping,
  account: string,
  chainId: SupportedChain,
  startTime?: number,
  endTime?: number,
) {
  const { outcomeTokenToCollateral, tokenPairToMarketMapping } = mappings;
  if (outcomeTokenToCollateral.size === 0) return [];
  const total = await fetchMintsFromSubgraph(outcomeTokenToCollateral, account, chainId, startTime, endTime);
  return total.reduce((acc, swap) => {
    const amount0 = parseUnits(swap.amount0.replace("-", ""), Number(swap.token0.decimals));
    const amount1 = parseUnits(swap.amount1.replace("-", ""), Number(swap.token1.decimals));
    const market = tokenPairToMarketMapping[getTokensPairKey(swap.token0.id, swap.token1.id)];
    if (market) {
      acc.push({
        token0: swap.token0.id,
        token1: swap.token1.id,
        amount0: amount0.toString(),
        amount1: amount1.toString(),
        token0Symbol: swap.token0.symbol,
        token1Symbol: swap.token1.symbol,
        blockNumber: Number(swap.transaction.blockNumber),
        timestamp: Number(swap.timestamp),
        marketName: market.marketName,
        marketId: market.id,
        type: "lp",
        collateral: getCollateralFromDexTx(market, swap.token0.id as Address, swap.token1.id as Address),
        transactionHash: swap.transaction.id,
      });
    }
    return acc;
  }, [] as TransactionData[]);
}
