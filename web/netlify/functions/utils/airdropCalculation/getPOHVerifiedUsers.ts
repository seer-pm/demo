import type { SupportedChain } from "@seer-pm/sdk";
import { getSubgraphUrl } from "@seer-pm/sdk/subgraph";

export interface PoHRequest {
  id: string;
  requester: string;
  resolutionTime: string;
}
export async function getPOHVerifiedUsers(chainId: 1 | 100) {
  const maxAttempts = 20;
  let attempt = 0;
  let allRequests: PoHRequest[] = [];
  let currentId = undefined;
  while (attempt < maxAttempts) {
    const query: string = `{
              requests(first: 1000, orderBy: id, orderDirection: asc${
                currentId
                  ? `, where: {id_gt: "${currentId}",status: "resolved",revocation: false}`
                  : `, where: {status: "resolved",revocation: false}`
              }) {
                id
                requester
                resolutionTime
              }
            }`;
    const results = await fetch(getSubgraphUrl("poh", chainId)!, {
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
      throw json.errors[0];
    }
    const requests = json?.data?.requests ?? [];
    allRequests = allRequests.concat(requests);

    if (requests[requests.length - 1]?.id === currentId) {
      break;
    }
    if (requests.length < 1000) {
      break; // We've fetched all requests
    }
    currentId = requests[requests.length - 1]?.id;
    attempt++;
  }
  return allRequests;
}
export function isPOHVerifiedUserAtTime(requests: PoHRequest[], user: string, timestamp: number) {
  return requests.some((request) => request.requester === user && Number(request.resolutionTime) <= timestamp);
}

const POH_CHAINS = [1, 100] as const;

async function queryPoh<T>(chainId: 1 | 100, query: string, variables: Record<string, unknown>): Promise<T> {
  const results = await fetch(getSubgraphUrl("poh", chainId)!, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  const json = await results.json();
  if (json.errors?.length) {
    throw json.errors[0];
  }
  return json.data as T;
}

/**
 * Addresses registered on PoH RIGHT NOW (not expired) on one chain, lowercased.
 *
 * Unlike `getPOHVerifiedUsers`, which lists resolved requests and so never forgets a human, this
 * reads live registrations: a profile that was not renewed has no registration past its
 * `expirationTime` and drops out. That is the set the nightly PoH recompute uses: "who would count
 * if today were the PoH snapshot day". `claimer` is the address currently holding the profile.
 */
export async function getCurrentPohHumans(chainId: 1 | 100, now = Math.floor(Date.now() / 1000)): Promise<string[]> {
  const addresses: string[] = [];
  let lastId = "";
  for (let page = 0; page < 100; page++) {
    const data = await queryPoh<{ registrations: { id: string; claimer: { id: string } }[] }>(
      chainId,
      `query ($now: BigInt!, $lastId: Bytes!) {
        registrations(first: 1000, orderBy: id, orderDirection: asc,
                      where: { expirationTime_gt: $now, id_gt: $lastId }) {
          id
          claimer { id }
        }
      }`,
      { now: String(now), lastId: lastId || "0x" },
    );
    const registrations = data?.registrations ?? [];
    for (const r of registrations) {
      addresses.push(r.claimer.id.toLowerCase());
    }
    if (registrations.length < 1000) {
      return addresses;
    }
    lastId = registrations[registrations.length - 1].id;
  }
  throw new Error(`getCurrentPohHumans(${chainId}): more than 100 pages, refusing a partial set`);
}

/** Every currently registered PoH address across Mainnet and Gnosis, deduplicated. */
export async function getAllCurrentPohHumans(now?: number): Promise<string[]> {
  const perChain = await Promise.all(POH_CHAINS.map((chainId) => getCurrentPohHumans(chainId, now)));
  return Array.from(new Set(perChain.flat()));
}

/**
 * Single-address version of `getAllCurrentPohHumans`, for request-time validation. The bulk list is
 * tens of thousands of rows and must not be fetched per request.
 */
export async function isPohRegistered(address: string, now = Math.floor(Date.now() / 1000)): Promise<boolean> {
  const results = await Promise.all(
    POH_CHAINS.map((chainId) =>
      queryPoh<{ registrations: { id: string }[] }>(
        chainId,
        `query ($claimer: String!, $now: BigInt!) {
          registrations(first: 1, where: { claimer: $claimer, expirationTime_gt: $now }) { id }
        }`,
        { claimer: address.toLowerCase(), now: String(now) },
      ),
    ),
  );
  return results.some((data) => (data?.registrations?.length ?? 0) > 0);
}
