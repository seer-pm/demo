import { SupportedChain, mainnet } from "@/lib/chains";
import { COLLATERAL_TOKENS } from "@/lib/config";
import { Token0Token1, getToken0Token1 } from "@/lib/market";
import { SUBGRAPHS } from "@/lib/subgraph-endpoints";
import ethers, { BigNumber } from "ethers";
import pLimit from "p-limit";
import { Address } from "viem";
import { calculateBurnAmounts } from "./utils";

export interface BunniToken {
  id: string;
  name: string;
  symbol: string;
  address: string;
  gauge: {
    address: string;
  } | null; // in case gauge is nullable
}

export interface BunniPositionSnapshot {
  id: string;
  token: {
    id: string;
    tickLower: string;
    tickUpper: string;
  };
  totalSupply: string;
  liquidity: string | null;
  tick: string;
  token0: string;
  token1: string;
  transfer: {
    from: string;
    to: string;
    value: string;
  };
  timestamp: string;
  blockNumber: string;
}

export async function getBunniLpTokensByTokenPair(chainId: SupportedChain, tokenPair: Token0Token1) {
  if (chainId !== mainnet.id) {
    return [];
  }
  let allData: BunniToken[] = [];
  let currentId: string | undefined;

  const maxRetries = 3;
  let counter = 0;

  while (true) {
    let retries = 0;
    let success = false;
    let bunniTokens = [];

    while (retries < maxRetries && !success) {
      try {
        const query: string = `{
                    bunniTokens(first: 1000, orderBy: id, orderDirection: asc${currentId ? `, where: {id_gt: ${currentId}, pool_: {token0: "${tokenPair.token0}", token1: "${tokenPair.token1}"}}` : `, where: {pool_: {token0: "${tokenPair.token0}", token1: "${tokenPair.token1}"}}`}) {
                      id
                      name
                      symbol
                      address
                      gauge {
                        address
                      }
                    }
                }`;

        const results = await fetch(SUBGRAPHS["bunniMainnet"][1], {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query }),
        });
        if (!results.ok) {
          throw new Error(`HTTP error! status: ${results.status}`);
        }

        const json = await results.json();
        if (json.errors?.length) {
          throw json.errors[0].message;
        }
        bunniTokens = json?.data?.bunniTokens ?? [];
        success = true;
        counter++;
      } catch (error) {
        retries++;

        if (retries === maxRetries) {
          throw new Error(`Max retries reached for id ${currentId}. ${error.message}`);
        }

        // Exponential backoff
        await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** retries));
      }
    }

    allData = allData.concat(bunniTokens);

    // Break conditions
    if (bunniTokens.length === 0 || bunniTokens[bunniTokens.length - 1]?.id === currentId) {
      break;
    }
    if (bunniTokens.length < 1000) {
      break; // We've fetched all
    }

    currentId = bunniTokens[bunniTokens.length - 1]?.id;

    // wait 300ms between calls
    await new Promise((res) => setTimeout(res, 300));
  }
  return allData;
}

export async function getBunniLpTokensByTokenPairs(
  chainId: SupportedChain,
  tokenPairs: { tokenId: Address; parentTokenId?: Address }[],
) {
  if (chainId !== 1) return { tokens: [], gauges: [] };
  const limit = pLimit(50);
  const promises = [];
  const sortedTokenPairs = tokenPairs.map(({ tokenId, parentTokenId }) => {
    const collateral = parentTokenId
      ? parentTokenId.toLocaleLowerCase()
      : COLLATERAL_TOKENS[chainId].primary.address.toLocaleLowerCase();
    return getToken0Token1(tokenId, collateral as Address);
  });
  for (const tokenPair of sortedTokenPairs) {
    promises.push(limit(() => getBunniLpTokensByTokenPair(chainId, tokenPair)));
  }
  const allData = (await Promise.all(promises)).flat();

  return {
    tokens: Array.from(new Set(allData.map((x) => x.address))),
    gauges: Array.from(new Set(allData.map((x) => x.gauge?.address).filter((x) => x))) as string[],
  };
}

