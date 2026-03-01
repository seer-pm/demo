import { GraphQLClient } from "graphql-request";
import { gnosis, mainnet } from "viem/chains";
import { isOpStack } from "./config";
import { getAppUrl } from "./utils";

const SUBGRAPH_ENDPOINT = `${getAppUrl()}/subgraph`;

export function getSubgraphUrl(
  subgraphType: "seer" | "curate" | "uniswap" | "algebra" | "algebrafarming" | "reality",
  chainId: number,
) {
  return `${SUBGRAPH_ENDPOINT}?_subgraph=${subgraphType}&_chainId=${chainId}`;
}

export function graphQLClient(chainId: number) {
  return new GraphQLClient(getSubgraphUrl("seer", chainId));
}

export function curateGraphQLClient(chainId: number) {
  return new GraphQLClient(getSubgraphUrl("curate", chainId));
}

export function uniswapGraphQLClient(chainId: number) {
  if (chainId !== mainnet.id && !isOpStack(chainId)) {
    return;
  }

  return new GraphQLClient(getSubgraphUrl("uniswap", chainId));
}

export function swaprGraphQLClient(chainId: number, subgraph: "algebra" | "algebrafarming") {
  if (chainId !== gnosis.id) {
    return;
  }

  return new GraphQLClient(getSubgraphUrl(subgraph, chainId));
}

export function realityGraphQLClient(chainId: number) {
  if (chainId !== gnosis.id) {
    return;
  }

  return new GraphQLClient(getSubgraphUrl("reality", chainId));
}
