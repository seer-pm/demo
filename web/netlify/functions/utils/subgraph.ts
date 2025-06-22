import { SupportedChain } from "@/lib/chains";
import SEER_ENV from "@/lib/env";
import { GraphQLClient } from "graphql-request";
import { gnosis, mainnet } from "./config";

export type SubgraphTypes = "seer" | "curate" | "uniswap" | "algebra" | "algebrafarming" | "tokens" | "poh";

function getAppUrl() {
  return SEER_ENV.VITE_WEBSITE_URL || "https://app.seer.pm";
}

export function getSubgraphUrl(subgraph: SubgraphTypes, chainId: SupportedChain) {
  return `${getAppUrl()}/subgraph?_subgraph=${subgraph}&_chainId=${chainId}`;
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
