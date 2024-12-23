import { SEER_SUBGRAPH_URLS, zeroAddress } from "./constants.ts";

export async function fetchMarket(marketId: string, chainId: string) {
  const query = `{
    market(id: "${marketId.toLocaleLowerCase()}") {
      id
      marketName
      outcomes
      outcomesSupply
      payoutReported
      payoutNumerators
      parentMarket{
        id
      }
      parentOutcome
      wrappedTokens
    }
  }`;
  const results = await fetch(SEER_SUBGRAPH_URLS[chainId]!, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
    }),
  });
  const json = await results.json();
  const market = json?.data?.market;
  return market ? { ...market, parentMarket: market.parentMarket ?? { id: zeroAddress } } : undefined;
}

export async function fetchMarkets(chainId: string) {
  if (!SEER_SUBGRAPH_URLS[chainId]) {
    return [];
  }
  const query = `{
    markets(first: 1000) {
      id
      marketName
      outcomes
      outcomesSupply
      payoutReported
      payoutNumerators
      parentMarket{
        id
      }
      parentOutcome
      wrappedTokens
    }
  }`;
  const results = await fetch(SEER_SUBGRAPH_URLS[chainId], {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
    }),
  });
  const json = await results.json();

  return (
    json?.data?.markets?.map((market) => ({
      ...market,
      parentMarket: market.parentMarket ?? { id: zeroAddress },
    })) ?? []
  );
}
