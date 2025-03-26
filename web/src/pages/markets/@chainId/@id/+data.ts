import { FetchMarketParams } from "@/lib/markets-search";
import { getAppUrl } from "@/lib/utils";
import { isAddress } from "viem";
import { PageContext } from "vike/types";
export { data };
async function data(pageContext: PageContext) {
  try {
    const { id, chainId } = pageContext.routeParams;

    const params: FetchMarketParams = { chainsList: [chainId] };

    if (!isAddress(id, { strict: false })) {
      params.url = id;
    } else {
      params.id = id;
    }
    const metadata = await fetch(`${getAppUrl()}/.netlify/functions/market-metadata`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
      signal: AbortSignal.timeout(2000),
    }).then((response) => response.json());
    if (metadata) {
      return metadata;
    }
  } catch (e) {
    console.log("market onBeforeRender error", e);
  }

  return {
    title: "Seer | A Next Generation Prediction Marketplace",
    description: "Efficient on-chain prediction markets.",
  };
}
