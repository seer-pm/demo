import { SUBGRAPHS } from "@/lib/subgraph-endpoints";
import { TokenTransfer } from "@/lib/tokens";
import { createClient } from "@supabase/supabase-js";
import { Address } from "viem";
import { Database } from "./utils/supabase";

const supabase = createClient<Database>(process.env.SUPABASE_PROJECT_URL!, process.env.SUPABASE_API_KEY!);

interface Holder {
  address: string;
  balance: string;
}

async function getRecentTransactions(tokenIds: string[], limit = 100): Promise<TokenTransfer[]> {
  const { data } = await supabase
    .from("tokens_transfers")
    .select()
    .in(
      "token",
      tokenIds.map((id) => id.toLowerCase()),
    )
    .order("timestamp", { ascending: false })
    .limit(limit);
  return (
    data?.map((r) => {
      return {
        ...r,
        from: r.from as Address,
        to: r.to as Address,
        token: r.token as Address,
        value: BigInt(r.value),
      };
    }) || []
  );
}

const TOP_HOLDERS_COUNT = 5;

async function getTopHoldersForTokens(tokenIds: string[]): Promise<{ [tokenId: string]: Holder[] }> {
  const { data, error } = await supabase
    .from("tokens_holdings_v")
    .select("token, owner, balance")
    .in(
      "token",
      tokenIds.map((id) => id.toLowerCase()),
    )
    .neq("owner", "0x0000000000000000000000000000000000000000")
    .gt("balance", 0)
    .order("token", { ascending: true })
    .order("balance", { ascending: false });

  if (error) {
    throw new Error(`Error·fetching·token·holders:·${error.message}`);
  }

  const result: { [tokenId: string]: Holder[] } = {};

  if (data) {
    for (const tokenId of tokenIds) {
      const holders = data
        .filter((row) => row.token!.toLowerCase() === tokenId.toLowerCase())
        .slice(0, TOP_HOLDERS_COUNT)
        .map((row) => ({
          address: row.owner as string,
          balance: BigInt(row.balance as number).toString(),
        }));

      result[tokenId!.toLowerCase()] = holders;
    }
  }

  return result;
}

export default async (req: Request) => {
  try {
    const url = new URL(req.url);
    const tokenIdsParam = url.searchParams.get("tokenIds");
    const chainId = url.searchParams.get("chainId");

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
    const chainIdNum = Number.parseInt(chainId, 10);
    if (Number.isNaN(chainIdNum)) {
      return new Response(JSON.stringify({ error: "chainId must be a valid number" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    // Check if chain is supported
    const supportedChains = Object.keys(SUBGRAPHS.tokens).map(Number);
    if (!supportedChains.includes(chainIdNum)) {
      return new Response(
        JSON.stringify({
          error: `Unsupported chain ID: ${chainIdNum}. Supported chains: ${supportedChains.join(", ")}`,
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    }

    // Get top holders for each token using the fetched data
    const topHolders = await getTopHoldersForTokens(tokenIds);

    // Get last 100 transactions across all tokens
    const recentTransactions = await getRecentTransactions(tokenIds, 100);

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
