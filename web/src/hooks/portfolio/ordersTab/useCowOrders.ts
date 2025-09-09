import { useMarkets } from "@/hooks/useMarkets";
import { SupportedChain } from "@/lib/chains";
import { isOpStack } from "@/lib/config";
import { Market, getTokensPairKey } from "@/lib/market";
import { getCollateralSymbol, getCollateralTokenForSwap } from "@/lib/tokens";
import { isUndefined } from "@/lib/utils";
import { OrderBookApi } from "@cowprotocol/cow-sdk";
import { useQuery } from "@tanstack/react-query";
import { Address, formatUnits } from "viem";
import { getMappings } from "../getMappings";
import { CowOrderData } from "./types";

async function getCowOrders(initialMarkets: Market[] | undefined, account?: Address, chainId?: SupportedChain) {
  if (!chainId || !account || !initialMarkets || isOpStack(chainId)) return [];
  const mappings = await getMappings(initialMarkets, chainId);
  const { tokenIdToTokenSymbolMapping, tokenPairToMarketMapping } = mappings;
  const orderBookApi = new OrderBookApi({ chainId });
  const orders = await orderBookApi.getOrders({ owner: account });

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
  const { data } = useMarkets({});
  return useQuery<CowOrderData[] | undefined, Error>({
    enabled: !!address && !isUndefined(data),
    queryKey: ["useCowOrders", address, chainId],
    retry: false,
    queryFn: async () => getCowOrders(data!.markets, address, chainId),
    refetchOnMount: true,
  });
};
