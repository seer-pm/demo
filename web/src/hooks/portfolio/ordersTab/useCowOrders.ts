import type { SupportedChain } from "@seer-pm/sdk";
import { isOpStack } from "@seer-pm/sdk";
import { fetchMarkets, getTokensPairKey } from "@seer-pm/sdk";
import { OrderBookApi } from "@seer-pm/sdk";
import { getCollateralSymbol, getCollateralTokenForSwap } from "@seer-pm/sdk";
import { useQuery } from "@tanstack/react-query";
import { Address, formatUnits } from "viem";
import { getMappings } from "../getMappings";
import { CowOrderData } from "./types";

async function getCowOrders(account?: Address, chainId?: SupportedChain) {
  if (!chainId || !account || isOpStack(chainId)) return [];
  const orderBookApi = new OrderBookApi({ chainId: chainId as number });
  const orders = await orderBookApi.getOrders({ owner: account });

  if (orders.length === 0) return [];

  // Collect unique tokens from orders so we can fetch only the markets that touch them.
  const uniqueTokens = Array.from(
    new Set(
      orders.flatMap((order) => [
        (order.sellToken as Address).toLowerCase() as Address,
        (order.buyToken as Address).toLowerCase() as Address,
      ]),
    ),
  );

  const { markets } = await fetchMarkets({
    chainsList: [chainId.toString()],
    tokens: uniqueTokens,
    limit: 1000,
  });

  if (markets.length === 0) return [];

  const mappings = await getMappings(markets, chainId);
  const { tokenIdToTokenSymbolMapping, tokenPairToMarketMapping } = mappings;

  const processedOrders = orders.reduce<CowOrderData[]>((acc, curr) => {
    const sellToken = getCollateralTokenForSwap(curr.sellToken as Address, chainId);
    const buyToken = getCollateralTokenForSwap(curr.buyToken as Address, chainId);
    const sellTokenSymbol =
      getCollateralSymbol(
        curr.sellToken as Address,
        account,
        curr.owner as Address,
        chainId,
        tokenIdToTokenSymbolMapping,
      ) ?? curr.sellToken.slice(0, 6);
    const buyTokenSymbol =
      getCollateralSymbol(
        curr.buyToken as Address,
        account,
        curr.owner as Address,
        chainId,
        tokenIdToTokenSymbolMapping,
      ) ?? curr.buyToken.slice(0, 6);
    const market = tokenPairToMarketMapping[getTokensPairKey(sellToken, buyToken)];
    if (market) {
      acc.push({
        ...curr,
        marketName: market.marketName,
        marketId: market.id,
        buyTokenSymbol,
        sellTokenSymbol,
        sellAmount: Number(formatUnits(BigInt(curr.sellAmount), 18)).toFixed(4),
        formattedExecutedSellAmount: Number(curr.executedSellAmount)
          ? Number(formatUnits(BigInt(curr.executedSellAmount), 18)).toFixed(4)
          : null,
        buyAmount: Number(formatUnits(BigInt(curr.buyAmount), 18)).toFixed(4),
        formattedExecutedBuyAmount: Number(curr.executedBuyAmount)
          ? Number(formatUnits(BigInt(curr.executedBuyAmount), 18)).toFixed(4)
          : null,
        limitPrice: (
          Number(formatUnits(BigInt(curr.sellAmount), 18)) / Number(formatUnits(BigInt(curr.buyAmount), 18))
        ).toFixed(4),
        executionPrice: Number(curr.executedSellAmount)
          ? (
              Number(formatUnits(BigInt(curr.executedSellAmount), 18)) /
              Number(formatUnits(BigInt(curr.executedBuyAmount), 18))
            ).toFixed(4)
          : null,
        isOnChainOrder: !!curr.onchainUser,
        isEthFlow: !!curr.ethflowData,
      });
    }
    return acc;
  }, []);
  return processedOrders;
}

export const useCowOrders = (address: Address, chainId: SupportedChain) => {
  return useQuery<CowOrderData[] | undefined, Error>({
    enabled: !!address,
    queryKey: ["useCowOrders", address, chainId],
    retry: false,
    queryFn: async () => getCowOrders(address, chainId),
    refetchOnMount: true,
  });
};
