import { SupportedChain } from "@/lib/chains";
import { COLLATERAL_TOKENS, getRouterAddress } from "@/lib/config";
import { fetchMarkets } from "@/lib/markets-search";
import { isTwoStringsEqual } from "@/lib/utils";
import { config } from "@/wagmi";
import { useQuery } from "@tanstack/react-query";
import { readContracts } from "@wagmi/core";
import { ethers } from "ethers";
import { Address, erc20Abi } from "viem";
import { gnosis, mainnet } from "viem/chains";
import { conditionalTokensAbi, conditionalTokensAddress } from "../contracts/generated";
import { Market } from "../useMarket";
import {
  BUNNI_HUB_ADDRESS,
  MAINNET_SWAP_ROUTER_ADDRESS,
  POSITION_MANAGER_ADDRESS,
  SWAP_ROUTER_ADDRESS,
  algebraPoolAbi,
  nonfungiblePositionManagerAbi,
  uniswapPoolAbi,
} from "./abis";
import { getAllPools, getBlockTimestamp } from "./utils";

type TransactionType = "split" | "merge" | "redeem" | "swap" | "lp";

export interface TransactionData {
  marketName: string;
  marketId: string;
  type: TransactionType;
  blockNumber: number;
  collateral: Address;
  collateralSymbol?: string;
  timestamp?: number;
  transactionHash?: string;

  // split/mint/merge
  amount?: string;
  payout?: string;

  // swap
  tokenIn?: string;
  tokenOut?: string;
  tokenInSymbol?: string;
  tokenOutSymbol?: string;
  amountIn?: string;
  amountOut?: string;
  price?: string;

  //lp
  token0?: string;
  token1?: string;
  token0Symbol?: string;
  token1Symbol?: string;
  amount0?: string;
  amount1?: string;
}

async function getUserEventsByType(
  chainId: SupportedChain,
  type: TransactionType,
  account: string,
  poolIds?: string[],
) {
  const data = getEventFilters(chainId, type, account, poolIds);
  if (!data?.length) return [];
  const startBlock = chainId === gnosis.id ? 36331543 : 20894990;

  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const latestBlock = await provider.getBlockNumber();

  const events = (
    await Promise.all(data.map(({ contract, filter }) => contract.queryFilter(filter, startBlock, latestBlock)))
  ).flat();

  if (type === "swap") {
    return events;
  }
  const results: ethers.providers.TransactionResponse[] = Array(events.length).fill(null);
  const maxAttempts = 50; // Limit the number of attempts
  let attempts = 0;
  let remainingIndices = events.map((_, index) => index);

  while (attempts < maxAttempts && remainingIndices.length > 0) {
    try {
      const eventTransactions = await Promise.allSettled(
        remainingIndices.map((index) => events[index].getTransaction()),
      );
      const newRemainingIndices: number[] = [];
      // Process results
      eventTransactions.forEach((result, batchIndex) => {
        const originalIndex = remainingIndices[batchIndex];
        if (result.status === "fulfilled" && result.value) {
          results[originalIndex] = result.value;
        } else {
          newRemainingIndices.push(originalIndex);
        }
      });

      remainingIndices = newRemainingIndices;
      // If all succeeded, break early
      if (remainingIndices.length === 0) {
        break;
      }

      attempts++;
    } catch (error) {
      attempts++;
    }
    await new Promise((resolve) => setTimeout(resolve, 500)); //wait 500ms between attempts;
  }
  const userEvents = events.reduce(
    (acc, curr: ethers.Event, index) => {
      const transaction = results[index];
      if (isTwoStringsEqual(transaction?.from, account)) {
        acc.push({ ...curr, transaction });
      }
      return acc;
    },
    [] as (ethers.Event & { transaction?: ethers.providers.TransactionResponse })[],
  );
  return userEvents;
}

function getEventFilters(chainId: SupportedChain, type: TransactionType, account: string, poolIds?: string[]) {
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  switch (type) {
    case "split": {
      const contract = new ethers.Contract(conditionalTokensAddress[chainId], conditionalTokensAbi, provider);
      const filter = contract.filters.PositionSplit(getRouterAddress(chainId));
      return [{ contract, filter }];
    }
    case "merge": {
      const contract = new ethers.Contract(conditionalTokensAddress[chainId], conditionalTokensAbi, provider);
      const filter = contract.filters.PositionsMerge(getRouterAddress(chainId));
      return [{ contract, filter }];
    }
    case "redeem": {
      const contract = new ethers.Contract(conditionalTokensAddress[chainId], conditionalTokensAbi, provider);
      const filter = contract.filters.PayoutRedemption(getRouterAddress(chainId));
      return [{ contract, filter }];
    }
    case "swap": {
      if (chainId === gnosis.id && poolIds) {
        return poolIds.map((x) => {
          const contract = new ethers.Contract(x, algebraPoolAbi, provider);
          return {
            contract,
            filter: contract.filters.Swap(SWAP_ROUTER_ADDRESS, account),
          };
        });
      }
      if (chainId === mainnet.id && poolIds?.length) {
        return poolIds.map((x) => {
          const contract = new ethers.Contract(x, uniswapPoolAbi, provider);
          return {
            contract,
            filter: contract.filters.Swap(MAINNET_SWAP_ROUTER_ADDRESS, account),
          };
        });
      }
      return;
    }
    case "lp": {
      if (chainId === gnosis.id) {
        const contract = new ethers.Contract(POSITION_MANAGER_ADDRESS, nonfungiblePositionManagerAbi, provider);
        const filter = contract.filters.IncreaseLiquidity();
        return [{ contract, filter }];
      }
      if (chainId === mainnet.id && poolIds?.length) {
        return poolIds.map((x) => {
          const contract = new ethers.Contract(x, uniswapPoolAbi, provider);
          return {
            contract,
            filter: contract.filters.Mint(null, BUNNI_HUB_ADDRESS),
          };
        });
      }
      return;
    }
  }
}

