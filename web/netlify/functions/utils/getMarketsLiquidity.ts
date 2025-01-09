import { getBalance } from "@wagmi/core";
import pLimit from "p-limit";
import { formatUnits, zeroAddress } from "viem";
import { getDexScreenerPriceUSD, getMarketPoolsPairs } from "./common.ts";
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
  id: string;
  token0: { id: string };
  token1: { id: string };
  token0Price: string;
  token1Price: string;
  balance0: number;
  balance1: number;
  isToken0Collateral: boolean;
  chainId: number;
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
        }
        token1 {
          id
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
    const pools = json?.data?.pools ?? [];
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
    acc[curr.toString()] = sDaiPriceByChain[index];
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

type sDaiLiquidityMapping = Record<Address, number>;

function getSimpleTokenToLiquidityMapping(
  simpleTokenPools: Pool[],
  sDaiPriceByChainMapping: sDaiPriceByChain,
): sDaiLiquidityMapping {
  const res = simpleTokenPools.reduce((acc, curr) => {
    const tokenPriceInSDai = curr.isToken0Collateral ? Number(curr.token0Price) : Number(curr.token1Price);
    const [balanceToken, balanceCollateral] = curr.isToken0Collateral
      ? [curr.balance1, curr.balance0]
      : [curr.balance0, curr.balance1];
    const liquidity =
      (tokenPriceInSDai * balanceToken + balanceCollateral) *
      (sDaiPriceByChainMapping[curr.chainId.toString()] ?? 1.13);
    acc[curr.isToken0Collateral ? curr.token1.id : curr.token0.id] = liquidity;
    return acc;
  }, {});

  return res;
}

function getConditionalTokenToLiquidityMapping(
  conditionalTokenPools: Pool[],
  simpleTokenToLiquidityMapping: sDaiLiquidityMapping,
  sDaiPriceByChainMapping: sDaiPriceByChain,
): sDaiLiquidityMapping {
  return conditionalTokenPools.reduce((acc, curr) => {
    const relativePrice = curr.isToken0Collateral ? Number(curr.token0Price) : Number(curr.token1Price);
    const tokenPriceInSDai =
      relativePrice *
      (simpleTokenToLiquidityMapping[curr.isToken0Collateral ? curr.token0.id : curr.token1.id]?.tokenPriceInSDai ||
        1 / curr.outcomesCountWithoutInvalid);
    const [balanceToken, balanceCollateral] = curr.isToken0Collateral
      ? [curr.balance1, curr.balance0]
      : [curr.balance0, curr.balance1];
    const liquidity =
      (tokenPriceInSDai * balanceToken + balanceCollateral) *
      (sDaiPriceByChainMapping[curr.chainId.toString()] ?? 1.13);
    acc[curr.isToken0Collateral ? curr.token1.id : curr.token0.id] = liquidity;
    return acc;
  }, {});
}

function getFutarchyTokenToLiquidityMapping(
  futarchyTokenPools: Pool[],
  futarchyCollateralsByChainMapping: FutarchyCollateralsPriceMapping,
): sDaiLiquidityMapping {
  return futarchyTokenPools.reduce((acc, curr) => {
    // Determine which collateral token (1 or 2) corresponds to token0 based on the wrapped token indices
    // For futarchy markets: wrappedTokens[0] and [2] use collateralToken1, while [1] and [3] use collateralToken2
    const collaterals =
      curr.market.wrappedTokens[0] === curr.token0.id || curr.market.wrappedTokens[2] === curr.token0.id
        ? [curr.market.collateralToken1, curr.market.collateralToken2]
        : [curr.market.collateralToken2, curr.market.collateralToken1];
    // count 50% of liquidity for both sides
    acc[curr.token0.id] =
      (curr.balance0 / 2) * futarchyCollateralsByChainMapping[curr.chainId.toString()][collaterals[0]];
    acc[curr.token1.id] =
      (curr.balance1 / 2) * futarchyCollateralsByChainMapping[curr.chainId.toString()][collaterals[1]];
    return acc;
  }, {});
}

export async function getMarketsLiquidity(markets: Market[]): Promise<Record<Address, number>> {
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

  const simpleTokenPools: Pool[] = (
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

  const simpleTokenToLiquidityMapping = getSimpleTokenToLiquidityMapping(simpleTokenPools, sDaiPriceByChainMapping);
  const conditionalTokenToLiquidityMapping = getConditionalTokenToLiquidityMapping(
    conditionalTokenPools,
    simpleTokenToLiquidityMapping,
    sDaiPriceByChainMapping,
  );
  const futarchyTokenToLiquidityMapping = getFutarchyTokenToLiquidityMapping(
    futarchyTokenPools,
    futarchyCollateralsByChainMapping,
  );

  const tokenToLiquidityMapping = {
    ...simpleTokenToLiquidityMapping,
    ...conditionalTokenToLiquidityMapping,
    ...futarchyTokenToLiquidityMapping,
  };

  const liquidityToMarketMapping = markets.reduce((acc, market) => {
    let totalLiquidity = 0;
    for (const outcomeToken of market.wrappedTokens) {
      totalLiquidity += tokenToLiquidityMapping[outcomeToken.toLowerCase()] ?? 0;
    }
    acc[market.id] = totalLiquidity;
    return acc;
  }, {});

  return liquidityToMarketMapping;
}
