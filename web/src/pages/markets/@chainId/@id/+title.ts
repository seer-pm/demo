import type { PageContext } from "vike/types";

export function title(pageContext: PageContext) {
  return (pageContext?.data as { title: string })?.title;
}
