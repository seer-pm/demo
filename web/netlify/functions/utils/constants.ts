const SUBGRAPH_API_KEY = "8b2690ffdd390bad59638b894ee8d9f6";

export const SEER_SUBGRAPH_URLS: Partial<Record<string, string>> = {
  "1": `https://gateway-arbitrum.network.thegraph.com/api/${SUBGRAPH_API_KEY}/subgraphs/id/BMQD869m8LnGJJfqMRjcQ16RTyUw6EUx5jkh3qWhSn3M`,
  "100": `https://gateway-arbitrum.network.thegraph.com/api/${SUBGRAPH_API_KEY}/subgraphs/id/B4vyRqJaSHD8dRDb3BFRoAzuBK18c1QQcXq94JbxDxWH`,
};

export const POOL_SUBGRAPH_URLS: Partial<Record<string, string>> = {
  "1": `https://gateway-arbitrum.network.thegraph.com/api/${SUBGRAPH_API_KEY}/subgraphs/id/5zvR82QoaXYFyDEKLZ9t6v9adgnptxYpKpSbxtgVENFV`,
  "100": `https://gateway-arbitrum.network.thegraph.com/api/${SUBGRAPH_API_KEY}/subgraphs/id/AAA1vYjxwFHzbt6qKwLHNcDSASyr1J1xVViDH8gTMFMR`,
};

export const CURATE_SUBGRAPH_URLS: Partial<Record<string, string>> = {
  "1": `https://gateway-arbitrum.network.thegraph.com/api/${SUBGRAPH_API_KEY}/subgraphs/id/A5oqWboEuDezwqpkaJjih4ckGhoHRoXZExqUbja2k1NQ`,
  "100": `https://gateway-arbitrum.network.thegraph.com/api/${SUBGRAPH_API_KEY}/subgraphs/id/9hHo5MpjpC1JqfD3BsgFnojGurXRHTrHWcUcZPPCo6m8`,
};

export const CURATE_REGISTRY_ADDRESSES: Partial<Record<string, string>> = {
  "1": "0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA",
  "100": "0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672",
} as const;

export const NETWORK_LOGOS: Record<string, string> = {
  "100": "https://cdn.kleros.link/ipfs/QmQddp6L3SFpLfCQzjLPSprZPgzLHUXZPsQfQ5Gu4eCbe1/gnosis.jpg",
  "1": "https://cdn.kleros.link/ipfs/QmNjoXKCYHHZYhFWdkKJKvTVDwkjyW8eKE9r91bfGHjMEp/ethereum.jpg",
};

export const REALITY_TEMPLATE_UINT = 1;
export const REALITY_TEMPLATE_SINGLE_SELECT = 2;
export const REALITY_TEMPLATE_MULTIPLE_SELECT = 3;

export const zeroAddress = "0x0000000000000000000000000000000000000000";