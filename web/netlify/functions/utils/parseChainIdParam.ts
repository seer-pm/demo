export type ChainIdParam = number | "all";

export function parseChainIdQueryParam(
  chainId: string | null,
  opts?: { allowAll?: boolean },
): { chainId: ChainIdParam } | { error: string } {
  if (!chainId) {
    return { error: "ChainId parameter is required" };
  }
  if (opts?.allowAll && chainId.toLowerCase() === "all") {
    return { chainId: "all" };
  }
  if (!/^[1-9]\d*$/.test(chainId)) {
    return { error: opts?.allowAll ? "chainId must be a number or 'all'" : "chainId must be a valid number" };
  }
  return { chainId: Number.parseInt(chainId, 10) };
}
