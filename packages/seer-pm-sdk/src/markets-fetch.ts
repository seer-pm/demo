import { Address, isAddress } from "viem";
import type { Market_OrderBy } from "../generated/subgraph/seer";
import type { Market, MarketStatus, SerializedMarket, VerificationStatus } from "./market-types";
import { deserializeMarket } from "./market-types";
import { getApiHost } from "./subgraph/app-subgraph";

export type FetchMarketParams = {
  chainsList?: Array<string | "all">;
  type?: "Generic" | "Futarchy" | "";
  marketName?: string;
  categoryList?: string[];
  marketStatusList?: MarketStatus[];
  verificationStatusList?: VerificationStatus[];
  showConditionalMarkets?: boolean;
  showMarketsWithRewards?: boolean;
  minLiquidity?: number;
  creator?: Address | "";
  participant?: Address | "";
  orderBy?: Market_OrderBy;
  orderDirection?: "asc" | "desc";
  marketIds?: string[];
  disabled?: boolean;
  limit?: number;
  page?: number;
  parentMarket?: Address;
};

export type JsonMarketsResult = { markets: SerializedMarket[]; count: number; pages: number };
export type MarketsResult = {
  markets: Market[];
  count: number;
  pages: number;
};

export async function fetchMarkets(params: FetchMarketParams = {}): Promise<MarketsResult> {
  const response = await fetch(`${getApiHost()}/.netlify/functions/markets-search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });
  const result: JsonMarketsResult = await response.json();
  return {
    markets: result.markets.map((market) => deserializeMarket(market)),
    count: result.count,
    pages: result.pages,
  };
}

export async function fetchMarket(chainId: number, idOrSlug: Address | string): Promise<Market | undefined> {
  const params: { chainId: number; id: Address } | { chainId: number; url: string } = !isAddress(idOrSlug, {
    strict: false,
  })
    ? { chainId: Number(chainId), url: idOrSlug }
    : { chainId: Number(chainId), id: idOrSlug };

  const response = await fetch(`${getApiHost()}/.netlify/functions/get-market`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  if (response.status === 200) {
    return deserializeMarket(await response.json()) as Market;
  }

  return;
}
