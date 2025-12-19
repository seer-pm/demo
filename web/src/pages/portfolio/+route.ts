import type { PageContext } from "vike/types";

export function route(pageContext: PageContext) {
  const trimmedPath = pageContext.urlPathname.replace(/^\/+|\/+$/g, "");
  const parts = trimmedPath.split("/");

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
