import { SupportedChain } from "@/lib/chains";
import { zeroAddress } from "viem";
import { SUBGRAPHS } from "./constants";

export interface SubgraphMarket {
  id: string;
  type: string;
  marketName: string;
  outcomes: string[]; // assuming outcomes is an array of strings
  templateId: string;
  questions: {
    id: string;
  }[];
  collateralToken: string;
  collateralToken1: string;
  collateralToken2: string;
  outcomesSupply: string[]; // assuming array of BigInt strings
  payoutReported: boolean;
  payoutNumerators: string[]; // assuming array of BigInt strings
  parentMarket: {
    id: string;
  };
  parentOutcome: string;
  wrappedTokens: string[]; // assuming array of addresses
  creator: string;
  finalizeTs: string; // often a string (Unix timestamp)
}

export async function fetchSubgraphMarkets(chainId: SupportedChain) {
  const maxAttempts = 20;
  let attempt = 0;
  let allMarkets: SubgraphMarket[] = [];
  let currentId = undefined;
  while (attempt < maxAttempts) {
    const query: string = `{
          markets(first: 1000, orderBy: id, orderDirection: asc${currentId ? `, where: {id_gt: "${currentId}"}` : ""}) {
            id
            type
            marketName
            outcomes
            templateId
            questions {
              id
            }
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
            finalizeTs
          }
        }`;
    const results = await fetch(SUBGRAPHS["seer"][chainId as 1 | 100], {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
      }),
    });
    const json = await results.json();
    if (json.errors?.length) {
      throw json.errors[0].message;
    }
    const markets = json?.data?.markets ?? [];
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
  return allMarkets.map((market) => ({
    ...market,
    parentMarket: market.parentMarket ?? { id: zeroAddress },
  }));
}
