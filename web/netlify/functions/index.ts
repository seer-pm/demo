import { SupportedChain } from "@/lib/chains";
import { fetchMarket } from "@/lib/markets-fetch";
import { isAddress } from "viem";
import { renderPage } from "vike/server";

async function getRedirectUrl(req: Request): Promise<string | undefined> {
  // Extract chainId and marketId from URL if it matches the pattern
  const marketUrlPattern = /^\/markets\/(\d+)\/(0x[a-fA-F0-9]+)$/;
  const url = new URL(req.url);
  const match = url.pathname.match(marketUrlPattern);

  if (match) {
    const [, chainId, marketId] = match;
    const validChainId = Number.parseInt(chainId);
    if (validChainId > 0 && isAddress(marketId)) {
      const market = await fetchMarket(validChainId as SupportedChain, marketId);

      if (market?.url) {
        return market.url;
      }
    }
  }
}

export default async (req: Request) => {
  const pageContext = await renderPage({ urlOriginal: req.url });
  if (!pageContext.httpResponse) return new Response("", { status: 200 });

  console.log("render url", req.url);

  const redirectUrl = await getRedirectUrl(req);
  if (redirectUrl) {
    return new Response(null, {
      status: 301,
      headers: {
        Location: redirectUrl,
        "Cache-Control": "public, max-age=3600",
      },
    });
  }

  const headers = {
    ...Object.fromEntries(pageContext.httpResponse.headers),
  };

  // Add cache control only for market pages
  if (req.url.includes("/markets/")) {
    headers["Netlify-CDN-Cache-Control"] = "public, durable, max-age=3600, stale-while-revalidate=86400";
  }

  return new Response(pageContext.httpResponse.body, {
    status: pageContext.httpResponse.statusCode,
    headers,
  });
};
