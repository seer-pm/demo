import { gnosis, mainnet, optimism } from "wagmi/chains";

export const NATIVE_TOKEN = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";

export const START_TIME = {
  [gnosis.id]: 1728416320,
  [mainnet.id]: 1728082727,
};

export const SER_LPP = {
  [gnosis.id]: "0xa7a7f8d1770c08e2e1f55d8c6427c1f8213a34da",
  [mainnet.id]: "0xd14ef697281404646d8e2437a0050794a6a22fd6",
};

const api = "8b2690ffdd390bad59638b894ee8d9f6";
export const CHAIN_IDS = [gnosis.id, mainnet.id, optimism.id];
export const SUBGRAPHS = {
  seer: {
    [gnosis.id]: `https://gateway-arbitrum.network.thegraph.com/api/${api}/deployments/id/QmRbM8wp5Ft1gPQurtiezastbY76WqELEWcoMTPVyaFf3v`,
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
    [optimism.id]: `https://gateway.thegraph.com/api/${api}/subgraphs/id/5Vg1mtJELha5ApuhkBk573K1iQKh6uUie72VotwGURy4`,
  },
  tokens: {
    [gnosis.id]:
      "https://gateway.thegraph.com/api/a3d37662f27d87b20e3d8d7149e85910/subgraphs/id/DJKN6orXh7MUv5y94WumfvRxyV1khuZhXtCMjQM349ru",
    [mainnet.id]: "https://api.studio.thegraph.com/query/101341/seer-outcome-tokens-mainnet/version/latest",
  },
  poh: {
    [gnosis.id]:
      "https://gateway.thegraph.com/api/d5c7982a40f63da9504805d11919004d/subgraphs/id/FFx16fGNSpdq2TpQer3KqpadP8UaLELS4Jocd1LtwAmG",
    [mainnet.id]:
      "https://gateway.thegraph.com/api/d5c7982a40f63da9504805d11919004d/subgraphs/id/8oHw9qNXdeCT2Dt4QPZK9qHZNAhPWNVrCKnFDarYEJF5",
  },
  futarchy: {
    [gnosis.id]:
      "https://gateway.thegraph.com/api/a3d37662f27d87b20e3d8d7149e85910/subgraphs/id/H8uG6j77JyfwRv31aYfJcFby8eRfXSpbwqiuzPQfCQJD",
  },
  bunniMainnet: {
    [mainnet.id]:
      "https://gateway.thegraph.com/api/a3d37662f27d87b20e3d8d7149e85910/subgraphs/id/HH4HFj4rFnm5qnkb8MbEdP2V5eD9rZnLJE921YQAs7AV",
  },
  bunniLpPositionMainnet: {
    [mainnet.id]:
      "https://gateway.thegraph.com/api/a3d37662f27d87b20e3d8d7149e85910/subgraphs/id/8necVcWSBJk7mj7VHPEKjbwXoKKH3C938tJCjNjQctrp",
  },
};
