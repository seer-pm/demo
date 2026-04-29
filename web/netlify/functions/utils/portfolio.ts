import { isTwoStringsEqual, isUndefined } from "@/lib/utils";
import type { SupportedChain } from "@seer-pm/sdk";
import { COLLATERAL_TOKENS, type Market, getCollateralByIndex, getToken0Token1, getTokensPairKey } from "@seer-pm/sdk";
import { type Address, erc20Abi } from "viem";
import { multicall } from "viem/actions";
import { getPublicClientByChainId } from "./config";

export interface MarketDataMapping {
  outcomeTokenToCollateral: Map<Address, Address>;
  conditionIdToMarketMapping: {
    [key: string]: Market;
  };
  allTokensIds: Set<Address>;
  tokenPairToMarketMapping: {
    [key: string]: Market;
  };
  tokenIdToTokenSymbolMapping: {
    [key: string]: string;
  };
}

export interface TransactionData {
  marketName: string;
  marketId: string;
  type: "split" | "merge" | "redeem" | "swap" | "lp" | "lp-burn";
  blockNumber: number;
  collateral: Address;
  collateralSymbol?: string;
  timestamp: number;
  transactionHash?: string;
  amount?: string;
  payout?: string;
  tokenIn?: string;
  tokenOut?: string;
  tokenInSymbol?: string;
  tokenOutSymbol?: string;
  amountIn?: string;
  amountOut?: string;
  price?: string;
  token0?: string;
  token1?: string;
  token0Symbol?: string;
  token1Symbol?: string;
  amount0?: string;
  amount1?: string;
}

export async function getMappings(initialMarkets: Market[], chainId: SupportedChain): Promise<MarketDataMapping> {
  const markets = initialMarkets.filter((x) => x.chainId === chainId);
  const conditionIdToMarketMapping: MarketDataMapping["conditionIdToMarketMapping"] = {};
  const tokenPairToMarketMapping: MarketDataMapping["tokenPairToMarketMapping"] = {};
  const outcomeTokenToCollateral: MarketDataMapping["outcomeTokenToCollateral"] = new Map();
  const allTokensIds: MarketDataMapping["allTokensIds"] = new Set();

  for (const market of markets) {
    conditionIdToMarketMapping[market.conditionId.toLocaleLowerCase()] = market;

    market.wrappedTokens.forEach((outcomeToken, i) => {
      const collateral = getCollateralByIndex(market, i);
      const { token0, token1 } = getToken0Token1(collateral, outcomeToken);
      tokenPairToMarketMapping[getTokensPairKey(token0, token1)] = market;

      outcomeTokenToCollateral.set(outcomeToken.toLocaleLowerCase() as Address, getCollateralByIndex(market, i));
      allTokensIds.add(market.wrappedTokens[i].toLocaleLowerCase() as Address);
      allTokensIds.add(collateral.toLocaleLowerCase() as Address);
    });
  }

  const publicClient = getPublicClientByChainId(chainId);

  const allTokensSymbols = (await multicall(publicClient, {
    contracts: Array.from(allTokensIds.values()).map((tokenId) => ({
      abi: erc20Abi,
      address: tokenId,
      functionName: "symbol",
      args: [],
    })),
    allowFailure: false,
  })) as string[];
  const tokenIdToTokenSymbolMapping = Array.from(allTokensIds.values()).reduce(
    (acc, curr, index) => {
      acc[curr] = allTokensSymbols[index];
      return acc;
    },
    {} as { [key: string]: string },
  );

  return {
    outcomeTokenToCollateral,
    conditionIdToMarketMapping,
    allTokensIds,
    tokenPairToMarketMapping,
    tokenIdToTokenSymbolMapping,
  };
}

export function getTokenPricesMapping(
  positions: { parentMarketId?: string; tokenId: string; collateralToken?: string }[],
  pools: { token0: { id: string }; token1: { id: string }; token0Price: string; token1Price: string }[],
  chainId: SupportedChain,
) {
  const [simpleTokens, conditionalTokens] = positions.reduce(
    (acc, curr) => {
      acc[!isUndefined(curr.parentMarketId) ? 1 : 0].push(curr);
      return acc;
    },
    [[], []] as { parentMarketId?: string; tokenId: string; collateralToken?: string }[][],
  );

  const simpleTokensMapping = simpleTokens.reduce(
    (acc, { tokenId }) => {
      let isTokenPrice0 = true;
      const correctPool = pools.find((pool) => {
        const primaryCollateralAddress = COLLATERAL_TOKENS[chainId].primary.address;
        if (primaryCollateralAddress > tokenId.toLocaleLowerCase()) {
          isTokenPrice0 = false;
          return (
            isTwoStringsEqual(pool.token0.id, tokenId) && isTwoStringsEqual(pool.token1.id, primaryCollateralAddress)
          );
        }
        return (
          isTwoStringsEqual(pool.token1.id, tokenId) && isTwoStringsEqual(pool.token0.id, primaryCollateralAddress)
        );
      });

      acc[tokenId.toLocaleLowerCase()] = correctPool
        ? isTokenPrice0
          ? Number(correctPool.token0Price)
          : Number(correctPool.token1Price)
        : 0;
      return acc;
    },
    {} as { [key: string]: number | undefined },
  );

  const conditionalTokensMapping = conditionalTokens.reduce(
    (acc, { tokenId, collateralToken }) => {
      let isTokenPrice0 = true;
      const correctPool = pools.find((pool) => {
        if (collateralToken!.toLocaleLowerCase() > tokenId.toLocaleLowerCase()) {
          isTokenPrice0 = false;
          return isTwoStringsEqual(pool.token0.id, tokenId) && isTwoStringsEqual(pool.token1.id, collateralToken);
        }
        return isTwoStringsEqual(pool.token1.id, tokenId) && isTwoStringsEqual(pool.token0.id, collateralToken);
      });

      const relativePrice = correctPool
        ? isTokenPrice0
          ? Number(correctPool.token0Price)
          : Number(correctPool.token1Price)
        : 0;

      acc[tokenId.toLocaleLowerCase()] =
        relativePrice * (simpleTokensMapping?.[collateralToken!.toLocaleLowerCase()] || 0);
      return acc;
    },
    {} as { [key: string]: number },
  );

  return { ...simpleTokensMapping, ...conditionalTokensMapping };
}
