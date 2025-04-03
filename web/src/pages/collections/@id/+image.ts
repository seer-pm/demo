import type { PageContextServer } from "vike/types";

export function image(pageContext: PageContextServer) {
  return `https://app.seer.pm/og-images/collections/${pageContext.routeParams.id}/`;
}
