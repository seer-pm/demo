import type { Handler, HandlerContext, HandlerEvent } from "@netlify/functions";
import { renderPage } from "vike";

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  const pageContext = await renderPage({ urlOriginal: event.rawUrl });
  if (!pageContext.httpResponse) return { statusCode: 200 };
  console.log(pageContext.httpResponse.statusCode, event.rawUrl);

  return {
    statusCode: pageContext.httpResponse.statusCode,
    headers: { "Content-Type": pageContext.httpResponse.contentType },
    body: pageContext.httpResponse.body,
  };
};
