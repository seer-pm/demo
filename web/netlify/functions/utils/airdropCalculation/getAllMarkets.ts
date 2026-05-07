import type { SupportedChain } from "@seer-pm/sdk";
import { graphQLClient } from "@seer-pm/sdk/subgraph";
import { Market_Select_Column, Order_By, getSdk as getSeerSdk } from "@seer-pm/sdk/subgraph/seer";
import { type EnvioMarket, envioMarketToLegacySubgraphMarket } from "../markets";

const MARKETS_PAGE_SIZE = 1000;
const MAX_PAGES = 200;

export async function fetchSubgraphMarkets(chainId: SupportedChain) {
  const client = graphQLClient(chainId);
  const sdk = getSeerSdk(client);
  const envioMarkets: EnvioMarket[] = [];
  let offset = 0;
  let page = 0;
  while (page < MAX_PAGES) {
    const { Market: markets } = await sdk.GetMarkets({
      limit: MARKETS_PAGE_SIZE,
      offset,
      where: { chainId: { _eq: String(chainId) } },
      orderBy: { [Market_Select_Column.Address]: Order_By.Asc },
    });
    if (markets.length === 0) {
      break;
    }
    envioMarkets.push(...(markets as EnvioMarket[]));
    if (markets.length < MARKETS_PAGE_SIZE) {
      break;
    }
    offset += MARKETS_PAGE_SIZE;
    page++;
  }

  return envioMarkets.map((m) => envioMarketToLegacySubgraphMarket(m));
}
