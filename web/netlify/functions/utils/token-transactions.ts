import type { SupabaseClient } from "@supabase/supabase-js";
import type { Address } from "viem";

import type { Database } from "./supabase";

export interface TokenHolder {
  address: Address;
  balance: string;
}

export async function getTokenHolders(
  client: SupabaseClient<Database>,
  chainId: number,
  tokenIds: string[],
  count?: number,
): Promise<{ [tokenId: string]: TokenHolder[] }> {
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
    .order("balance", { ascending: false });

  if (error) {
    throw new Error(`Error fetching token holders: ${error.message}`);
  }

  const result: { [tokenId: string]: TokenHolder[] } = {};

  if (data) {
    for (const tokenId of tokenIds) {
      let holders = data
        .filter((row) => row.token!.toLowerCase() === tokenId.toLowerCase())
        .map((row) => ({
          address: row.owner as Address,
          balance: BigInt(row.balance as number).toString(),
        }));
      if (count !== undefined) {
        holders = holders.slice(0, count);
      }
      result[tokenId.toLowerCase()] = holders;
    }
  }

  return result;
}