async function getTransactions(account?: string, chainId?: SupportedChain) {
  if (!chainId || !account) return;

  const markets = await fetchMarkets(chainId);

  const marketAddressToMarket = markets.reduce(
    (acc, curr) => {
      acc[curr.id.toLocaleLowerCase()] = curr;
      return acc;
    },
    {} as { [key: string]: Market },
  );
  const conditionIdToMarketMapping = markets.reduce(
    (acc, curr) => {
      acc[curr.conditionId.toLocaleLowerCase()] = curr;
      return acc;
    },
    {} as { [key: string]: Market },
  );

  const tokenPairToMarketMapping = markets.reduce(
    (acc, curr) => {
      const collateral = marketAddressToMarket[curr.parentMarket.toLocaleLowerCase()]
        ? marketAddressToMarket[curr.parentMarket.toLocaleLowerCase()].wrappedTokens[Number(curr.parentOutcome)]
        : COLLATERAL_TOKENS[chainId].primary.address;
      for (const outcomeToken of curr.wrappedTokens) {
        const key =
          collateral.toLocaleLowerCase() > outcomeToken.toLocaleLowerCase()
            ? `${outcomeToken.toLocaleLowerCase()}-${collateral.toLocaleLowerCase()}`
            : `${collateral.toLocaleLowerCase()}-${outcomeToken.toLocaleLowerCase()}`;
        acc[key] = curr;
      }
      return acc;
    },
    {} as { [key: string]: Market },
  );

  const marketIdToCollateral = markets.reduce(
    (acc, curr) => {
      const collateral = marketAddressToMarket[curr.parentMarket.toLocaleLowerCase()]
        ? marketAddressToMarket[curr.parentMarket.toLocaleLowerCase()].wrappedTokens[Number(curr.parentOutcome)]
        : COLLATERAL_TOKENS[chainId].primary.address;
      acc[curr.id.toLocaleLowerCase()] = collateral;
      return acc;
    },
    {} as { [key: string]: Address },
  );

  const outcomeTokenToCollateral = markets.reduce(
    (acc, curr) => {
      const collateral = marketAddressToMarket[curr.parentMarket.toLocaleLowerCase()]
        ? marketAddressToMarket[curr.parentMarket.toLocaleLowerCase()].wrappedTokens[Number(curr.parentOutcome)]
        : COLLATERAL_TOKENS[chainId].primary.address;
      for (const outcomeToken of curr.wrappedTokens) {
        acc[outcomeToken.toLocaleLowerCase()] = collateral;
      }
      return acc;
    },
    {} as { [key: string]: Address },
  );

  const pools = await getAllPools(
    Object.keys(outcomeTokenToCollateral).map((x) => {
      return {
        tokenId: x,
        parentTokenId: outcomeTokenToCollateral[x],
      };
    }),
    chainId,
  );
  const poolIdToPoolMapping = pools.reduce(
    (acc, curr) => {
      acc[curr.id.toLocaleLowerCase()] = curr;
      return acc;
    },
    {} as {
      [key: string]: {
        id: string;
        token0: { id: string };
        token1: { id: string };
        token0Price: string;
        token1Price: string;
      };
    },
  );
  const poolIds = pools.map((x) => x.id);

  const allTokensIds = markets.reduce((acc, market) => {
    for (let i = 0; i < market.wrappedTokens.length; i++) {
      const tokenId = market.wrappedTokens[i].toLocaleLowerCase() as Address;
      acc.push(tokenId);
    }
    return acc;
  }, [] as Address[]);
  const transactionTypes = ["split", "merge", "redeem", "swap", "lp"] as const;
  const historyTransactions = await Promise.all(
    transactionTypes.map(async (type) => {
      let userEvents: (ethers.Event & {
        transaction?: ethers.providers.TransactionResponse;
      })[] = [];
      try {
        userEvents = await getUserEventsByType(chainId, type, account, poolIds);
      } catch (e) {}
      switch (type) {
        case "split":
        case "merge": {
          return userEvents.reduce((acc, event) => {
            const market = conditionIdToMarketMapping[event.args?.conditionId?.toLocaleLowerCase()];
            if (market) {
              acc.push({
                marketName: market.marketName,
                marketId: market.id,
                amount: event.args?.amount?.toString(),
                type,
                blockNumber: event.blockNumber,
                collateral: marketIdToCollateral[market.id.toLocaleLowerCase()],
                transactionHash: event.transaction?.hash,
              });
            }
            return acc;
          }, [] as TransactionData[]);
        }
        case "redeem": {
          return userEvents.reduce((acc, event) => {
            const market = conditionIdToMarketMapping[event.args?.conditionId?.toLocaleLowerCase()];
            if (market) {
              acc.push({
                marketName: market.marketName,
                marketId: market.id,
                payout: event.args?.payout?.toString(),
                type,
                blockNumber: event.blockNumber,
                collateral: marketIdToCollateral[market.id.toLocaleLowerCase()],
                transactionHash: event.transaction?.hash,
              });
            }
            return acc;
          }, [] as TransactionData[]);
        }
        case "swap": {
          return userEvents.reduce((acc, event) => {
            const pool = poolIdToPoolMapping[event.address.toLocaleLowerCase()];
            const tokenIn = BigInt(event.args?.amount1 ?? 0n) < 0 ? pool.token0.id : pool.token1.id;
            const tokenOut = BigInt(event.args?.amount1 ?? 0n) < 0 ? pool.token1.id : pool.token0.id;
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
                amountIn:
                  tokenIn.toLocaleLowerCase() > tokenOut.toLocaleLowerCase()
                    ? event.args?.amount1?.toString()?.replace("-", "")
                    : event.args?.amount0?.toString()?.replace("-", ""),
                amountOut:
                  tokenIn.toLocaleLowerCase() > tokenOut.toLocaleLowerCase()
                    ? event.args?.amount0?.toString()?.replace("-", "")
                    : event.args?.amount1?.toString()?.replace("-", ""),
                price: event.args?.price,
                blockNumber: event.blockNumber,
                marketName: market.marketName,
                marketId: market.id,
                type,
                collateral: marketIdToCollateral[market.id.toLocaleLowerCase()],
                transactionHash: event.transactionHash,
              });
            }
            return acc;
          }, [] as TransactionData[]);
        }
        case "lp": {
          return userEvents.reduce((acc, event) => {
            const poolAddress = chainId === gnosis.id ? event.args?.pool : event.address;
            if (!poolAddress) return acc;
            const pool = poolIdToPoolMapping[poolAddress.toLocaleLowerCase()];
            const token0 = pool.token0.id;
            const token1 = pool.token1.id;
            const market = tokenPairToMarketMapping[`${token0.toLocaleLowerCase()}-${token1.toLocaleLowerCase()}`];
            if (market) {
              acc.push({
                token0,
                token1,
                amount0: event.args?.amount0?.toString(),
                amount1: event.args?.amount1?.toString(),
                blockNumber: event.blockNumber,
                marketName: market.marketName,
                marketId: market.id,
                type,
                collateral: marketIdToCollateral[market.id.toLocaleLowerCase()],
                transactionHash: event.transaction?.hash,
              });
            }
            return acc;
          }, [] as TransactionData[]);
        }
        default: {
          return [];
        }
      }
    }),
  );
  let data = historyTransactions.flat();

  //get token symbols
  const allTokensSymbols = (await readContracts(config, {
    contracts: allTokensIds.map((tokenId) => ({
      abi: erc20Abi,
      address: tokenId,
      functionName: "symbol",
      args: [],
    })),
    allowFailure: false,
  })) as string[];

  const tokenIdToTokenSymbolMapping = allTokensIds.reduce(
    (acc, curr, index) => {
      acc[curr] = allTokensSymbols[index];
      return acc;
    },
    {} as { [key: string]: string },
  );

  // get timestamp
  const timestamps = await Promise.all(data.map((x) => getBlockTimestamp(x.blockNumber)));
  data = data.map((x, index) => {
    function parseSymbol(tokenAddress?: string) {
      if (!tokenAddress) return;
      return isTwoStringsEqual(tokenAddress, COLLATERAL_TOKENS[chainId!].primary.address)
        ? "sDAI"
        : tokenIdToTokenSymbolMapping[tokenAddress.toLocaleLowerCase()];
    }
    return {
      ...x,
      collateralSymbol: parseSymbol(x.collateral),
      timestamp: timestamps[index],
      token0Symbol: parseSymbol(x.token0),
      token1Symbol: parseSymbol(x.token1),
      tokenInSymbol: parseSymbol(x.tokenIn),
      tokenOutSymbol: parseSymbol(x.tokenOut),
    };
  });

  return data.sort((a, b) => b.blockNumber - a.blockNumber);
}

export const useHistoryTransactions = (address: Address, chainId: SupportedChain) => {
  return useQuery<TransactionData[] | undefined, Error>({
    enabled: !!address,
    queryKey: ["useHistoryTransactions", address, chainId],
    gcTime: 1000 * 60 * 60 * 24, //24 hours
    staleTime: 0,
    retry: false,
    queryFn: async () => getTransactions(address, chainId),
  });
};
