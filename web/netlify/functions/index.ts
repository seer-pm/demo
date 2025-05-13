import { renderPage } from "vike/server";

export default async (req: Request) => {
  const pageContext = await renderPage({ urlOriginal: req.url });
  if (!pageContext.httpResponse) return new Response("", { status: 200 });

  const headers = {
    ...Object.fromEntries(pageContext.httpResponse.headers),
  };

  // Add cache control only for market pages
  if (req.url.includes("/markets/")) {
    headers["Netlify-CDN-Cache-Control"] = "public, durable, max-age=60, stale-while-revalidate=120";
  }

  return new Response(pageContext.httpResponse.body, {
    status: pageContext.httpResponse.statusCode,
    headers,
  });
};
