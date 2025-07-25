import { GraphQLClient } from "graphql-request";
import { SupportedChain, gnosis, mainnet } from "./chains";
import { getAppUrl } from "./utils";

const SUBGRAPH_ENDPOINT = `${getAppUrl()}/subgraph`;

export function getSubgraphUrl(
  subgraphType: "seer" | "curate" | "uniswap" | "algebra" | "algebrafarming" | "reality",
  chainId: SupportedChain,
) {
  return `${SUBGRAPH_ENDPOINT}?_subgraph=${subgraphType}&_chainId=${chainId}`;
}

export function graphQLClient(chainId: SupportedChain) {
  return new GraphQLClient(getSubgraphUrl("seer", chainId));
}

export function curateGraphQLClient(chainId: SupportedChain) {
  return new GraphQLClient(getSubgraphUrl("curate", chainId));
}

export function uniswapGraphQLClient(chainId: SupportedChain) {
  if (chainId !== mainnet.id) {
    return;
  }

  return new GraphQLClient(getSubgraphUrl("uniswap", chainId));
}

export function swaprGraphQLClient(chainId: SupportedChain, subgraph: "algebra" | "algebrafarming") {
  if (chainId !== gnosis.id) {
    return;
  }

  return new GraphQLClient(getSubgraphUrl(subgraph, chainId));
}

export function realityGraphQLClient(chainId: SupportedChain) {
  if (chainId !== gnosis.id) {
    return;
  }

  return new GraphQLClient(getSubgraphUrl("reality", chainId));
}
