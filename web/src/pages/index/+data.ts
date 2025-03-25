import { fetchAllMarkets } from "@/lib/markets-search";

export { data };

async function data() {
  try {
    const markets = await fetchAllMarkets();
    return {
      markets,
      status: "ok",
    };
    // biome-ignore lint/suspicious/noExplicitAny:
  } catch (e: any) {
    return {
      status: "error",
      error: e.message,
    };
  }
}