export async function getBunniPositionSnapshots(bunniLpTokens: string[]) {
  let allPositionSnapshots: BunniPositionSnapshot[] = [];
  let currentTimestamp = undefined;

  while (true) {
    const query: string = `{
              positionSnapshots(first: 1000, orderBy: timestamp, orderDirection: asc${currentTimestamp ? `, where: {timestamp_gt: "${currentTimestamp}", token_in:[${bunniLpTokens.map((token) => `"${token}"`)}]}` : `, where: {token_in:[${bunniLpTokens.map((token) => `"${token}"`)}]}`}) {
                id
                token {
                    id
                    tickLower
                    tickUpper
                }
                totalSupply
                liquidity
                tick
                
                token0
                token1
                transfer{
                  from
                  to
                  value
                }
                timestamp
                blockNumber
              }
            }`;
    const results = await fetch(SUBGRAPHS["bunniLpPositionMainnet"][1], {
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
    const positionSnapshots = json?.data?.positionSnapshots ?? [];
    allPositionSnapshots = allPositionSnapshots.concat(positionSnapshots);

    if (positionSnapshots[positionSnapshots.length - 1]?.timestamp === currentTimestamp) {
      break;
    }
    if (positionSnapshots.length < 1000) {
      break; // We've fetched all
    }
    currentTimestamp = positionSnapshots[positionSnapshots.length - 1]?.timestamp;
  }
  return allPositionSnapshots;
}

export function getBunniPositionHoldersAtTimestamp(
  allPositionSnapshots: BunniPositionSnapshot[],
  timestamp: number,
  bunniGauges: string[],
) {
  const balances: { [key: string]: { [key: string]: BigNumber } } = {};
  const ignoredAddrs = new Set(bunniGauges.map((addr) => addr.toLowerCase()));
  for (const snapshot of allPositionSnapshots) {
    if (Number(snapshot.timestamp) > timestamp) continue;

    const from = snapshot.transfer.from.toLowerCase();
    const to = snapshot.transfer.to.toLowerCase();

    // Skip if either side is a Bunni gauge
    if (ignoredAddrs.has(from) || ignoredAddrs.has(to)) continue;

    if (from === ethers.constants.AddressZero || to === ethers.constants.AddressZero) continue;

    const value = BigNumber.from(snapshot.transfer.value || "0");

    const liquidityRaw = snapshot.liquidity;
    const totalSupplyRaw = snapshot.totalSupply;

    // Skip if invalid liquidity or totalSupply
    if (!liquidityRaw || !totalSupplyRaw || totalSupplyRaw === "0") continue;

    const liquidity = BigNumber.from(liquidityRaw);
    const totalSupply = BigNumber.from(totalSupplyRaw);

    const tickCurrent = Number(snapshot.tick);
    const tickLower = Number(snapshot.token.tickLower);
    const tickUpper = Number(snapshot.token.tickUpper);

    const token0 = (snapshot.token0 || "").toLowerCase();
    const token1 = (snapshot.token1 || "").toLowerCase();

    if (!token0 || !token1) continue;

    const { amount0, amount1 } = calculateBurnAmounts(value, totalSupply, liquidity, tickCurrent, tickLower, tickUpper);

    // Initialize balances for both addresses and tokens
    for (const addr of [from, to]) {
      if (!balances[addr]) balances[addr] = {};
      if (!balances[addr][token0]) balances[addr][token0] = BigNumber.from(0);
      if (!balances[addr][token1]) balances[addr][token1] = BigNumber.from(0);
    }

    // Subtract from sender
    if (from !== ethers.constants.AddressZero) {
      balances[from][token0] = balances[from][token0].sub(amount0);
      balances[from][token1] = balances[from][token1].sub(amount1);
    }

    // Add to recipient
    if (to !== ethers.constants.AddressZero) {
      balances[to][token0] = balances[to][token0].add(amount0);
      balances[to][token1] = balances[to][token1].add(amount1);
    }
  }

  // Format result: only positive balances shown
  const formatted: { [key: string]: { [key: string]: number } } = {};
  for (const [addr, tokens] of Object.entries(balances)) {
    const display: { [key: string]: number } = {};
    for (const [token, amount] of Object.entries(tokens)) {
      if (amount.gt(0) || amount.lt(0)) {
        display[token] = Number(ethers.utils.formatUnits(amount, 18));
      }
    }
    if (Object.keys(display).length > 0) {
      formatted[addr] = display;
    }
  }

  return formatted;
}
