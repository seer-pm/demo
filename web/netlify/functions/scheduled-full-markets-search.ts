import { getStore } from "@netlify/blobs";
import { Config } from "@netlify/functions";
import { multiChainSearch } from "./markets-search.mts";

export default async (req: Request) => {
  try {
    const { next_run } = await req.json();
    console.log("Received event! Next invocation at:", next_run);
    const markets = await multiChainSearch(
      { chainsList: [], marketName: "", marketStatusList: [], creator: "", participant: "" },
      "",
    );
    const store = getStore("markets");
    await store.setJSON("all-markets", markets, {
      metadata: { updatedAt: new Date() },
    });
  } catch (e) {
    console.log(e);
  }
};

export const config: Config = {
  schedule: "*/10 * * * *",
};
