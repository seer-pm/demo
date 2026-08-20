import type { Address } from "viem";

export function expandMarketIdsCacheKey(chainId: number, marketIds: Address[]): string {
  const roots = [...new Set(marketIds.map((id) => id.toLowerCase()))].sort();
  return `${chainId}:${roots.join(",")}`;
}
