import type { Config } from "@netlify/edge-functions";
import { SupportedChain, gnosis, mainnet, sepolia } from "./utils/types.ts";

const api = "8b2690ffdd390bad59638b894ee8d9f6";

export type SubgraphTypes = "seer" | "curate" | "uniswap" | "algebra" | "algebrafarming" | "tokens" | "poh" | "reality";
export const SUBGRAPHS: Record<SubgraphTypes, Partial<Record<SupportedChain, string>>> = {
  seer: {
    [gnosis.id]: "https://api.studio.thegraph.com/query/74975/seer-pm/version/latest",
    [mainnet.id]: `https://gateway-arbitrum.network.thegraph.com/api/${api}/deployments/id/QmbmKoyAUveLE94FSKowSShAoTKCcRsRa2LdaMWwkx1EdJ`,
    [sepolia.id]: `https://gateway-arbitrum.network.thegraph.com/api/${api}/deployments/id/QmP4s663tVTkSosuoCkX4CMZZXw8sSBV6VPXGrYC3PSXRC`,
  },
  curate: {
    // TODO: add fallback urls? or change subgraph?
    [gnosis.id]: `https://gateway-arbitrum.network.thegraph.com/api/${api}/subgraphs/id/9hHo5MpjpC1JqfD3BsgFnojGurXRHTrHWcUcZPPCo6m8`,
    [mainnet.id]: `https://gateway-arbitrum.network.thegraph.com/api/${api}/subgraphs/id/A5oqWboEuDezwqpkaJjih4ckGhoHRoXZExqUbja2k1NQ`,
    [sepolia.id]: `https://gateway-arbitrum.network.thegraph.com/api/${api}/subgraphs/id/EzUnTuz6RNJ5xD2LJXJb4VNpUZKLVRsF5bY8G4XazrE4`,
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
  reality: {
    [gnosis.id]: `https://gateway.thegraph.com/api/${api}/subgraphs/id/E7ymrCnNcQdAAgLbdFWzGE5mvr5Mb5T9VfT43FqA7bNh`,
  },
};

export default async (req: Request) => {
  const subgraph = new URL(req.url).searchParams.get("_subgraph");
  const chainId = Number.parseInt(new URL(req.url).searchParams.get("_chainId") || "");

  // @ts-ignore
  const subgraphUrl = SUBGRAPHS[subgraph][chainId];

  if (subgraphUrl) {
    // Proxy the request to the subgraph
    const response = await fetch(subgraphUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: await req.text(),
    });

    return new Response(await response.text(), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
    });
  }

  return new Response(JSON.stringify({ error: "Subgraph not found" }), { status: 404 });
};

export const config: Config = { path: "/subgraph" };
