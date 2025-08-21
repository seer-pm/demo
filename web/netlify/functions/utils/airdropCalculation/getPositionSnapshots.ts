import { SupportedChain, mainnet, optimism } from "@/lib/chains";
import { COLLATERAL_TOKENS } from "@/lib/config";
import { Token0Token1, getToken0Token1 } from "@/lib/market";
import { isTwoStringsEqual } from "@/lib/utils";
import ethers, { BigNumber } from "ethers";
import pLimit from "p-limit";
import { Address } from "viem";
import { START_TIME, SUBGRAPHS } from "./constants";

export interface PositionSnapshot {
  position: {
    id: string;
  };
  timestamp: string;
  owner: string;
  depositedToken0: string;
  depositedToken1: string;
  withdrawnToken0: string;
  withdrawnToken1: string;
  pool: {
    token0: {
      id: string;
    };
    token1: {
      id: string;
    };
  };
}

export async function getPositionSnapshotsByTokenPair(chainId: SupportedChain, tokenPair: Token0Token1) {
  let allData: PositionSnapshot[] = [];
  const initialTimestamp = START_TIME[chainId as 1 | 100];
  let currentTimestamp = initialTimestamp;

  const maxRetries = 3;
  let counter = 0;

  while (true) {
    let retries = 0;
    let success = false;
    let positionSnapshots = [];

    while (retries < maxRetries && !success) {
      try {
        const query = `{
                    positionSnapshots(first: 1000, orderBy: timestamp, orderDirection: asc${
                      currentTimestamp
                        ? `, where: {timestamp_gt: ${currentTimestamp}, pool_: {token0: "${tokenPair.token0}", token1: "${tokenPair.token1}"}}`
                        : `, where: {pool_: {token0: "${tokenPair.token0}", token1: "${tokenPair.token1}"}}`
                    }) {
                    position{
                      id
                    }
                    timestamp
                    owner
                    depositedToken0
                    depositedToken1
                    withdrawnToken0
                    withdrawnToken1
                    pool{
                      token0 {
                        id
                      }
                      token1 {
                        id
                      }
                    }
                    }
                }`;

        const results = await fetch(
          chainId === mainnet.id || chainId === optimism.id ? SUBGRAPHS["uniswap"][1] : SUBGRAPHS["algebra"][100],
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ query }),
          },
        );
        if (!results.ok) {
          throw new Error(`HTTP error! status: ${results.status}`);
        }

        const json = await results.json();
        if (json.errors?.length) {
          throw json.errors[0].message;
        }
        positionSnapshots = json?.data?.positionSnapshots ?? [];
        success = true;
        counter++;
      } catch (error) {
        retries++;

        if (retries === maxRetries) {
          throw new Error(`Max retries reached for timestamp ${currentTimestamp}. ${error.message}`);
        }

        // Exponential backoff
        await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** retries));
      }
    }

    allData = allData.concat(positionSnapshots);

    // Break conditions
    if (
      positionSnapshots.length === 0 ||
      positionSnapshots[positionSnapshots.length - 1]?.timestamp === currentTimestamp
    ) {
      break;
    }
    if (positionSnapshots.length < 1000) {
      break; // We've fetched all
    }

    currentTimestamp = positionSnapshots[positionSnapshots.length - 1]?.timestamp;

    // wait 300ms between calls
    await new Promise((res) => setTimeout(res, 300));
  }
  return allData;
}

export async function getPositionSnapshotsByTokenPairs(
  chainId: SupportedChain,
  tokenPairs: { tokenId: Address; parentTokenId?: Address }[],
) {
  const limit = pLimit(50);
  const sortedTokenPairs = tokenPairs.map(({ tokenId, parentTokenId }) => {
    const collateral = parentTokenId
      ? parentTokenId.toLocaleLowerCase()
      : COLLATERAL_TOKENS[chainId].primary.address.toLocaleLowerCase();
    return getToken0Token1(tokenId, collateral as Address);
  });
  const promises = [];
  for (const tokenPair of sortedTokenPairs) {
    promises.push(limit(() => getPositionSnapshotsByTokenPair(chainId, tokenPair)));
  }
  const allData = (await Promise.all(promises)).flat();
  allData.sort((a, b) => Number(a.timestamp) - Number(b.timestamp));
  return allData;
}

export function getLiquidityBalancesByPositionAtTimestamp(positionSnapshots: PositionSnapshot[], timestamp: number) {
  const farmingContract = "0xDe51dDF1aE7d5BBD7bF1A0e40aAA1F6C12579106";
  const uniquePositionsSnapshotsMapping = positionSnapshots.reduce(
    (acc, snapshot) => {
      const currentPositionTimestamp = acc[snapshot.position.id]?.timestamp;
      if (
        !currentPositionTimestamp ||
        (Number(snapshot.timestamp) > Number(currentPositionTimestamp) &&
          Number(snapshot.timestamp) <= timestamp &&
          !isTwoStringsEqual(snapshot.owner, farmingContract))
      ) {
        acc[snapshot.position.id] = snapshot;
      }
      return acc;
    },
    {} as { [key: string]: PositionSnapshot },
  );
  const records = Object.values(uniquePositionsSnapshotsMapping);
  const tokenBalances: { [key: string]: { [key: string]: number } } = {};
  // Process each event
  for (const snapshot of records) {
    try {
      const {
        pool: { token0, token1 },
        depositedToken0,
        depositedToken1,
        withdrawnToken0,
        withdrawnToken1,
        owner,
      } = snapshot;
      const amount0 = Number(depositedToken0) - Number(withdrawnToken0);
      const amount1 = Number(depositedToken1) - Number(withdrawnToken1);
      // Initialize token balances if not exists
      if (!tokenBalances[owner]) {
        tokenBalances[owner] = {};
      }

      tokenBalances[owner][token0.id] = (tokenBalances[owner][token0.id] || 0) + Number(amount0);
      tokenBalances[owner][token1.id] = (tokenBalances[owner][token1.id] || 0) + Number(amount1);
    } catch (e) {
      console.log(snapshot);
      throw e;
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
