import { useQuery } from "@tanstack/react-query";
import { Address, formatUnits, zeroAddress } from "viem";

import { Market } from "@/hooks/useMarket";
import { MarketStatus, getMarketStatus } from "@/hooks/useMarketStatus";
import { useMarkets } from "@/hooks/useMarkets";
import { SupportedChain } from "@/lib/chains";
import { isTwoStringsEqual } from "@/lib/utils";
import { getTokensInfo } from "../utils";

export interface PortfolioPosition {
  tokenName: string;
  tokenId: string;
  tokenIndex: number;
  marketAddress: string;
  marketName: string;
  marketStatus: string;
  tokenBalance: number;
  tokenValue?: number;
  tokenPrice?: number;
  outcome: string;
  parentTokenId?: string;
  parentMarketId?: string;
  parentMarketName?: string;
  parentOutcome?: string;
  redeemedPrice: number;
  marketFinalizeTs: number;
}

const getRedeemedPrice = (market: Market, tokenIndex: number) => {
  if (!market.payoutReported) return 0;
  const sumPayout = market.payoutNumerators.reduce((acc, curr) => acc + Number(curr), 0);
  if (isTwoStringsEqual(market.parentMarket.id, zeroAddress)) {
    return Number(market.payoutNumerators[tokenIndex]) / sumPayout;
  }
  const isParentPayout =
    market.parentMarket.payoutReported && market.parentMarket.payoutNumerators[Number(market.parentOutcome)] > 0n;
  if (isParentPayout) {
    const sumParentPayout = market.parentMarket.payoutNumerators.reduce((acc, curr) => acc + Number(curr), 0);
    const payoutPrice = Number(market.payoutNumerators[tokenIndex]) / sumPayout;
    const parentPayoutPrice =
      Number(market.parentMarket.payoutNumerators[Number(market.parentOutcome)]) / sumParentPayout;
    return payoutPrice * parentPayoutPrice;
  }
  return 0;
};

export const fetchPositions = async (
  initialMarkets: Market[] | undefined,
  address: Address,
  chainId: SupportedChain,
) => {
  if (!initialMarkets) return [];
  const markets = initialMarkets.filter((x) => x.chainId === chainId);
  // tokenId => marketId
  const marketIdToMarket = markets.reduce(
    (acum, market) => {
      acum[market.id] = {
        ...market,
        marketStatus: getMarketStatus(market),
      };
      return acum;
    },
    {} as Record<Address, Market & { marketStatus: string }>,
  );

  const tokenToMarket = markets.reduce(
    (acum, market) => {
      for (let i = 0; i < market.wrappedTokens.length; i++) {
        const tokenId = market.wrappedTokens[i];
        acum[tokenId] = {
          marketAddress: market.id,
          tokenIndex: i,
        };
      }
      return acum;
    },
    {} as Record<Address, { marketAddress: Address; tokenIndex: number }>,
  );

  const allTokensIds = Object.keys(tokenToMarket) as Address[];
  const { balances, names: tokenNames, decimals: tokenDecimals } = await getTokensInfo(allTokensIds, address);

  const positions = balances.reduce((acumm, balance, index) => {
    if (balance > 0n) {
      const { marketAddress, tokenIndex } = tokenToMarket[allTokensIds[index]];
      const market = marketIdToMarket[marketAddress];
      const parentMarket = marketIdToMarket[market.parentMarket.id];
      acumm.push({
        marketAddress,
        tokenIndex,
        tokenName: tokenNames[index],
        tokenId: allTokensIds[index],
        tokenBalance: Number(formatUnits(balance, Number(tokenDecimals[index]))),
        marketName: market.marketName,
        marketStatus: market.marketStatus,
        marketFinalizeTs: market.finalizeTs,
        outcome: market.outcomes[market.wrappedTokens.indexOf(allTokensIds[index])],
        parentTokenId: parentMarket ? parentMarket.wrappedTokens[Number(market.parentOutcome)] : undefined,
        parentMarketName: parentMarket?.marketName,
        parentMarketId: parentMarket?.id,
        parentOutcome: parentMarket ? parentMarket.outcomes[Number(market.parentOutcome)] : undefined,
        redeemedPrice: getRedeemedPrice(market, tokenIndex),
      });
    }
    return acumm;
  }, [] as PortfolioPosition[]);

  return positions.filter((position) => {
    const market = marketIdToMarket[position.marketAddress as Address];
    if (position.marketStatus === MarketStatus.CLOSED) {
      const isPayout = market.payoutReported && market.payoutNumerators[position.tokenIndex] > 0n;
      const isParentPayout =
        !market.parentMarket.payoutReported ||
        (market.parentMarket.payoutReported && market.parentMarket.payoutNumerators[Number(market.parentOutcome)] > 0n);
      return isPayout && isParentPayout;
    }
    return true;
  });
};

export const usePositions = (address: Address, chainId: SupportedChain) => {
  const { data: markets } = useMarkets({});
  return useQuery<PortfolioPosition[] | undefined, Error>({
    enabled: !!address,
    queryKey: ["usePositions", address, !!markets, chainId],
    queryFn: async () => fetchPositions(markets, address, chainId),
  });
};
