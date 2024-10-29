import { SupportedChain } from "@/lib/chains";
import { getRouterAddress } from "@/lib/config";
import { isTwoStringsEqual } from "@/lib/utils";
import { ethers } from "ethers";
import { gnosis } from "viem/chains";
import { conditionalTokensAbi, conditionalTokensAddress } from "../../contracts/generated";
import { MarketDataMapping } from "./getMappings";
import { TransactionData, TransactionType } from "./types";

async function getUserEventsByType(chainId: SupportedChain, type: TransactionType, account: string) {
  const data = getEventFilters(chainId, type);
  if (!data?.length) return [];
  const startBlock = chainId === gnosis.id ? 36331543 : 20894990;

  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const latestBlock = await provider.getBlockNumber();

  const events = (
    await Promise.all(data.map(({ contract, filter }) => contract.queryFilter(filter, startBlock, latestBlock)))
  ).flat();

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

function getEventFilters(chainId: SupportedChain, type: TransactionType) {
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
  }
}

export async function getSplitMergeRedeemEvents(mappings: MarketDataMapping, account: string, chainId: SupportedChain) {
  const { conditionIdToMarketMapping, marketIdToCollateral } = mappings;
  const transactionTypes = ["split", "merge", "redeem"] as const;
  const historyTransactions = await Promise.all(
    transactionTypes.map(async (type) => {
      let userEvents: (ethers.Event & {
        transaction?: ethers.providers.TransactionResponse;
      })[] = [];
      try {
        userEvents = await getUserEventsByType(chainId, type, account);
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

        default: {
          return [];
        }
      }
    }),
  );
  return historyTransactions.flat();
}
