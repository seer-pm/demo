import { useQuery } from "@tanstack/react-query";
import { Address, formatUnits } from "viem";

import { Market } from "@/hooks/useMarket";
import { MarketStatus, getMarketStatus } from "@/hooks/useMarketStatus";
import { useMarkets } from "@/hooks/useMarkets";
import { SupportedChain } from "@/lib/chains";
import { getCollateralByIndex } from "@/lib/market";
import { getTokensInfo } from "../utils";

export interface PortfolioPosition {
  tokenName: string;
  tokenId: Address;
  tokenIndex: number;
  marketAddress: string;
  marketName: string;
  marketStatus: string;
  tokenBalance: number;
  tokenValue?: number;
  tokenPrice?: number;
  outcome: string;
  collateralToken: Address;
  parentMarketId?: Address;
  parentMarketName?: string;
  parentOutcome?: string;
}

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
        outcome: market.outcomes[market.wrappedTokens.indexOf(allTokensIds[index])],
        collateralToken: getCollateralByIndex(market, tokenIndex),
        parentMarketName: parentMarket?.marketName,
        parentMarketId: parentMarket?.id,
        parentOutcome: parentMarket ? parentMarket.outcomes[Number(market.parentOutcome)] : undefined,
      });
    }
    return acumm;
  }, [] as PortfolioPosition[]);
  return positions.filter((position) => {
    const market = marketIdToMarket[position.marketAddress as Address];
    if (position.marketStatus === MarketStatus.CLOSED) {
      return market.payoutReported && market.payoutNumerators[position.tokenIndex] > 0n;
    }
    return true;
  });
};

export const usePositions = (address: Address, chainId: SupportedChain) => {
  const { data: markets = [] } = useMarkets({});
  return useQuery<PortfolioPosition[] | undefined, Error>({
    enabled: !!address && markets.length > 0,
    queryKey: ["usePositions", address, chainId],
    queryFn: async () => fetchPositions(markets, address, chainId),
  });
};
