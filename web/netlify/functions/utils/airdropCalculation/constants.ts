import gql from "graphql-tag";
import { gnosis, mainnet } from "wagmi/chains";

export const NATIVE_TOKEN = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";

const api = "8b2690ffdd390bad59638b894ee8d9f6";
export const CHAIN_IDS = [gnosis.id, mainnet.id];
export const SUBGRAPHS = {
  seer: {
    [gnosis.id]: `https://gateway-arbitrum.network.thegraph.com/api/${api}/subgraphs/id/B4vyRqJaSHD8dRDb3BFRoAzuBK18c1QQcXq94JbxDxWH`,
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
  tokens: {
    [gnosis.id]:
      "https://gateway.thegraph.com/api/a3d37662f27d87b20e3d8d7149e85910/subgraphs/id/DJKN6orXh7MUv5y94WumfvRxyV1khuZhXtCMjQM349ru",
    [mainnet.id]:
      "https://gateway.thegraph.com/api/a3d37662f27d87b20e3d8d7149e85910/subgraphs/id/D1bjzs39GBk5HDrNm5ui27TDpX6pMqp8omUCRr79CjSQ",
  },
  poh: {
    [gnosis.id]:
      "https://gateway.thegraph.com/api/d5c7982a40f63da9504805d11919004d/subgraphs/id/FFx16fGNSpdq2TpQer3KqpadP8UaLELS4Jocd1LtwAmG",
    [mainnet.id]:
      "https://gateway.thegraph.com/api/d5c7982a40f63da9504805d11919004d/subgraphs/id/8oHw9qNXdeCT2Dt4QPZK9qHZNAhPWNVrCKnFDarYEJF5",
  },
};
