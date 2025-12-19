import { SupportedChain } from "@/lib/chains";
import { SUBGRAPHS } from "@/lib/subgraph-endpoints";

export interface PoHRequest {
  id: string;
  requester: string;
  resolutionTime: string;
}
export async function getPOHVerifiedUsers(chainId: SupportedChain) {
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
    const results = await fetch(SUBGRAPHS["poh"][chainId as 1 | 100], {
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
