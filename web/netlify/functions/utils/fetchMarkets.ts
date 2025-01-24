import { isUndefined } from "./common.ts";
import { SupportedChain } from "./config.ts";
import { zeroAddress } from "./constants.ts";
import { SUBGRAPHS } from "./subgraph.ts";
import { Market } from "./types.ts";

export async function fetchMarket(marketId: string, chainId: SupportedChain) {
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
      creator
    }
  }`;
  const results = await fetch(SUBGRAPHS.seer[chainId]!, {
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

export async function fetchMarkets(chainId: SupportedChain) {
  const maxAttempts = 20;
  let attempt = 0;
  let allMarkets: Market[] = [];
  let currentId = undefined;
  while (attempt < maxAttempts) {
    const query = `{
          markets(first: 1000, orderBy: id, orderDirection: asc${
            !isUndefined(currentId) ? `, where: {id_gt: "${currentId}"}` : ""
          }) {
            id
            type
            marketName
            outcomes
            collateralToken
            collateralToken1
            collateralToken2
            outcomesSupply
            payoutReported
            payoutNumerators
            parentMarket{
              id
            }
            parentOutcome
            wrappedTokens
            creator
          }
        }`;
    const results = await fetch(SUBGRAPHS.seer[chainId]!, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
      }),
    });
    const json = await results.json();
    const markets = (json?.data?.markets ?? []) as Market[];
    allMarkets = allMarkets.concat(markets);

    if (markets[markets.length - 1]?.id === currentId) {
      break;
    }
    if (markets.length < 1000) {
      break; // We've fetched all markets
    }
    currentId = markets[markets.length - 1]?.id;
    attempt++;
  }
  return allMarkets.map((market: Market) => ({
    ...market,
    parentMarket: market.parentMarket ?? { id: zeroAddress },
  })) as Market[];
}
