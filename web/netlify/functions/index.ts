import { renderPage } from "vike/server";

export default async (req: Request) => {
  const pageContext = await renderPage({ urlOriginal: req.url });
  if (!pageContext.httpResponse) return new Response("", { status: 200 });

  return new Response(pageContext.httpResponse.body, {
    status: pageContext.httpResponse.statusCode,
    headers: { "Content-Type": pageContext.httpResponse.contentType },
  });
};
