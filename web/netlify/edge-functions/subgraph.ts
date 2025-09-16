import type { Config } from "@netlify/edge-functions";
import { SUBGRAPHS } from "../../src/lib/subgraph-endpoints";

export default async (req: Request) => {
  const subgraph = new URL(req.url).searchParams.get("_subgraph");
  const chainId = Number.parseInt(new URL(req.url).searchParams.get("_chainId") || "");

  // @ts-ignore
  const subgraphUrl = SUBGRAPHS[subgraph][chainId];

  console.log(`Proxying request to subgraph: ${subgraph} for chain: ${chainId}`);

  if (subgraphUrl) {
    try {
      // Proxy the request to the subgraph
      const response = await fetch(subgraphUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: await req.text(),
      });

      // Check if response is JSON before parsing
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const textBody = await response.text();
        console.error(`Subgraph returned non-JSON response (${contentType}):`, textBody);

        return new Response(
          JSON.stringify({
            error: "Subgraph returned invalid response format",
            details: `Expected JSON but received ${contentType}`,
            status: response.status,
          }),
          {
            status: 502,
            headers: {
              "Content-Type": "application/json; charset=utf-8",
            },
          },
        );
      }

      const body = await response.json();

      return new Response(JSON.stringify(body), {
        status: body?.errors ? 500 : 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
      });
    } catch (error) {
      console.error("Error fetching from subgraph:", error);

      return new Response(
        JSON.stringify({
          error: "Failed to fetch from subgraph",
          details: error instanceof Error ? error.message : "Unknown error",
        }),
        {
          status: 502,
          headers: {
            "Content-Type": "application/json; charset=utf-8",
          },
        },
      );
    }
  }

  return new Response(JSON.stringify({ error: `Subgraph not found ${subgraph} chainId ${chainId}` }), { status: 404 });
};

export const config: Config = { path: "/subgraph" };
