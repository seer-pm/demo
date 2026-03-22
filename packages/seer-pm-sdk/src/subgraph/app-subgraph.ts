import { GraphQLClient } from "graphql-request";
import { isOpStack } from "../chains";
import { CHAIN_IDS } from "./subgraph-endpoints";

const DEFAULT_API_HOST = "https://app.seer.pm";

let apiHost = DEFAULT_API_HOST;

/**
 * Set the base API host used to build subgraph proxy and API endpoints.
 * Call this at app init (e.g. with the host's getAppUrl or origin) so the app uses the correct API base.
 */
export function initApiHost(url: string): void {
  apiHost = url;
}

/** Return the current API host (set via initApiHost). */
export function getApiHost(): string {
  return apiHost;
}

export type AppSubgraphType = "seer" | "curate" | "uniswap" | "algebra" | "algebrafarming" | "reality";

export function getAppSubgraphUrl(subgraphType: AppSubgraphType, chainId: number): string {
  return `${apiHost}/subgraph?_subgraph=${subgraphType}&_chainId=${chainId}`;
}

export function graphQLClient(chainId: number): GraphQLClient {
  return new GraphQLClient(getAppSubgraphUrl("seer", chainId));
}

export function curateGraphQLClient(chainId: number): GraphQLClient {
  return new GraphQLClient(getAppSubgraphUrl("curate", chainId));
}

export function uniswapGraphQLClient(chainId: number): GraphQLClient | undefined {
  if (chainId !== CHAIN_IDS.mainnet && !isOpStack(chainId)) {
    return undefined;
  }
  return new GraphQLClient(getAppSubgraphUrl("uniswap", chainId));
}

export function swaprGraphQLClient(chainId: number, subgraph: "algebra" | "algebrafarming"): GraphQLClient | undefined {
  if (chainId !== CHAIN_IDS.gnosis) {
    return undefined;
  }
  return new GraphQLClient(getAppSubgraphUrl(subgraph, chainId));
}

export function realityGraphQLClient(chainId: number): GraphQLClient | undefined {
  if (chainId !== CHAIN_IDS.gnosis) {
    return undefined;
  }
  return new GraphQLClient(getAppSubgraphUrl("reality", chainId));
}
