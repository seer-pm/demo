import { SUBGRAPHS } from "./utils/subgraph";

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
