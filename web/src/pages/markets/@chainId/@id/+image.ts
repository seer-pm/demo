import SEER_ENV from "@/lib/env";
import type { PageContextServer } from "vike/types";

export function image(pageContext: PageContextServer) {
  return `${SEER_ENV.VITE_OG_IMAGE_URL ?? "https://app.seer.pm/og-images/markets/"}${pageContext.routeParams.chainId}/${pageContext.routeParams.id}/`;
}
