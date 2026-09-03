import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./supabase";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

/**
 * Market id → the root of its conditional family, for markets that are not their own root.
 *
 * A root market has no entry: `rootMarketId` reads a miss as "its own root", so the map stays
 * proportional to the conditional markets rather than to every market on the chain.
 */
export type MarketFamilyRoots = ReadonlyMap<string, string>;

/** The family a market belongs to. Its own id when it is a root, or when `roots` is unknown. */
export function rootMarketId(roots: MarketFamilyRoots | undefined, marketId: string): string {
  const id = marketId.toLowerCase();
  return roots?.get(id) ?? id;
}

/**
 * Follow `parentMarket` links to the top of each family.
 *
 * Not the immediate parent: nesting reaches depth 2 on gnosis today (two markets), and the whole
 * point of the fold is that a family's capital sits on the market that holds primary collateral,
 * which is the root and not an intermediate.
 *
 * Cycles cannot occur on chain — a market's parent exists before it does — but this walks rows
 * from the database inside a background job, so a cycle leaves its members unmapped (each its own
 * root) rather than spinning forever.
 */
export function resolveFamilyRoots(parentOf: ReadonlyMap<string, string>): Map<string, string> {
  const roots = new Map<string, string>();

  for (const start of parentOf.keys()) {
    if (roots.has(start)) continue;
    // Ids walked from `start` that are known to have a parent, so all of them share `root`.
    const path: string[] = [];
    const onPath = new Set<string>();
    let cur = start;
    let root: string | null = null;

    while (true) {
      if (onPath.has(cur)) break;
      onPath.add(cur);
      const cached = roots.get(cur);
      if (cached !== undefined) {
        root = cached;
        break;
      }
      const parent = parentOf.get(cur);
      if (parent === undefined) {
        root = cur;
        break;
      }
      path.push(cur);
      cur = parent;
    }

    if (root === null) continue;
    for (const id of path) roots.set(id, root);
  }

  return roots;
}

/**
 * Every conditional market on the chain, mapped to its family root.
 *
 * One paged read of `markets` per refresh run — a few thousand rows, and the same map serves every
 * wallet in the batch. `parentMarket` is stored inside `subgraph_data`, so the id is projected out
 * in the select rather than fetching whole market rows.
 */
export async function fetchMarketFamilyRoots(
  supabase: SupabaseClient<Database>,
  chainId: number,
): Promise<Map<string, string>> {
  const parentOf = new Map<string, string>();
  const PAGE = 1000;

  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from("markets")
      .select("id, parent_id:subgraph_data->parentMarket->>id")
      .eq("chain_id", chainId)
      .range(from, from + PAGE - 1);
    if (error) throw new Error(`market family roots for chain ${chainId}: ${error.message}`);

    const rows = (data ?? []) as { id: string; parent_id: string | null }[];
    for (const row of rows) {
      const id = String(row.id).toLowerCase();
      const parent = row.parent_id ? String(row.parent_id).toLowerCase() : "";
      if (parent && parent !== ZERO_ADDRESS && parent !== id) parentOf.set(id, parent);
    }
    if (rows.length < PAGE) break;
  }

  return resolveFamilyRoots(parentOf);
}
