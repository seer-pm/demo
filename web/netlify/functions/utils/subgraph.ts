import { GraphQLClient } from "graphql-request";
import { SupportedChain } from "../../../src/lib/chains";
import { gnosis, mainnet } from "./config";

const api = "8b2690ffdd390bad59638b894ee8d9f6";

export type SubgraphTypes = "seer" | "curate" | "uniswap" | "algebra" | "algebrafarming";
export const SUBGRAPHS: Record<SubgraphTypes, Partial<Record<SupportedChain, string>>> = {
  seer: {
    [gnosis.id]:
      (typeof window !== "undefined" && process.env.VITE_SUBGRAPH_GNOSIS) ||
      `https://gateway-arbitrum.network.thegraph.com/api/${api}/subgraphs/id/B4vyRqJaSHD8dRDb3BFRoAzuBK18c1QQcXq94JbxDxWH`,
    [mainnet.id]: `https://gateway-arbitrum.network.thegraph.com/api/${api}/subgraphs/id/BMQD869m8LnGJJfqMRjcQ16RTyUw6EUx5jkh3qWhSn3M`,
  },
  curate: {
    // TODO: add fallback urls? or change subgraph?
    [gnosis.id]: `https://gateway-arbitrum.network.thegraph.com/api/${api}/subgraphs/id/9hHo5MpjpC1JqfD3BsgFnojGurXRHTrHWcUcZPPCo6m8`,
    [mainnet.id]: `https://gateway-arbitrum.network.thegraph.com/api/${api}/subgraphs/id/A5oqWboEuDezwqpkaJjih4ckGhoHRoXZExqUbja2k1NQ`,
  },
  algebra: {
    [gnosis.id]: `https://gateway-arbitrum.network.thegraph.com/api/${api}/subgraphs/id/AAA1vYjxwFHzbt6qKwLHNcDSASyr1J1xVViDH8gTMFMR`,
  },
  algebrafarming: {
    [gnosis.id]: `https://gateway-arbitrum.network.thegraph.com/api/${api}/subgraphs/id/4WysHZ1gFJcv1HLAobLMx3dS9B6aovExzyG3n7kRjwKT`,
  },
  uniswap: {
    [mainnet.id]: `https://gateway.thegraph.com/api/${api}/subgraphs/id/5zvR82QoaXYFyDEKLZ9t6v9adgnptxYpKpSbxtgVENFV`,
  },
};

export const CURATE_SUBGRAPH_FALLBACK_URLS: Partial<Record<SupportedChain, string>> = {
  [gnosis.id]: "https://api.studio.thegraph.com/query/61738/legacy-curate-gnosis/version/latest",
  [mainnet.id]: "https://api.studio.thegraph.com/query/61738/legacy-curate-mainnet/version/latest",
};

export function graphQLClient(chainId: SupportedChain) {
  const subgraphUrl = SUBGRAPHS.seer[chainId];

  if (!subgraphUrl) {
    return;
  }

  return new GraphQLClient(subgraphUrl);
}

export function curateGraphQLClient(chainId: SupportedChain, isUseFallbackUrls?: boolean) {
  const subgraphUrl = (isUseFallbackUrls ? CURATE_SUBGRAPH_FALLBACK_URLS : SUBGRAPHS.curate)[chainId];

  if (!subgraphUrl) {
    return;
  }

  return new GraphQLClient(subgraphUrl);
}

export function uniswapGraphQLClient(chainId: SupportedChain) {
  const subgraphUrl = SUBGRAPHS.uniswap[chainId];

  if (!subgraphUrl) {
    return;
  }

  return new GraphQLClient(subgraphUrl);
}

export function swaprGraphQLClient(chainId: SupportedChain, subgraph: "algebra" | "algebrafarming") {
  const subgraphUrl = SUBGRAPHS[subgraph]?.[chainId];

  if (!subgraphUrl) {
    return;
  }

  return new GraphQLClient(subgraphUrl);
}
