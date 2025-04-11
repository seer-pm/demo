import { getAppUrl } from "@/lib/utils";
import { isAddress } from "viem";
import { PageContext } from "vike/types";

export default async function onBeforeRender(pageContext: PageContext) {
  const isBrowser = typeof window !== "undefined" && typeof document !== "undefined";
  if (isBrowser) {
    return;
  }
  try {
    const { id } = pageContext.routeParams;

    const params: { url: string } | { id: string } = !isAddress(id, { strict: false }) ? { url: id } : { id };

    const metadata = await fetch(`${getAppUrl()}/.netlify/functions/market-metadata`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
      signal: AbortSignal.timeout(2000),
    }).then((response) => response.json());

    if (metadata) {
      return {
        pageContext: {
          data: {
            ...metadata,
          },
        },
      };
    }
  } catch (e) {
    console.log("market onBeforeRender error", e);
  }

  return {
    pageContext: {
      data: {
        title: "Seer | A Next Generation Prediction Marketplace",
        description: "Efficient on-chain prediction markets.",
      },
    },
  };
}
