import type { PageContextServer } from "vike/types";

export function image(pageContext: PageContextServer) {
  return `${import.meta.env.VITE_OG_IMAGE_URL ?? "https://app.seer.pm/og-images/markets/"}${pageContext.routeParams.chainId}/${pageContext.routeParams.id}/`;
}
