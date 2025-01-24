import type { HandlerContext, HandlerEvent } from "@netlify/functions";
import { SUBGRAPHS } from "./utils/subgraph";

export const handler = async (event: HandlerEvent, _context: HandlerContext) => {
  const subgraph = event.queryStringParameters?._subgraph;
  const chainId = Number.parseInt(event.queryStringParameters?._chainId || "");

  // @ts-ignore
  const subgraphUrl = SUBGRAPHS[subgraph][chainId];

  if (subgraphUrl) {
    // Proxy the request to the subgraph
    const response = await fetch(subgraphUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: event.body,
    });

    return {
      body: await response.text(),
      statusCode: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
    };
  }

  return {
    statusCode: 404,
    body: JSON.stringify({ error: "Subgraph not found" }),
  };
};
