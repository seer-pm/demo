import {
  GetMintsQuery,
  Mint_OrderBy,
  OrderDirection,
  getSdk as getSwaprSdk,
} from "@/hooks/queries/gql-generated-swapr";
import { getSdk as getUniswapSdk } from "@/hooks/queries/gql-generated-uniswap";
import { SupportedChain, gnosis } from "@/lib/chains";
import { swaprGraphQLClient, uniswapGraphQLClient } from "@/lib/subgraph";
import { Address, parseUnits } from "viem";
import { MarketDataMapping } from "../getMappings";
import { TransactionData } from "./types";

export async function getLiquidityEvents(mappings: MarketDataMapping, account: string, chainId: SupportedChain) {
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
  let total: GetMintsQuery["mints"] = [];
  const maxAttempts = 20;
  let attempt = 1;
  let timestamp = undefined;

  while (attempt < maxAttempts) {
    const data = await graphQLSdk(graphQLClient).GetMints({
      first: 1000,
      // biome-ignore lint/suspicious/noExplicitAny:
      orderBy: Mint_OrderBy.Timestamp as any,
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
            origin: account.toLocaleLowerCase() as Address,
            timestamp_lt: timestamp,
          },
        ],
      },
    });
    const mints = data.mints as GetMintsQuery["mints"];
    total = total.concat(mints);
    if (mints[mints.length - 1]?.timestamp === timestamp) {
      break;
    }
    if (mints.length < 1000) {
      break;
    }
    timestamp = mints[mints.length - 1]?.timestamp;
    attempt++;
  }
  return total.reduce((acc, swap) => {
    const amount0 = parseUnits(Math.abs(Number(swap.amount0)).toString(), Number(swap.token0.decimals));
    const amount1 = parseUnits(Math.abs(Number(swap.amount1)).toString(), Number(swap.token1.decimals));
    const market =
      tokenPairToMarketMapping[`${swap.token0.id.toLocaleLowerCase()}-${swap.token1.id.toLocaleLowerCase()}`];
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
        collateral: marketIdToCollateral[market.id.toLocaleLowerCase()],
        transactionHash: swap.transaction.id,
      });
    }
    return acc;
  }, [] as TransactionData[]);
}
