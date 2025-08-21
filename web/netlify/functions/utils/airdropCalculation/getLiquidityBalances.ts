import { SupportedChain } from "@/lib/chains";
import { COLLATERAL_TOKENS } from "@/lib/config";
import { Token0Token1, getToken0Token1 } from "@/lib/market";
import ethers from "ethers";
import { Address } from "viem";
import { mainnet, optimism } from "wagmi/chains";
import { SUBGRAPHS } from "./constants";

export interface LiquidityEvent {
  id: string;
  token0: {
    id: string;
    symbol: string;
  };
  token1: {
    id: string;
    symbol: string;
  };
  amount0: string;
  amount1: string;
  timestamp: string;
  origin: string;
  type: string;
}

export async function fetchMints(chainId: SupportedChain, tokenPairs: Token0Token1[]) {
  let allMints: LiquidityEvent[] = [];
  let currentTimestamp = undefined;
  while (true) {
    const query: string = `{
          mints(first: 1000, orderBy: timestamp, orderDirection: asc, where: 
            { 
              and: [
                {
                  or: [${tokenPairs.map(
                    (tokenPair) => `{token0: "${tokenPair.token0}", token1: "${tokenPair.token1}"}`,
                  )}]
                }${currentTimestamp ? `,{timestamp_gt: "${currentTimestamp}"}` : ""}
              ]
            }) {
            id
            token0 {
              id
              symbol
            }
            token1 {
              id
              symbol
            }
            amount0
            amount1
            timestamp
            origin
          }
        }`;
    const results = await fetch(
      chainId === mainnet.id || chainId === optimism.id ? SUBGRAPHS["uniswap"][1] : SUBGRAPHS["algebra"][100],
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
        }),
      },
    );
    const json = await results.json();
    if (json.errors?.length) {
      throw json.errors[0].message;
    }
    const mints = json?.data?.mints ?? [];
    allMints = allMints.concat(mints);
    if (mints[mints.length - 1]?.timestamp === currentTimestamp) {
      break;
    }
    if (mints.length < 1000) {
      break; // We've fetched all
    }
    currentTimestamp = mints[mints.length - 1]?.timestamp;
  }
  return allMints.map((x) => ({ ...x, type: "mint" }));
}

export async function fetchBurns(chainId: SupportedChain, tokenPairs: Token0Token1[]) {
  let allBurns: LiquidityEvent[] = [];
  let currentTimestamp = undefined;
  while (true) {
    const query: string = `{
          burns(first: 1000, orderBy: timestamp, orderDirection: asc, where: 
            { 
              and: [
                {
                  or: [${tokenPairs.map(
                    (tokenPair) => `{token0: "${tokenPair.token0}", token1: "${tokenPair.token1}"}`,
                  )}]
                }${currentTimestamp ? `,{timestamp_gt: "${currentTimestamp}"}` : ""}
              ]
            }) {
            id
            token0 {
              id
              symbol
            }
            token1 {
              id
              symbol
            }
            amount0
            amount1
            timestamp
            origin
          }
        }`;
    const results = await fetch(
      chainId === mainnet.id || chainId === optimism.id ? SUBGRAPHS["uniswap"][1] : SUBGRAPHS["algebra"][100],
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
        }),
      },
    );
    const json = await results.json();
    if (json.errors?.length) {
      throw json.errors[0].message;
    }
    const burns = json?.data?.burns ?? [];
    allBurns = allBurns.concat(burns);
    if (burns[burns.length - 1]?.timestamp === currentTimestamp) {
      break;
    }
    if (burns.length < 1000) {
      break; // We've fetched all
    }
    currentTimestamp = burns[burns.length - 1]?.timestamp;
  }
  return allBurns.map((x) => ({ ...x, type: "burn" }));
}

export async function getAllLiquidityEvents(
  chainId: SupportedChain,
  tokenPairs: {
    tokenId: Address;
    parentTokenId?: Address;
  }[],
) {
  const sortedTokenPairs = tokenPairs.map(({ tokenId, parentTokenId }) => {
    const collateral = parentTokenId
      ? parentTokenId.toLocaleLowerCase()
      : COLLATERAL_TOKENS[chainId].primary.address.toLocaleLowerCase();
    return getToken0Token1(tokenId, collateral as Address);
  });
  const mints = await fetchMints(chainId, sortedTokenPairs);
  const burns = await fetchBurns(chainId, sortedTokenPairs);
  return mints.concat(burns);
}

export function getLiquidityBalancesAtTimestamp(events: LiquidityEvent[], timestamp: number) {
  const records = events.filter((event) => Number(event.timestamp) <= timestamp);
  const tokenBalances: { [key: string]: { [key: string]: number } } = {};

  // Process each event
  for (const event of records) {
    const { token0, token1, amount0, amount1, origin } = event;
    // Initialize token balances if not exists
    if (!tokenBalances[origin]) {
      tokenBalances[origin] = {};
    }

    if (event.type === "mint") {
      tokenBalances[origin][token0.id] = (tokenBalances[origin][token0.id] || 0) + Number(amount0);
      tokenBalances[origin][token1.id] = (tokenBalances[origin][token1.id] || 0) + Number(amount1);
    } else {
      tokenBalances[origin][token0.id] = (tokenBalances[origin][token0.id] || 0) - Number(amount0);
      tokenBalances[origin][token1.id] = (tokenBalances[origin][token1.id] || 0) - Number(amount1);
    }
  }

  const formattedBalances: { [key: string]: { [key: string]: number } } = {};
  for (const [user, balances] of Object.entries(tokenBalances)) {
    // Exclude zero address and non-positive balances
    if (user !== ethers.constants.AddressZero) {
      formattedBalances[user] = {};
      for (const [tokenId, balance] of Object.entries(balances)) {
        if (balance > 0) {
          formattedBalances[user][tokenId] = balance;
        }
      }
    }
  }
  return formattedBalances;
}
