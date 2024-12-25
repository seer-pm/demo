import { getBalance } from "@wagmi/core";
import pLimit from "p-limit";
import { formatUnits } from "viem";
import { isTwoStringsEqual } from "./common.ts";
import { COLLATERAL_TOKENS, NATIVE_TOKEN, SupportedChain, chainIds, config } from "./config.ts";
import { POOL_SUBGRAPH_URLS } from "./constants.ts";
import { Address, Market } from "./types.ts";

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
}

export async function fetchBestPoolPerPair(market: Market, tokenPair: string[], isToken0Collateral: boolean) {
  try {
    const chainId = market.chainId.toString();
    const query = `{
      pools(first: 1000, where: { token0: "${tokenPair[0].toLocaleLowerCase()}", token1: "${tokenPair[1].toLocaleLowerCase()}" }) {
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
      balance0: Number(poolBalances[index].balance0),
      balance1: Number(poolBalances[index].balance1),
      isToken0Collateral,
      chainId: Number(chainId),
      outcomesCountWithoutInvalid: market.wrappedTokens.length - 1,
    })) as Pool[];
    poolWithBalances.sort((a, b) => (isToken0Collateral ? b.balance0 - a.balance0 : b.balance1 - a.balance1));
    return poolWithBalances[0];
  } catch (e) {
    console.log(e);
  }
}

async function fetchMarketPools(market: Market, collateralTokenAddress: string) {
  return await Promise.all(
    market.wrappedTokens.map((outcomeToken) => {
      const isToken0Collateral = outcomeToken.toLocaleLowerCase() > collateralTokenAddress.toLocaleLowerCase();
      const tokenPair = isToken0Collateral
        ? [collateralTokenAddress, outcomeToken]
        : [outcomeToken, collateralTokenAddress];
      return fetchBestPoolPerPair(market, tokenPair, isToken0Collateral);
    }),
  );
}

export async function getMarketsLiquidity(markets: Market[]) {
  const marketIdToMarketMapping = markets.reduce(
    (acc, curr) => {
      acc[curr.id] = curr;
      return acc;
    },
    {} as { [key: string]: Market },
  );
  const limit = pLimit(20);
  const allPossiblePools = (
    await Promise.all(
      markets.map((market) => {
        const parentMarket = marketIdToMarketMapping[market.parentMarket.id];
        const parentCollateral = parentMarket?.wrappedTokens?.[Number(market.parentOutcome)];
        const collateralToken = parentCollateral || COLLATERAL_TOKENS[market.chainId].primary.address;
        return limit(() => fetchMarketPools(market, collateralToken));
      }),
    )
  )
    .flat()
    .filter((x) => x) as Pool[];
  const [simpleTokenPools, conditionalTokenPools] = allPossiblePools.reduce(
    (acc, curr) => {
      const isSimpleToken = curr.isToken0Collateral
        ? isTwoStringsEqual(curr.token0.id, COLLATERAL_TOKENS[curr.chainId].primary.address)
        : isTwoStringsEqual(curr.token1.id, COLLATERAL_TOKENS[curr.chainId].primary.address);
      acc[isSimpleToken ? 0 : 1].push(curr);
      return acc;
    },
    [[], []] as Pool[][],
  );
  let sDaiPriceByChain: number[] = [];
  try {
    sDaiPriceByChain = await Promise.all(
      chainIds.map(async (chainId) => {
        const data = await fetch(
          `https://api.dexscreener.com/latest/dex/tokens/${COLLATERAL_TOKENS[chainId].primary.address}`,
        ).then((res) => res.json());
        const priceString = data.pairs.find(
          (x) => x.chainId === { 1: "ethereum", 100: "gnosischain" }[chainId],
        )?.priceUsd;
        return priceString ? Number(priceString) : 1.13;
      }),
    );
  } catch (e) {
    sDaiPriceByChain = Array(chainIds.length).fill(1.13);
  }
  const sDaiPriceByChainMapping = chainIds.reduce((acc, curr, index) => {
    acc[curr.toString()] = sDaiPriceByChain[index];
    return acc;
  }, {});
  const simpleTokenToLiquidityMapping = simpleTokenPools.reduce((acc, curr) => {
    const tokenPriceInSDai = curr.isToken0Collateral ? Number(curr.token0Price) : Number(curr.token1Price);
    const [balanceToken, balanceCollateral] = curr.isToken0Collateral
      ? [curr.balance1, curr.balance0]
      : [curr.balance0, curr.balance1];
    const liquidity =
      (tokenPriceInSDai * balanceToken + balanceCollateral) *
      (sDaiPriceByChainMapping[curr.chainId.toString()] ?? 1.13);
    acc[curr.isToken0Collateral ? curr.token1.id : curr.token0.id] = {
      liquidity,
      tokenPriceInSDai,
    };
    return acc;
  }, {});
  const conditionalTokenToLiquidityMapping = conditionalTokenPools.reduce((acc, curr) => {
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
    acc[curr.isToken0Collateral ? curr.token1.id : curr.token0.id] = {
      tokenPriceInSDai,
      liquidity,
    };
    return acc;
  }, {});

  const tokenToLiquidityMapping = {
    ...simpleTokenToLiquidityMapping,
    ...conditionalTokenToLiquidityMapping,
  };

  const liquidityToMarketMapping = markets.reduce((acc, market) => {
    let totalLiquidity = 0;
    for (const outcomeToken of market.wrappedTokens) {
      totalLiquidity += tokenToLiquidityMapping[outcomeToken.toLowerCase()]?.liquidity ?? 0;
    }
    acc[market.id] = totalLiquidity;
    return acc;
  }, {});
  return liquidityToMarketMapping;
}
