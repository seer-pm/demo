import type { Market, SupportedChain, TokenTransfer, TransactionData } from "@seer-pm/sdk";
import { COLLATERAL_TOKENS, reconstructSplitMergeRedeemFromTransfers } from "@seer-pm/sdk";
import { createClient } from "@supabase/supabase-js";
import type { Address } from "viem";
import { isAddress } from "viem";
import { tokensTransfersRowToTransfer } from "./utils/airdropCalculation/getAllTransfers";
import { getMarketByChainAndId } from "./utils/markets";
import type { Database } from "./utils/supabase";
import { getTokenHolders } from "./utils/token-transactions";

const supabase = createClient<Database>(process.env.SUPABASE_PROJECT_URL!, process.env.SUPABASE_API_KEY!);

/** Primary-collateral legs for the given tx hashes (list length bounded by `distinctTxCap` in the caller). */
async function listPrimaryCollateralTransfersForTxHashesAll(
  chainId: number,
  primaryToken: string,
  txHashes: string[],
): Promise<TokenTransfer[]> {
  if (txHashes.length === 0) return [];
  const { data, error } = await supabase
    .from("tokens_transfers")
    .select()
    .eq("chain_id", chainId)
    .eq("token", primaryToken.toLowerCase())
    .in("tx_hash", txHashes);
  if (error) throw new Error(`tokens_transfers primary for tx hashes: ${error.message}`);
  return (data ?? []).map(tokensTransfersRowToTransfer);
}

type GetRecentTransactionsOptions = {
  fetchLimit: number;
  /**
   * If true: derive distinct tx hashes from the outcome batch, fetch primary-collateral rows for those txs,
   * and concatenate — intended for SMR/swap reconstruct (needs outcome + cash legs).
   */
  withMainCollateral?: boolean;
  /** Max distinct tx hashes to enrich with primary when `withMainCollateral` (default 100). */
  distinctTxCap?: number;
};

type GetRecentTransactionsResult = {
  outcomeBatch: TokenTransfer[];
  mergedWithPrimary?: TokenTransfer[];
};

async function getRecentTransactions(
  tokenIds: string[],
  chainId: number,
  account: Address | undefined,
  options: GetRecentTransactionsOptions,
): Promise<GetRecentTransactionsResult> {
  const { fetchLimit, withMainCollateral, distinctTxCap = 100 } = options;

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

  const { data } = await query.limit(fetchLimit);
  const outcomeBatch = data?.map(tokensTransfersRowToTransfer) || [];

  let mergedWithPrimary: TokenTransfer[] | undefined;
  if (withMainCollateral) {
    const primary = COLLATERAL_TOKENS[chainId as SupportedChain]?.primary;
    const firstDistinctTxHashes = [...new Set(outcomeBatch.map((t) => t.tx_hash))].slice(0, distinctTxCap);
    if (primary && firstDistinctTxHashes.length > 0) {
      const hashSet = new Set(firstDistinctTxHashes);
      const firstDistinctOutcomeSubset = outcomeBatch.filter((t) => hashSet.has(t.tx_hash));
      const primaryRows = await listPrimaryCollateralTransfersForTxHashesAll(
        chainId,
        primary.address,
        firstDistinctTxHashes,
      );
      mergedWithPrimary = [...firstDistinctOutcomeSubset, ...primaryRows];
    }
  }

  return { outcomeBatch, mergedWithPrimary };
}

/** Single outcome-token query window; response trims to `RECENT_TRANSFERS_RESPONSE_LIMIT` rows. */
const RECENT_TRANSFERS_FETCH_LIMIT = 500;
const RECENT_TRANSFERS_RESPONSE_LIMIT = 100;

export default async (req: Request) => {
  try {
    const url = new URL(req.url);
    const tokenIdsParam = url.searchParams.get("tokenIds");
    const chainId = url.searchParams.get("chainId");
    const accountParam = url.searchParams.get("account");

    if (!chainId) {
      return new Response(JSON.stringify({ error: "chainId parameter is required" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

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

    const marketIdParam = url.searchParams.get("marketId")?.trim();
    let market: Market | undefined;
    if (marketIdParam && isAddress(marketIdParam)) {
      try {
        market = (await getMarketByChainAndId(chainIdNum as SupportedChain, marketIdParam as Address)) ?? undefined;
      } catch {
        market = undefined;
      }
    }

    const tokenIds = tokenIdsParam
      ? tokenIdsParam
          .split(",")
          .map((id) => id.trim())
          .filter((id) => id.length > 0)
      : [];

    /** Query tokens: from market when `marketId` resolved, else from `tokenIds` (requires `tokenIds` if market missing). */
    const effectiveTokenIds = market
      ? [...market.wrappedTokens].map((t) => String(t).trim()).filter((id) => id.length > 0)
      : tokenIds;

    if (effectiveTokenIds.length === 0) {
      return new Response(
        JSON.stringify({
          error:
            "Provide tokenIds (comma-separated) or a marketId that resolves on this chain so outcome tokens can be derived.",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    }

    const topHolders = await getTokenHolders(supabase, chainIdNum, effectiveTokenIds);

    const { outcomeBatch, mergedWithPrimary } = await getRecentTransactions(
      effectiveTokenIds,
      chainIdNum,
      account as Address | undefined,
      {
        fetchLimit: RECENT_TRANSFERS_FETCH_LIMIT,
        withMainCollateral: Boolean(market),
        distinctTxCap: 100,
      },
    );
    const recentTransactions = outcomeBatch.slice(0, RECENT_TRANSFERS_RESPONSE_LIMIT);

    let recentActivity: TransactionData[] = [];
    if (market && mergedWithPrimary) {
      try {
        recentActivity = reconstructSplitMergeRedeemFromTransfers(mergedWithPrimary, {
          market,
          options: { identifySwaps: true },
        });
      } catch (e) {
        console.error("get-token-transactions: recentActivity", e);
        recentActivity = [];
      }
    }

    return new Response(
      JSON.stringify(
        {
          topHolders,
          recentTransactions,
          recentActivity,
          totalTokens: effectiveTokenIds.length,
          totalTransactions: recentTransactions.length,
          tokenIds: effectiveTokenIds.map((id) => id.toLowerCase()),
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
