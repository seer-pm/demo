import { getAppUrl } from "@/lib/utils";
import { GraphQLClient } from "graphql-request";
import { SupportedChain } from "../../../src/lib/chains";
import { gnosis, mainnet } from "./config";

const api = "8b2690ffdd390bad59638b894ee8d9f6";

export type SubgraphTypes = "seer" | "curate" | "curate-fallback" | "uniswap" | "algebra" | "algebrafarming";

export function getSubgraphUrl(subgraph: SubgraphTypes, chainId: SupportedChain) {
  return `${getAppUrl()}/subgraph?_subgraph=${subgraph}&_chainId=${chainId}`;
}

export function graphQLClient(chainId: SupportedChain) {
  return new GraphQLClient(getSubgraphUrl("seer", chainId));
}

export function curateGraphQLClient(chainId: SupportedChain, isUseFallbackUrls?: boolean) {
  return new GraphQLClient(getSubgraphUrl(isUseFallbackUrls ? "curate-fallback" : "curate", chainId));
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
