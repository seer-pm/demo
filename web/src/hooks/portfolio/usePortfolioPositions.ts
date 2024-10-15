import { SupportedChain } from "@/lib/chains";
import { config } from "@/wagmi";
import { useQuery } from "@tanstack/react-query";
import { readContracts } from "@wagmi/core";
import { subDays } from "date-fns";
import { Address, erc20Abi, formatUnits } from "viem";
import { readConditionalTokensPayoutNumerators } from "../contracts/generated";
import { Market } from "../useMarket";
import { MarketStatus, getMarketStatus } from "../useMarketStatus";
import { fetchMarkets } from "../useMarkets";
import { getBlockNumberAtTime } from "./utils";

export interface PortfolioPosition {
  tokenName: string;
  tokenId: string;
  tokenIndex: number;
  marketAddress: string;
  marketName: string;
  marketStatus: string;
  tokenBalance: number;
  tokenHistoryBalance: number;
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
      console.log(batchResults, remainingIndices);
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

  return results;
};

export const fetchPositions = async (address: Address, chainId: SupportedChain) => {
  // tokenId => marketId
  const markets = await fetchMarkets(chainId);
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

  // [tokenId, ..., ...]
  const allTokensIds = Object.keys(tokenToMarket) as Address[];

  // [tokenBalance, ..., ...]
  const balances = (await readContracts(config, {
    contracts: allTokensIds.map((wrappedAddress) => ({
      abi: erc20Abi,
      address: wrappedAddress,
      functionName: "balanceOf",
      args: [address],
    })),
    allowFailure: false,
  })) as bigint[];

  // history balance
  const yesterdayInSeconds = Math.floor(subDays(new Date(), 1).getTime() / 1000);
  const blockNumber = await getBlockNumberAtTime(yesterdayInSeconds);
  console.log(blockNumber);
  const historyBalances = await getBalancesAtBlock(blockNumber, allTokensIds, address);
  console.log(historyBalances);
  // tokenNames
  const tokenNames = (await readContracts(config, {
    contracts: allTokensIds.map((wrappedAddress) => ({
      abi: erc20Abi,
      address: wrappedAddress,
      functionName: "name",
      args: [],
    })),
    allowFailure: false,
  })) as string[];

  // decimals
  const tokenDecimals = (await readContracts(config, {
    contracts: allTokensIds.map((wrappedAddress) => ({
      abi: erc20Abi,
      address: wrappedAddress,
      functionName: "decimals",
      args: [],
    })),
    allowFailure: false,
  })) as bigint[];

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
        tokenHistoryBalance: Number(formatUnits(historyBalances[index] ?? balance, Number(tokenDecimals[index]))),
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
    marketsWithPositions.map((marketAddress) => fetchMarketPayouts(marketIdToMarket[marketAddress], chainId)),
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

export const fetchMarketPayouts = async (market: Market | undefined, chainId: SupportedChain) => {
  if (!market) return [];
  return await Promise.all(
    market.outcomes.map((_, index) =>
      readConditionalTokensPayoutNumerators(config, {
        args: [market.conditionId, BigInt(index)],
        chainId,
      }),
    ),
  );
};

export const usePositions = (address: Address, chainId: SupportedChain) => {
  return useQuery<PortfolioPosition[] | undefined, Error>({
    enabled: !!address,
    queryKey: ["usePositions", address, chainId],
    queryFn: async () => fetchPositions(address, chainId),
  });
};
