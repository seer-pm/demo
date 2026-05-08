import type { TokenTransfer } from "@seer-pm/sdk";
import { createClient } from "@supabase/supabase-js";
import type { Address } from "viem";
import { isAddress } from "viem";
import { tokensTransfersRowToTransfer } from "./utils/airdropCalculation/getAllTransfers";
import type { Database } from "./utils/supabase";
import { getTokenHolders } from "./utils/token-transactions";

const supabase = createClient<Database>(process.env.SUPABASE_PROJECT_URL!, process.env.SUPABASE_API_KEY!);

async function getRecentTransactions(
  tokenIds: string[],
  chainId: number,
  account?: Address,
  limit = 100,
): Promise<TokenTransfer[]> {
  let query = supabase
    .from("tokens_transfers")
    .select()
    .eq("chain_id", chainId)
    .in(
      "token",
      tokenIds.map((id) => id.toLowerCase()),
    )
    .order("timestamp", { ascending: false });

  if (account) {
    const accountLc = account.toLowerCase();
    query = query.or(`from.eq.${accountLc},to.eq.${accountLc}`);
  }

  const { data } = await query.limit(limit);

  return data?.map(tokensTransfersRowToTransfer) || [];
}

const TOP_HOLDERS_COUNT = 10;

export default async (req: Request) => {
  try {
    const url = new URL(req.url);
    const tokenIdsParam = url.searchParams.get("tokenIds");
    const chainId = url.searchParams.get("chainId");
    const accountParam = url.searchParams.get("account");

    // Validate required parameters
    if (!tokenIdsParam) {
      return new Response(JSON.stringify({ error: "tokenIds parameter is required (comma-separated list)" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    if (!chainId) {
      return new Response(JSON.stringify({ error: "chainId parameter is required" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    // Parse tokenIds
    const tokenIds = tokenIdsParam
      .split(",")
      .map((id) => id.trim())
      .filter((id) => id.length > 0);

    if (tokenIds.length === 0) {
      return new Response(JSON.stringify({ error: "At least one valid tokenId is required" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    // Validate chainId
    const chainIdNum = Number(chainId);
    if (!Number.isInteger(chainIdNum)) {
      return new Response(JSON.stringify({ error: "chainId must be a valid number" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    const account = accountParam?.trim();
    if (account && !isAddress(account)) {
      return new Response(JSON.stringify({ error: "account must be a valid address" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    // Get top holders for each token using the fetched data
    const topHolders = await getTokenHolders(supabase, chainIdNum, tokenIds, TOP_HOLDERS_COUNT);

    // Get last 100 transactions across all tokens
    const recentTransactions = await getRecentTransactions(tokenIds, chainIdNum, account as Address | undefined, 100);

    return new Response(
      JSON.stringify(
        {
          topHolders,
          recentTransactions,
          totalTokens: tokenIds.length,
          totalTransactions: recentTransactions.length,
          tokenIds: tokenIds.map((id) => id.toLowerCase()),
          chainId: chainIdNum,
        },
        (_, value) => (typeof value === "bigint" ? value.toString() : value),
      ),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=300", // Cache for 5 minutes
        },
      },
    );
  } catch (error) {
    console.error("Error fetching token transactions:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Internal server error",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }
};
