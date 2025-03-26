import type { PageContext } from "vike/types";

export function description(pageContext: PageContext) {
  return (pageContext?.data as { description: string })?.description;
}
