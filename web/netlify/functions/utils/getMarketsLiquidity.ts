import { getBalance } from "@wagmi/core";
import pLimit from "p-limit";
import { formatUnits, zeroAddress } from "viem";
import { getCollateralByIndex, getDexScreenerPriceUSD, getMarketPoolsPairs } from "./common.ts";
import { COLLATERAL_TOKENS, NATIVE_TOKEN, SupportedChain, chainIds, config } from "./config.ts";
import { POOL_SUBGRAPH_URLS } from "./constants.ts";
import { Address, Market, Token0Token1 } from "./types.ts";

export async function fetchTokenBalance(token: Address, owner: Address, chainId: SupportedChain) {
  return (
    await getBalance(config, {
      address: owner,
      token: token.toLowerCase() === NATIVE_TOKEN ? undefined : token,
      chainId,
    })
  ).value;
}

interface Pool {
  id: Address;
  token0: { id: Address; symbol: string };
  token1: { id: Address; symbol: string };
  token0Price: string;
  token1Price: string;
  balance0: number;
  balance1: number;
  isToken0Collateral: boolean;
  chainId: SupportedChain;
  outcomesCountWithoutInvalid: number;
  market: Market;
}

export async function fetchBestPoolPerPair(market: Market, tokenPair: Token0Token1) {
  try {
    const chainId = market.chainId.toString();
    const query = `{
      pools(first: 1000, where: { token0: "${tokenPair.token0}", token1: "${tokenPair.token1}" }) {
        id
        token0 {
          id
          symbol
        }
        token1 {
          id
          symbol
        }
        token0Price
        token1Price
      }
    }`;
    const results = await fetch(POOL_SUBGRAPH_URLS[chainId]!, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
      }),
    });
    const json = await results.json();
    const pools = (json?.data?.pools ?? []) as Pool[];

    const poolBalances = await Promise.all(
      pools.map(async ({ id, token0, token1 }) => {
        const balance0BigInt = await fetchTokenBalance(token0.id, id, Number(chainId) as SupportedChain);
        const balance1BigInt = await fetchTokenBalance(token1.id, id, Number(chainId) as SupportedChain);
        return {
          balance0: Number(formatUnits(balance0BigInt, 18)).toFixed(4),
          balance1: Number(formatUnits(balance1BigInt, 18)).toFixed(4),
        };
      }),
    );

    const poolWithBalances = pools.map((pool, index) => ({
      ...pool,
      market,
      balance0: Number(poolBalances[index].balance0),
      balance1: Number(poolBalances[index].balance1),
      // For generic markets, isToken0Collateral indicates whether token0 is the market's collateral token.
      // For futarchy markets, this flag is unused since they have two collateral tokens.
      isToken0Collateral: tokenPair.token0 === market.collateralToken,
      chainId: Number(chainId),
      outcomesCountWithoutInvalid: market.wrappedTokens.length - 1,
    })) as Pool[];
    poolWithBalances.sort((a, b) => (a.isToken0Collateral ? b.balance0 - a.balance0 : b.balance1 - a.balance1));
    return poolWithBalances[0];
  } catch (e) {
    console.log(e);
  }
}

async function fetchMarketPools(market: Market) {
  return await Promise.all(
    getMarketPoolsPairs(market).map((poolPair) => {
      return fetchBestPoolPerPair(market, poolPair);
    }),
  );
}

type sDaiPriceByChain = Record<SupportedChain, number>;

async function getsDaiPriceByChainMapping(): Promise<sDaiPriceByChain> {
  let sDaiPriceByChain: number[] = [];
  try {
    sDaiPriceByChain = await Promise.all(
      chainIds.map(async (chainId) => {
        return getDexScreenerPriceUSD(COLLATERAL_TOKENS[chainId].primary.address, chainId) || 1.13;
      }),
    );
  } catch (e) {
    sDaiPriceByChain = Array(chainIds.length).fill(1.13);
  }
  return chainIds.reduce((acc, curr, index) => {
    acc[curr] = sDaiPriceByChain[index];
    return acc;
  }, {} as sDaiPriceByChain);
}

type FutarchyCollateralsPriceMapping = Record<string, Record<string, number>>;

async function getFutarchyCollateralsByChainMapping(markets: Market[]): Promise<FutarchyCollateralsPriceMapping> {
  const futarchyCollateralsByChain = markets.reduce(
    (acc, market) => {
      const chainId = market.chainId.toString();
      if (!acc[chainId]) {
        acc[chainId] = new Set();
      }
      acc[chainId].add(market.collateralToken1);
      acc[chainId].add(market.collateralToken2);
      return acc;
    },
    {} as Record<string, Set<string>>,
  );

  const priceMapping: FutarchyCollateralsPriceMapping = {};

  await Promise.all(
    Object.entries(futarchyCollateralsByChain).map(async ([chainId, collaterals]) => {
      priceMapping[chainId] = {};
      await Promise.all(
        Array.from(collaterals).map(async (collateral) => {
          priceMapping[chainId][collateral] =
            (await getDexScreenerPriceUSD(collateral as Address, Number(chainId) as SupportedChain)) || 0;
        }),
      );
    }),
  );

  return priceMapping;
}

