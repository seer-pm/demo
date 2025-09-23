export type SubgraphTypes =
  | "seer"
  | "curate"
  | "uniswap"
  | "algebra"
  | "algebrafarming"
  | "tokens"
  | "poh"
  | "reality"
  | "bunniMainnet"
  | "bunniLpPositionMainnet"
  | "futarchy";

export const CHAIN_IDS = {
  gnosis: 100,
  mainnet: 1,
  optimism: 10,
  base: 8453,
  sepolia: 11155111,
} as const;

const api = "8b2690ffdd390bad59638b894ee8d9f6";

export const SUBGRAPHS = {
  seer: {
    [CHAIN_IDS.gnosis]: `https://gateway-arbitrum.network.thegraph.com/api/${api}/deployments/id/QmRbM8wp5Ft1gPQurtiezastbY76WqELEWcoMTPVyaFf3v`,
    [CHAIN_IDS.mainnet]: `https://gateway-arbitrum.network.thegraph.com/api/${api}/deployments/id/QmbmKoyAUveLE94FSKowSShAoTKCcRsRa2LdaMWwkx1EdJ`,
    [CHAIN_IDS.optimism]: `https://gateway-arbitrum.network.thegraph.com/api/${api}/deployments/id/QmUrD13KfaaoJmnUN9CH9wja8YLVdkGXhVjRTtkdkRw5oH`,
    [CHAIN_IDS.base]: `https://gateway-arbitrum.network.thegraph.com/api/${api}/deployments/id/QmS53PLFUSFY22P4PSZ1Davk19Zhj7FTDVxbXpzK1cFMaG`,
    [CHAIN_IDS.sepolia]: `https://gateway-arbitrum.network.thegraph.com/api/${api}/deployments/id/QmP4s663tVTkSosuoCkX4CMZZXw8sSBV6VPXGrYC3PSXRC`,
  },
  curate: {
    // TODO: add fallback urls? or change subgraph?
    [CHAIN_IDS.gnosis]: `https://gateway-arbitrum.network.thegraph.com/api/${api}/subgraphs/id/9hHo5MpjpC1JqfD3BsgFnojGurXRHTrHWcUcZPPCo6m8`,
    [CHAIN_IDS.mainnet]: `https://gateway-arbitrum.network.thegraph.com/api/${api}/subgraphs/id/A5oqWboEuDezwqpkaJjih4ckGhoHRoXZExqUbja2k1NQ`,
    [CHAIN_IDS.sepolia]: `https://gateway-arbitrum.network.thegraph.com/api/${api}/subgraphs/id/EzUnTuz6RNJ5xD2LJXJb4VNpUZKLVRsF5bY8G4XazrE4`,
  },
  algebra: {
    [CHAIN_IDS.gnosis]: `https://gateway-arbitrum.network.thegraph.com/api/${api}/subgraphs/id/AAA1vYjxwFHzbt6qKwLHNcDSASyr1J1xVViDH8gTMFMR`,
  },
  algebrafarming: {
    [CHAIN_IDS.gnosis]: `https://gateway-arbitrum.network.thegraph.com/api/${api}/subgraphs/id/4WysHZ1gFJcv1HLAobLMx3dS9B6aovExzyG3n7kRjwKT`,
  },
  uniswap: {
    [CHAIN_IDS.mainnet]: `https://gateway.thegraph.com/api/${api}/subgraphs/id/5zvR82QoaXYFyDEKLZ9t6v9adgnptxYpKpSbxtgVENFV`,
    [CHAIN_IDS.optimism]: `https://gateway.thegraph.com/api/${api}/subgraphs/id/5Vg1mtJELha5ApuhkBk573K1iQKh6uUie72VotwGURy4`,
    [CHAIN_IDS.base]: `https://gateway.thegraph.com/api/${api}/subgraphs/id/5vS7rrUPc4ftB2nodNBf4EoAZkdD11jPuUVw7p56bMLb`,
  },
  tokens: {
    [CHAIN_IDS.gnosis]:
      "https://gateway.thegraph.com/api/a3d37662f27d87b20e3d8d7149e85910/subgraphs/id/DJKN6orXh7MUv5y94WumfvRxyV1khuZhXtCMjQM349ru",
    [CHAIN_IDS.mainnet]:
      "https://gateway.thegraph.com/api/a3d37662f27d87b20e3d8d7149e85910/subgraphs/id/Gfh4bbQ8MrXa45PddVuxE1SzzfdhsdiC4BbGUjfsu8Qn",
  },
  poh: {
    [CHAIN_IDS.gnosis]:
      "https://gateway.thegraph.com/api/d5c7982a40f63da9504805d11919004d/subgraphs/id/FFx16fGNSpdq2TpQer3KqpadP8UaLELS4Jocd1LtwAmG",
    [CHAIN_IDS.mainnet]:
      "https://gateway.thegraph.com/api/d5c7982a40f63da9504805d11919004d/subgraphs/id/8oHw9qNXdeCT2Dt4QPZK9qHZNAhPWNVrCKnFDarYEJF5",
  },
  reality: {
    [CHAIN_IDS.gnosis]: `https://gateway.thegraph.com/api/${api}/subgraphs/id/E7ymrCnNcQdAAgLbdFWzGE5mvr5Mb5T9VfT43FqA7bNh`,
  },

  bunniMainnet: {
    [CHAIN_IDS.mainnet]:
      "https://gateway.thegraph.com/api/a3d37662f27d87b20e3d8d7149e85910/subgraphs/id/HH4HFj4rFnm5qnkb8MbEdP2V5eD9rZnLJE921YQAs7AV",
  },
  bunniLpPositionMainnet: {
    [CHAIN_IDS.mainnet]:
      "https://gateway.thegraph.com/api/a3d37662f27d87b20e3d8d7149e85910/subgraphs/id/8necVcWSBJk7mj7VHPEKjbwXoKKH3C938tJCjNjQctrp",
  },
  futarchy: {
    [CHAIN_IDS.gnosis]:
      "https://gateway.thegraph.com/api/a3d37662f27d87b20e3d8d7149e85910/subgraphs/id/H8uG6j77JyfwRv31aYfJcFby8eRfXSpbwqiuzPQfCQJD",
  },
} as const;
