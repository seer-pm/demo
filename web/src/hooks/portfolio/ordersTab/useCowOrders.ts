import { Market } from "@/hooks/useMarket";
import { useMarkets } from "@/hooks/useMarkets";
import { SupportedChain, gnosis } from "@/lib/chains";
import { COLLATERAL_TOKENS } from "@/lib/config";
import { NATIVE_TOKEN, isTwoStringsEqual, isUndefined } from "@/lib/utils";
import { OrderBookApi } from "@cowprotocol/cow-sdk";
import { DAI, WXDAI } from "@swapr/sdk";
import { useQuery } from "@tanstack/react-query";
import { Address, formatUnits } from "viem";
import { getMappings } from "../getMappings";
import { CowOrderData } from "./types";

async function getCowOrders(initialMarkets: Market[] | undefined, account?: string, chainId?: SupportedChain) {
  if (!chainId || !account || !initialMarkets) return [];
  const markets = initialMarkets.filter((x) => x.chainId === chainId);
  const mappings = await getMappings(markets, chainId);
  const { tokenIdToTokenSymbolMapping, tokenPairToMarketMapping } = mappings;
  const orderBookApi = new OrderBookApi({ chainId });
  const orders = await orderBookApi.getOrders({ owner: account });
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
  const parseSymbol = (tokenAddress?: string) => {
    if (!tokenAddress) return;
    return isTwoStringsEqual(tokenAddress, COLLATERAL_TOKENS[chainId!].primary.address)
      ? "sDAI"
      : tokenIdToTokenSymbolMapping[tokenAddress.toLocaleLowerCase()];
  };
  const sDAIAddress = COLLATERAL_TOKENS[chainId].primary.address;
  const processedOrders = orders.reduce<CowOrderData[]>((acc, curr) => {
    const sellToken = isWXDAI(curr.sellToken) ? sDAIAddress : curr.sellToken;
    const buyToken = isWXDAI(curr.buyToken) ? sDAIAddress : curr.buyToken;
    const sellTokenSymbol =
      getWXDAISymbol(curr.sellToken, curr.owner) ?? parseSymbol(curr.sellToken) ?? curr.sellToken.slice(0, 6);
    const buyTokenSymbol =
      getWXDAISymbol(curr.buyToken, curr.owner) ?? parseSymbol(curr.buyToken) ?? curr.buyToken.slice(0, 6);
    const market =
      tokenPairToMarketMapping[
        sellToken.toLocaleLowerCase() > buyToken.toLocaleLowerCase()
          ? `${buyToken.toLocaleLowerCase()}-${sellToken.toLocaleLowerCase()}`
          : `${sellToken.toLocaleLowerCase()}-${buyToken.toLocaleLowerCase()}`
      ];
    if (market) {
      acc.push({
        ...curr,
        marketName: market.marketName,
        marketId: market.id,
        buyTokenSymbol,
        sellTokenSymbol,
        sellAmount: Number(formatUnits(BigInt(curr.sellAmount), 18)).toFixed(4),
        buyAmount: Number(formatUnits(BigInt(curr.buyAmount), 18)).toFixed(4),
        limitPrice: (
          Number(formatUnits(BigInt(curr.sellAmount), 18)) / Number(formatUnits(BigInt(curr.buyAmount), 18))
        ).toFixed(4),
      });
    }
    return acc;
  }, []);
  return processedOrders;
}

export const useCowOrders = (address: Address, chainId: SupportedChain) => {
  const { data: markets } = useMarkets({});
  return useQuery<CowOrderData[] | undefined, Error>({
    enabled: !!address && !isUndefined(markets),
    queryKey: ["useCowOrders", address, chainId, !!markets],
    retry: false,
    queryFn: async () => getCowOrders(markets, address, chainId),
    refetchOnMount: true,
  });
};
