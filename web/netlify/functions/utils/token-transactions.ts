import type { SupabaseClient } from "@supabase/supabase-js";
import type { Address } from "viem";

import type { Database } from "./supabase";

type HoldingsRow = Pick<Database["public"]["Views"]["tokens_holdings_v"]["Row"], "token" | "owner" | "balance">;

export interface TokenHolder {
  address: Address;
  balance: string;
}

const HOLDERS_PAGE_SIZE = 1000;

export async function getTokenHolders(
  client: SupabaseClient<Database>,
  chainId: number,
  tokenIds: string[],
  count?: number,
): Promise<{ [tokenId: string]: TokenHolder[] }> {
  const rows: HoldingsRow[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await client
      .from("tokens_holdings_v")
      .select("token, owner, balance")
      .eq("chain_id", chainId)
      .in(
        "token",
        tokenIds.map((id) => id.toLowerCase()),
      )
      .neq("owner", "0x0000000000000000000000000000000000000000")
      .gt("balance", 0)
      .order("token", { ascending: true })
      .order("balance", { ascending: false })
      .range(from, from + HOLDERS_PAGE_SIZE - 1);

    if (error) {
      throw new Error(`Error fetching token holders: ${error.message}`);
    }
    if (!data?.length) {
      break;
    }
    rows.push(...data);
    if (data.length < HOLDERS_PAGE_SIZE) {
      break;
    }
    from += HOLDERS_PAGE_SIZE;
  }

  const result: { [tokenId: string]: TokenHolder[] } = {};

  if (rows.length > 0) {
    for (const tokenId of tokenIds) {
      let holders = rows
        .filter((row) => row.token.toLowerCase() === tokenId.toLowerCase())
        .map((row) => ({
          address: row.owner as Address,
          balance: BigInt(row.balance).toString(),
        }));
      if (count !== undefined) {
        holders = holders.slice(0, count);
      }
      result[tokenId.toLowerCase()] = holders;
    }
  }

  return result;
}
