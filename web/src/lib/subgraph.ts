import { GraphQLClient } from "graphql-request";
import { SupportedChain, gnosis, mainnet } from "./chains";
import { getAppUrl } from "./utils";

const SUBGRAPH_ENDPOINT = `${getAppUrl()}/subgraph`;

export function getSubgraphuUrl(
  subgraphType: "seer" | "curate" | "uniswap" | "algebra" | "algebrafarming",
  chainId: SupportedChain,
) {
  return `${SUBGRAPH_ENDPOINT}?_subgraph=${subgraphType}&_chainId=${chainId}`;
}

export function graphQLClient(chainId: SupportedChain) {
  return new GraphQLClient(getSubgraphuUrl("seer", chainId));
}

export function curateGraphQLClient(chainId: SupportedChain) {
  return new GraphQLClient(getSubgraphuUrl("curate", chainId));
}

export function uniswapGraphQLClient(chainId: SupportedChain) {
  if (chainId !== mainnet.id) {
    return;
  }

  return new GraphQLClient(getSubgraphuUrl("uniswap", chainId));
}

export function swaprGraphQLClient(chainId: SupportedChain, subgraph: "algebra" | "algebrafarming") {
  if (chainId !== gnosis.id) {
    return;
  }

  return new GraphQLClient(getSubgraphuUrl(subgraph, chainId));
}
