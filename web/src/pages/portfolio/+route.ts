import type { PageContext } from "vike/types";

export function route(pageContext: PageContext) {
  const trimmedPath = pageContext.urlPathname.replace(/^\/+|\/+$/g, "");
  const parts = trimmedPath.split("/");

  // Vike consults this Route Function for every URL that no static page claims, so it must decline
  // anything outside /portfolio: a match here would put the portfolio page on unknown paths that
  // belong to the 404 page.
  if (parts[0] !== "portfolio") {
    return false;
  }

  if (parts.length === 1) {
    return {
      routeParams: {},
    };
  }

  return {
    routeParams: {
      id: parts[1],
    },
  };
}
