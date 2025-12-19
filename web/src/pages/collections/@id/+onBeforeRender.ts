import { getAppUrl } from "@/lib/utils";
import { PageContext } from "vike/types";

export default async function onBeforeRender(pageContext: PageContext) {
  try {
    const { id } = pageContext.routeParams;
    let collection: { id: string; name: string; userId?: string } = { id: "default", name: "Default" };

    const response = await fetch(
      `${getAppUrl()}/.netlify/functions/collections-handler/${id === "default" ? "" : id}`,
      {
        signal: AbortSignal.timeout(2000),
      },
    );
    const data = await response.json();

    collection = data.data.map((x: { id: number; name: string; user_id: string }) => ({
      name: x.name,
      id: x.id.toString(),
      userId: x.user_id,
    }))[0];
    return {
      pageContext: {
        title: `Seer Collection | ${collection.name}`,
        description: collection.userId ? `Collection created by ${collection.userId}` : "Default collection",
      },
    };
  } catch (e) {
    console.log("collection onBeforeRender error", e);
  }

  return {
    pageContext: {
      title: "Seer | A Next Generation Prediction Marketplace",
      description: "Efficient on-chain prediction markets.",
    },
  };
}
