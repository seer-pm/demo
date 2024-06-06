import { GraphQLClient } from "graphql-request";
import { SupportedChain } from "./chains";
import {
  CURATE_SUBGRAPH_URLS,
  SUBGRAPH_URLS,
  SWAPR_ALGEBRA_FARMING_SUBGRAPH_URLS,
  SWAPR_ALGEBRA_SUBGRAPH_URLS,
} from "./config";

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

export function swaprGraphQLClient(chainId: SupportedChain, subgraph: "algebra" | "algebrafarming") {
  const subgraphUrl = { algebra: SWAPR_ALGEBRA_SUBGRAPH_URLS, algebrafarming: SWAPR_ALGEBRA_FARMING_SUBGRAPH_URLS }?.[
    subgraph
  ]?.[chainId];

  if (!subgraphUrl) {
    return;
  }

  return new GraphQLClient(subgraphUrl);
}