type TokenLiquidityBalanceInfo = {
  token0: { symbol: string; balance: number };
  token1: { symbol: string; balance: number };
};

type TokenLiquidityMapping = Record<
  Address,
  {
    liquidity: number;
    tokenBalanceInfo: TokenLiquidityBalanceInfo;
  }
>;

type GenericTokenLiquidityMapping = Record<
  Address,
  {
    liquidity: number;
    tokenBalanceInfo: TokenLiquidityBalanceInfo;
    tokenPriceInSDai: number;
  }
>;

function getGenericTokenToLiquidityMapping(
  genericTokenPools: Pool[],
  sDaiPriceByChainMapping: sDaiPriceByChain,
): GenericTokenLiquidityMapping {
  const res = genericTokenPools.reduce((acc, curr) => {
    const tokenPriceInSDai = curr.isToken0Collateral ? Number(curr.token0Price) : Number(curr.token1Price);
    const [balanceToken, balanceCollateral] = curr.isToken0Collateral
      ? [curr.balance1, curr.balance0]
      : [curr.balance0, curr.balance1];
    const liquidity =
      (tokenPriceInSDai * balanceToken + balanceCollateral) * (sDaiPriceByChainMapping[curr.chainId] ?? 1.13);
    acc[curr.isToken0Collateral ? curr.token1.id : curr.token0.id] = {
      liquidity,
      tokenPriceInSDai,
      tokenBalanceInfo: {
        token0: { symbol: curr.token0.symbol, balance: curr.balance0 },
        token1: { symbol: curr.token1.symbol, balance: curr.balance1 },
      },
    };
    return acc;
  }, {} as GenericTokenLiquidityMapping);

  return res;
}

function getConditionalTokenToLiquidityMapping(
  conditionalTokenPools: Pool[],
  genericTokenToLiquidityMapping: GenericTokenLiquidityMapping,
  sDaiPriceByChainMapping: sDaiPriceByChain,
): TokenLiquidityMapping {
  return conditionalTokenPools.reduce((acc, curr) => {
    const relativePrice = curr.isToken0Collateral ? Number(curr.token0Price) : Number(curr.token1Price);
    const tokenPriceInSDai =
      relativePrice *
      (genericTokenToLiquidityMapping[curr.isToken0Collateral ? curr.token0.id : curr.token1.id]?.tokenPriceInSDai ||
        1 / curr.outcomesCountWithoutInvalid);
    const [balanceToken, balanceCollateral] = curr.isToken0Collateral
      ? [curr.balance1, curr.balance0]
      : [curr.balance0, curr.balance1];
    const liquidity =
      (tokenPriceInSDai * balanceToken + balanceCollateral) * (sDaiPriceByChainMapping[curr.chainId] ?? 1.13);
    acc[curr.isToken0Collateral ? curr.token1.id : curr.token0.id] = {
      liquidity,
      tokenBalanceInfo: {
        token0: { symbol: curr.token0.symbol, balance: curr.balance0 },
        token1: { symbol: curr.token1.symbol, balance: curr.balance1 },
      },
    };
    return acc;
  }, {} as TokenLiquidityMapping);
}

function getFutarchyTokenToLiquidityMapping(
  futarchyTokenPools: Pool[],
  futarchyCollateralsByChainMapping: FutarchyCollateralsPriceMapping,
): TokenLiquidityMapping {
  return futarchyTokenPools.reduce((acc, curr) => {
    // Determine which collateral token (1 or 2) corresponds to token0 based on the wrapped token indices
    // For futarchy markets: wrappedTokens[0] and [2] use collateralToken1, while [1] and [3] use collateralToken2
    const collaterals =
      curr.market.wrappedTokens[0] === curr.token0.id || curr.market.wrappedTokens[2] === curr.token0.id
        ? [curr.market.collateralToken1, curr.market.collateralToken2]
        : [curr.market.collateralToken2, curr.market.collateralToken1];
    // count 50% of liquidity for both sides
    acc[curr.token0.id] = {
      liquidity: (curr.balance0 / 2) * futarchyCollateralsByChainMapping[curr.chainId.toString()][collaterals[0]],
      tokenBalanceInfo: {
        token0: { symbol: curr.token0.symbol, balance: curr.balance0 },
        token1: { symbol: curr.token1.symbol, balance: curr.balance1 },
      },
    };
    acc[curr.token1.id] = {
      liquidity: (curr.balance1 / 2) * futarchyCollateralsByChainMapping[curr.chainId.toString()][collaterals[1]],
      tokenBalanceInfo: {
        token0: { symbol: curr.token0.symbol, balance: curr.balance0 },
        token1: { symbol: curr.token1.symbol, balance: curr.balance1 },
      },
    };
    return acc;
  }, {} as TokenLiquidityMapping);
}

