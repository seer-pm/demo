import type { PageContextServer } from "vike/types";

export function image(pageContext: PageContextServer) {
  return `https://app.seer.pm/.netlify/functions/og-images/${pageContext.routeParams.chainId}/${pageContext.routeParams.id}/`;
}
