import { GraphQLClient } from "graphql-request";
import { SupportedChain, gnosis, mainnet } from "./chains";

export const SUBGRAPH_URLS: Partial<Record<SupportedChain, string>> = {
  [gnosis.id]:
    (typeof window !== "undefined" && import.meta.env.VITE_SUBGRAPH_GNOSIS) ||
    "https://gateway-arbitrum.network.thegraph.com/api/8b2690ffdd390bad59638b894ee8d9f6/subgraphs/id/B4vyRqJaSHD8dRDb3BFRoAzuBK18c1QQcXq94JbxDxWH",
};
export const CURATE_SUBGRAPH_URLS: Partial<Record<SupportedChain, string>> = {
  [gnosis.id]:
    "https://gateway-arbitrum.network.thegraph.com/api/8b2690ffdd390bad59638b894ee8d9f6/subgraphs/id/2hP3hyWreJSK8uvYwC4WMKi2qFXbPcnp7pCx7EzW24sp",
};
export const SWAPR_ALGEBRA_SUBGRAPH_URLS: Partial<Record<SupportedChain, string>> = {
  [gnosis.id]:
    "https://gateway-arbitrum.network.thegraph.com/api/8b2690ffdd390bad59638b894ee8d9f6/subgraphs/id/AAA1vYjxwFHzbt6qKwLHNcDSASyr1J1xVViDH8gTMFMR",
};
export const SWAPR_ALGEBRA_FARMING_SUBGRAPH_URLS: Partial<Record<SupportedChain, string>> = {
  [gnosis.id]:
    "https://gateway-arbitrum.network.thegraph.com/api/8b2690ffdd390bad59638b894ee8d9f6/subgraphs/id/4WysHZ1gFJcv1HLAobLMx3dS9B6aovExzyG3n7kRjwKT",
};
export const UNISWAP_SUBGRAPH_URLS: Partial<Record<SupportedChain, string>> = {
  [mainnet.id]:
    "https://gateway.thegraph.com/api/8b2690ffdd390bad59638b894ee8d9f6/subgraphs/id/5zvR82QoaXYFyDEKLZ9t6v9adgnptxYpKpSbxtgVENFV",
};

export function graphQLClient(chainId: SupportedChain) {
  const subgraphUrl = SUBGRAPH_URLS[chainId];

  if (!subgraphUrl) {
    return;
  }

  return new GraphQLClient(subgraphUrl);
}

export function curateGraphQLClient(chainId: SupportedChain) {
  const subgraphUrl = CURATE_SUBGRAPH_URLS[chainId];

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
