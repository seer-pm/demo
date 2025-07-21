import { UseGraphMarketsParams } from "@/hooks/useMarkets";
import { Address, isAddress } from "viem";
import { SupportedChain } from "./chains";
import { deserializeMarket } from "./market";
import { Market, SerializedMarket } from "./market";
import { getAppUrl } from "./utils";

export type FetchMarketParams = Partial<UseGraphMarketsParams> & { parentMarket?: Address };

export type BaseMarketsResult = { markets: SerializedMarket[]; count: number; pages: number };
export type MarketsResult = { markets: Market[]; count: number; pages: number };

export async function fetchMarkets(params: FetchMarketParams = {}): Promise<MarketsResult> {
  const response = await fetch(`${getAppUrl()}/.netlify/functions/markets-search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });
  const result: BaseMarketsResult = await response.json();
  return {
    markets: result.markets.map((market: SerializedMarket) => deserializeMarket(market)),
    count: result.count,
    pages: result.pages,
  };
}

export async function fetchMarket(chainId: SupportedChain, idOrSlug: Address | string): Promise<Market | undefined> {
  const params: { chainId: SupportedChain; id: Address } | { chainId: SupportedChain; url: string } = !isAddress(
    idOrSlug,
    { strict: false },
  )
    ? { chainId, url: idOrSlug }
    : { chainId, id: idOrSlug };

  const response = await fetch(`${getAppUrl()}/.netlify/functions/get-market`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  if (response.status === 200) {
    return deserializeMarket(await response.json());
  }

  return;
}
