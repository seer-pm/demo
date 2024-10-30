import { config } from "@/wagmi";
import { useQuery } from "@tanstack/react-query";
import { readContracts } from "@wagmi/core";
import { subDays } from "date-fns";
import { Address, erc20Abi, formatUnits } from "viem";

import { readConditionalTokensPayoutNumerators } from "@/hooks/contracts/generated";
import { Market } from "@/hooks/useMarket";
import { MarketStatus, getMarketStatus } from "@/hooks/useMarketStatus";
import { useMarkets } from "@/hooks/useMarkets";
import { SupportedChain } from "@/lib/chains";
import { isUndefined } from "@/lib/utils";
import { BigNumber, ethers } from "ethers";
import { getBlockNumberAtTime, getTokensInfo } from "../utils";

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
}

const getBalancesAtBlock = async (initialBlockNumber: number, allTokensIds: Address[], address: Address) => {
  let blockNumber = initialBlockNumber;
  const maxAttempts = 10; // Limit the number of attempts
  let attempts = 0;

  // Initialize results array with null values
  const results = new Array(allTokensIds.length).fill(null) as bigint[];
  let remainingIndices = allTokensIds.map((_, index) => index);

  while (attempts < maxAttempts && remainingIndices.length > 0) {
    try {
      const batchResults = await readContracts(config, {
        contracts: remainingIndices.map((index) => ({
          abi: erc20Abi,
          address: allTokensIds[index],
          functionName: "balanceOf",
          args: [address],
        })),
        allowFailure: true,
        blockNumber: BigInt(blockNumber),
      });
      const newRemainingIndices: number[] = [];
      // Process results
      batchResults.forEach((result, batchIndex) => {
        const originalIndex = remainingIndices[batchIndex];
        if (!("error" in result)) {
          results[originalIndex] = BigInt(result.result);
        } else {
          newRemainingIndices.push(originalIndex);
        }
      });

      remainingIndices = newRemainingIndices;

      // If all succeeded, return the results
      if (remainingIndices.length === 0) {
        return results;
      }

      // Increment block number and attempts
      blockNumber++;
      attempts++;
    } catch (error) {
      blockNumber++;
      attempts++;
    }
  }
  // if no result try one last time with ethers
  if (!results.filter((x) => x).length) {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const data = await Promise.allSettled(
        allTokensIds.map((tokenId) => {
          const contract = new ethers.Contract(tokenId, erc20Abi, provider);
          return contract
            .balanceOf(address, {
              blockTag: initialBlockNumber,
            })
            .then((data: BigNumber) => data.toBigInt());
        }),
      );
      return data.map((result) => {
        if (result.status === "fulfilled" && !isUndefined(result.value)) {
          return result.value;
        }
        return null;
      });
    } catch (e) {}
  }
  return results;
};

const getHistoryBalanceMapping = async (
  initialMarkets: Market[] | undefined,
  address: Address,
  chainId: SupportedChain,
) => {
  if (!initialMarkets) return {};
  const markets = initialMarkets.filter((x) => x.chainId === chainId);
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
  const tokenDecimals = (await readContracts(config, {
    contracts: allTokensIds.map((wrappedAddress) => ({
      abi: erc20Abi,
      address: wrappedAddress,
      functionName: "decimals",
      args: [],
    })),
    allowFailure: false,
  })) as bigint[];
  // history balance
  const yesterdayInSeconds = Math.floor(subDays(new Date(), 1).getTime() / 1000);
  const blockNumber = await getBlockNumberAtTime(yesterdayInSeconds);
  const historyBalances = await getBalancesAtBlock(blockNumber, allTokensIds, address);
  return historyBalances.reduce(
    (acc, balance, index) => {
      acc[allTokensIds[index]] = balance > 0n ? Number(formatUnits(balance, Number(tokenDecimals[index]))) : undefined;
      return acc;
    },
    {} as { [key: string]: number | undefined },
  );
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
      const parentMarket = marketIdToMarket[market.parentMarket];
      acumm.push({
        marketAddress,
        tokenIndex,
        tokenName: tokenNames[index],
        tokenId: allTokensIds[index],
        tokenBalance: Number(formatUnits(balance, Number(tokenDecimals[index]))),
        marketName: market.marketName,
        marketStatus: market.marketStatus,
        outcome: market.outcomes[market.wrappedTokens.indexOf(allTokensIds[index])],
        parentTokenId: parentMarket ? parentMarket.wrappedTokens[Number(market.parentOutcome)] : undefined,
        parentMarketName: parentMarket?.marketName,
        parentMarketId: parentMarket?.id,
        parentOutcome: parentMarket ? parentMarket.outcomes[Number(market.parentOutcome)] : undefined,
      });
    }
    return acumm;
  }, [] as PortfolioPosition[]);
  const marketsWithPositions = [...new Set(positions.map((position) => position.marketAddress))] as Address[];
  const marketsPayouts = await Promise.all(
    marketsWithPositions.map((marketAddress) => fetchMarketPayouts(marketIdToMarket[marketAddress])),
  );
  const marketToMarketPayouts = marketsWithPositions.reduce(
    (acc, marketAddress, index) => {
      acc[marketAddress] = marketsPayouts[index];
      return acc;
    },
    {} as { [key: Address]: bigint[] },
  );
  return positions.filter((position) => {
    const payouts = marketToMarketPayouts[position.marketAddress as Address];
    if (position.marketStatus === MarketStatus.CLOSED) {
      return payouts[position.tokenIndex] > 0;
    }
    return true;
  });
};

const fetchMarketPayouts = async (market: Market | undefined) => {
  if (!market) return [];
  return await Promise.all(
    market.outcomes.map((_, index) =>
      readConditionalTokensPayoutNumerators(config, {
        args: [market.conditionId, BigInt(index)],
        chainId: market.chainId,
      }),
    ),
  );
};

export const usePositions = (address: Address, chainId: SupportedChain) => {
  const { data: markets } = useMarkets({});
  return useQuery<PortfolioPosition[] | undefined, Error>({
    enabled: !!address,
    queryKey: ["usePositions", address, !!markets, chainId],
    queryFn: async () => fetchPositions(markets, address, chainId),
  });
};

export const useGetHistoryBalances = (address: Address | undefined, chainId: SupportedChain) => {
  const { data: markets } = useMarkets({});
  return useQuery<{ [key: string]: number | undefined } | undefined, Error>({
    enabled: !!address,
    gcTime: 1000 * 60 * 60 * 24, //24 hours
    staleTime: 0,
    queryKey: ["useGetHistoryBalances", address, !!markets, chainId],
    queryFn: async () => getHistoryBalanceMapping(markets, address!, chainId),
  });
};
