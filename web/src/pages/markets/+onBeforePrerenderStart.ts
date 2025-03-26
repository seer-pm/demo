import { fetchAllMarkets } from "@/lib/markets-search";
import { unescapeJson } from "@/lib/reality";
import { formatDate } from "@/lib/utils";

export { onBeforePrerenderStart };

async function onBeforePrerenderStart() {
  try {
    const markets = await fetchAllMarkets();
    return markets
      .filter((market) => market.url && market.url.length < 83)
      .map((market) => {
        let description = "Efficient on-chain prediction markets.";
        try {
          description = `Answer opening date: ${`${formatDate(
            market.questions[0].opening_ts,
          )} UTC`}. Outcomes: ${market.outcomes.slice(0, -1).join(", ")}.`;
        } catch {}
        return {
          url: `/markets/${market.chainId}/${market.url}`,
          pageContext: {
            title: `Seer | ${unescapeJson(market.marketName)}`,
            description,
          },
        };
      });
    // biome-ignore lint/suspicious/noExplicitAny:
  } catch (e: any) {
    return [];
  }
}