export type LiquidityToMarketMapping = Record<
  `0x${string}`,
  {
    totalLiquidity: number;
    poolBalance: Array<TokenLiquidityBalanceInfo | null>;
  }
>;

export async function getMarketsLiquidity(markets: Market[]): Promise<LiquidityToMarketMapping> {
  const limit = pLimit(20);

  const marketGroups = markets.reduce(
    (acc, market) => {
      if (market.type === "Generic") {
        market.parentMarket.id === zeroAddress ? acc.genericMarkets.push(market) : acc.conditionalMarkets.push(market);
      } else if (market.type === "Futarchy") {
        acc.futarchyMarkets.push(market);
      }
      return acc;
    },
    { genericMarkets: [], conditionalMarkets: [], futarchyMarkets: [] } as {
      genericMarkets: Market[];
      conditionalMarkets: Market[];
      futarchyMarkets: Market[];
    },
  );

  const genericTokenPools: Pool[] = (
    await Promise.all(marketGroups.genericMarkets.map((market) => limit(() => fetchMarketPools(market))))
  )
    .flat()
    .filter((pool): pool is Pool => pool !== undefined);

  const conditionalTokenPools: Pool[] = (
    await Promise.all(marketGroups.conditionalMarkets.map((market) => limit(() => fetchMarketPools(market))))
  )
    .flat()
    .filter((pool): pool is Pool => pool !== undefined);

  const futarchyTokenPools: Pool[] = (
    await Promise.all(marketGroups.futarchyMarkets.map((market) => limit(() => fetchMarketPools(market))))
  )
    .flat()
    .filter((pool): pool is Pool => pool !== undefined);

  const sDaiPriceByChainMapping = await getsDaiPriceByChainMapping();

  const futarchyCollateralsByChainMapping = await getFutarchyCollateralsByChainMapping(marketGroups.futarchyMarkets);

  const genericTokenToLiquidityMapping = getGenericTokenToLiquidityMapping(genericTokenPools, sDaiPriceByChainMapping);
  const conditionalTokenToLiquidityMapping = getConditionalTokenToLiquidityMapping(
    conditionalTokenPools,
    genericTokenToLiquidityMapping,
    sDaiPriceByChainMapping,
  );
  const futarchyTokenToLiquidityMapping = getFutarchyTokenToLiquidityMapping(
    futarchyTokenPools,
    futarchyCollateralsByChainMapping,
  );

  const tokenToLiquidityMapping: TokenLiquidityMapping = {
    ...genericTokenToLiquidityMapping,
    ...conditionalTokenToLiquidityMapping,
    ...futarchyTokenToLiquidityMapping,
  };

  const liquidityToMarketMapping: LiquidityToMarketMapping = markets.reduce((acc, market) => {
    let totalLiquidity = 0;
    const tokenBalanceInfo: (TokenLiquidityBalanceInfo | null)[] = [];
    for (const outcomeToken of market.wrappedTokens) {
      const data = tokenToLiquidityMapping[outcomeToken.toLowerCase() as `0x${string}`];
      totalLiquidity += data?.liquidity ?? 0;
      tokenBalanceInfo.push(data?.tokenBalanceInfo || null);
    }
    if (!acc[market.id]) {
      acc[market.id] = { totalLiquidity: 0, poolBalance: [] };
    }
    acc[market.id].totalLiquidity = totalLiquidity;
    acc[market.id].poolBalance = getMarketPoolsPairs(market).map((poolPair, i) => {
      if (market.type === "Futarchy") {
        // we have the same data for token0 and token1 on tokenToLiquidityMapping
        return tokenToLiquidityMapping[poolPair.token0]?.tokenBalanceInfo || null;
      }

      // for generic markets we need to return data for the outcome token
      const collateral = getCollateralByIndex(market, i);
      const outcomeToken = collateral === poolPair.token0 ? poolPair.token1 : poolPair.token0;

      return tokenToLiquidityMapping[outcomeToken]?.tokenBalanceInfo || null;
    });
    return acc;
  }, {} as LiquidityToMarketMapping);

  return liquidityToMarketMapping;
}
