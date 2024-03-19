import { GraphQLClient } from "graphql-request";
import { SupportedChain } from "./chains";
import { SUBGRAPH_URLS } from "./config";

export function graphQLClient(chainId: SupportedChain) {
  const subgraphUrl = SUBGRAPH_URLS[chainId];

  if (!subgraphUrl) {
    return;
  }

  return new GraphQLClient(subgraphUrl);
}
