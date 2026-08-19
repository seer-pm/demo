import type { Config } from "@netlify/edge-functions";
import { getSubgraphUrl } from "../../../packages/seer-pm-sdk/src/subgraph/subgraph-endpoints.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function isGraphqlResultBody(body: unknown): body is { data?: unknown; errors?: unknown } {
  if (!body || typeof body !== "object") return false;
  return "data" in body || "errors" in body;
}

export default async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  const subgraph = new URL(req.url).searchParams.get("_subgraph");
  const chainId = Number.parseInt(new URL(req.url).searchParams.get("_chainId") || "");

  // @ts-ignore
  const subgraphUrl = getSubgraphUrl(subgraph, chainId);

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
            // Upstream returned HTML/text with 200 — treat as bad gateway, not success.
            status: response.ok ? 502 : response.status,
            headers: {
              "Content-Type": "application/json; charset=utf-8",
              ...corsHeaders,
            },
          },
        );
      }

      const body = await response.json();

      // Preserve upstream 4xx/5xx (e.g. Goldsky 429) — do not coerce to 200 when body lacks `errors`.
      if (!response.ok) {
        return new Response(JSON.stringify(body), {
          status: response.status,
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            ...corsHeaders,
          },
        });
      }

      if (!isGraphqlResultBody(body)) {
        // Rate-limit / timeout payloads like `{ message: "..." }` are not GraphQL results.
        console.error("Subgraph returned non-GraphQL JSON:", body);
        return new Response(JSON.stringify(body), {
          status: 502,
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            ...corsHeaders,
          },
        });
      }

      return new Response(JSON.stringify(body), {
        status: Array.isArray(body.errors) && body.errors.length > 0 ? 500 : 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          ...corsHeaders,
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
            ...corsHeaders,
          },
        },
      );
    }
  }

  return new Response(JSON.stringify({ error: `Subgraph not found ${subgraph} chainId ${chainId}` }), {
    status: 404,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...corsHeaders,
    },
  });
};

export const config: Config = { path: "/subgraph" };
