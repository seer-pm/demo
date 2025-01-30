import { GraphQLClient } from "graphql-request";
import { SupportedChain, gnosis, mainnet } from "./chains";

const api = "8b2690ffdd390bad59638b894ee8d9f6";

export const SUBGRAPH_URLS: Partial<Record<SupportedChain, string>> = {
  [gnosis.id]:
    (typeof window !== "undefined" && import.meta.env.VITE_SUBGRAPH_GNOSIS) ||
    `https://api.studio.thegraph.com/query/74975/seer-pm/version/latest`,
  [mainnet.id]: `https://gateway-arbitrum.network.thegraph.com/api/${api}/subgraphs/id/BMQD869m8LnGJJfqMRjcQ16RTyUw6EUx5jkh3qWhSn3M`,
};
export const CURATE_SUBGRAPH_URLS: Partial<Record<SupportedChain, string>> = {
  [gnosis.id]: `https://gateway-arbitrum.network.thegraph.com/api/${api}/subgraphs/id/9hHo5MpjpC1JqfD3BsgFnojGurXRHTrHWcUcZPPCo6m8`,
  [mainnet.id]: `https://gateway-arbitrum.network.thegraph.com/api/${api}/subgraphs/id/A5oqWboEuDezwqpkaJjih4ckGhoHRoXZExqUbja2k1NQ`,
};

export const CURATE_SUBGRAPH_FALLBACK_URLS: Partial<Record<SupportedChain, string>> = {
  [gnosis.id]: "https://api.studio.thegraph.com/query/61738/legacy-curate-gnosis/version/latest",
  [mainnet.id]: "https://api.studio.thegraph.com/query/61738/legacy-curate-mainnet/version/latest",
};

export const SWAPR_ALGEBRA_SUBGRAPH_URLS: Partial<Record<SupportedChain, string>> = {
  [gnosis.id]: `https://gateway-arbitrum.network.thegraph.com/api/${api}/subgraphs/id/AAA1vYjxwFHzbt6qKwLHNcDSASyr1J1xVViDH8gTMFMR`,
};
export const SWAPR_ALGEBRA_FARMING_SUBGRAPH_URLS: Partial<Record<SupportedChain, string>> = {
  [gnosis.id]: `https://gateway-arbitrum.network.thegraph.com/api/${api}/subgraphs/id/4WysHZ1gFJcv1HLAobLMx3dS9B6aovExzyG3n7kRjwKT`,
};
export const UNISWAP_SUBGRAPH_URLS: Partial<Record<SupportedChain, string>> = {
  [mainnet.id]: `https://gateway.thegraph.com/api/${api}/subgraphs/id/5zvR82QoaXYFyDEKLZ9t6v9adgnptxYpKpSbxtgVENFV`,
};

export function graphQLClient(chainId: SupportedChain) {
  const subgraphUrl = SUBGRAPH_URLS[chainId];

  if (!subgraphUrl) {
    return;
  }

  return new GraphQLClient(subgraphUrl);
}

export function curateGraphQLClient(chainId: SupportedChain, isUseFallbackUrls?: boolean) {
  const subgraphUrl = (isUseFallbackUrls ? CURATE_SUBGRAPH_FALLBACK_URLS : CURATE_SUBGRAPH_URLS)[chainId];

  if (!subgraphUrl) {
    return;
  }

  return new GraphQLClient(subgraphUrl);
}

export function uniswapGraphQLClient(chainId: SupportedChain) {
  const subgraphUrl = UNISWAP_SUBGRAPH_URLS[chainId];

  if (!subgraphUrl) {
    return;
  }

  return new GraphQLClient(subgraphUrl);
}

export function swaprGraphQLClient(chainId: SupportedChain, subgraph: "algebra" | "algebrafarming") {
  const subgraphUrl = { algebra: SWAPR_ALGEBRA_SUBGRAPH_URLS, algebrafarming: SWAPR_ALGEBRA_FARMING_SUBGRAPH_URLS }?.[
    subgraph
  ]?.[chainId];

  if (!subgraphUrl) {
    return;
  }

  return new GraphQLClient(subgraphUrl);
}
