import { SupportedChain } from "@/lib/chains.ts";
import { COLLATERAL_TOKENS } from "@/lib/config.ts";
import { Market, getCollateralByIndex, getMarketPoolsPairs } from "@/lib/market.ts";
import { Address, zeroAddress } from "viem";
import { getDexScreenerPriceUSD } from "./common.ts";
import { chainIds } from "./config.ts";
import { Pool } from "./fetchPools.ts";

type sDaiPriceByChain = Record<SupportedChain, number>;

export async function getsDaiPriceByChainMapping(): Promise<sDaiPriceByChain> {
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
    const key = (curr.isToken0Collateral ? curr.token1.id : curr.token0.id) as Address;
    // if multiple pool, only use one with the highest collateral
    if (acc[key]) {
      const isCurrCollateralBalanceHigher =
        (curr.isToken0Collateral && curr.balance0 > acc[key].tokenBalanceInfo.token0.balance) ||
        (!curr.isToken0Collateral && curr.balance1 > acc[key].tokenBalanceInfo.token1.balance);
      if (!isCurrCollateralBalanceHigher) {
        return acc;
      }
    }
    acc[key] = {
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
    const relativeTokenPrice = curr.isToken0Collateral ? Number(curr.token0Price) : Number(curr.token1Price);
    const collateralPriceInSDai =
      genericTokenToLiquidityMapping[(curr.isToken0Collateral ? curr.token0.id : curr.token1.id) as Address]
        ?.tokenPriceInSDai || 1 / curr.outcomesCountWithoutInvalid;
    const [balanceToken, balanceCollateral] = curr.isToken0Collateral
      ? [curr.balance1, curr.balance0]
      : [curr.balance0, curr.balance1];
    const liquidity =
      (relativeTokenPrice * balanceToken + balanceCollateral) *
      collateralPriceInSDai *
      (sDaiPriceByChainMapping[curr.chainId] ?? 1.13);
    const key = (curr.isToken0Collateral ? curr.token1.id : curr.token0.id) as Address;
    // if multiple pool, only use one with the highest collateral
    if (acc[key]) {
      const isCurrCollateralBalanceHigher =
        (curr.isToken0Collateral && curr.balance0 > acc[key].tokenBalanceInfo.token0.balance) ||
        (!curr.isToken0Collateral && curr.balance1 > acc[key].tokenBalanceInfo.token1.balance);
      if (!isCurrCollateralBalanceHigher) {
        return acc;
      }
    }
    acc[key] = {
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
    acc[curr.token0.id as Address] = {
      liquidity: (curr.balance0 / 2) * futarchyCollateralsByChainMapping[curr.chainId.toString()][collaterals[0]],
      tokenBalanceInfo: {
        token0: { symbol: curr.token0.symbol, balance: curr.balance0 },
        token1: { symbol: curr.token1.symbol, balance: curr.balance1 },
      },
    };
    acc[curr.token1.id as Address] = {
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

export async function getMarketsLiquidity(markets: Market[], allPools: Pool[]): Promise<LiquidityToMarketMapping> {
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

  const { genericTokenPools, conditionalTokenPools, futarchyTokenPools } = allPools.reduce(
    (acc, curr) => {
      const { market } = curr;
      if (market.type === "Generic") {
        market.parentMarket.id === zeroAddress
          ? acc.genericTokenPools.push(curr)
          : acc.conditionalTokenPools.push(curr);
      } else if (market.type === "Futarchy") {
        acc.futarchyTokenPools.push(curr);
      }
      return acc;
    },
    {
      genericTokenPools: [],
      conditionalTokenPools: [],
      futarchyTokenPools: [],
    } as {
      genericTokenPools: Pool[];
      conditionalTokenPools: Pool[];
      futarchyTokenPools: Pool[];
    },
  );
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
