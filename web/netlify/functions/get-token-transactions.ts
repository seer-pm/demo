import { OrderDirection, TransferFragment, Transfer_OrderBy, getSdk } from "@/hooks/queries/gql-generated-tokens";
import { SupportedChain } from "@/lib/chains";
import { SUBGRAPHS } from "@/lib/subgraph-endpoints";
import { swaprGraphQLClient } from "./utils/subgraph";

interface Holder {
  address: string;
  balance: string;
}

async function getAllTransactionsForTokens(tokenIds: string[], chainId: SupportedChain): Promise<TransferFragment[]> {
  const subgraphClient = swaprGraphQLClient(chainId, "tokens");
  if (!subgraphClient) {
    return [];
  }

  const sdk = getSdk(subgraphClient);

  let allTransfers: TransferFragment[] = [];
  let currentTimestamp: string | undefined = undefined;

  // Paginate through all transfers for all tokens
  while (true) {
    const where = {
      token_in: tokenIds.map((id) => id.toLowerCase()),
      ...(currentTimestamp && { timestamp_lt: currentTimestamp }),
    };

    const result = await sdk.GetTransfers({
      first: 1000,
      orderBy: Transfer_OrderBy.Timestamp,
      orderDirection: OrderDirection.Desc,
      where,
    });

    const transfers = result.transfers;
    allTransfers = allTransfers.concat(transfers);

    if (transfers.length < 1000) {
      break; // We've fetched all
    }

    currentTimestamp = transfers[transfers.length - 1]?.timestamp;
  }

  return allTransfers;
}

function getTransactionsForToken(allTransfers: TransferFragment[], tokenId: string): TransferFragment[] {
  return allTransfers.filter((transfer) => transfer.token.id.toLowerCase() === tokenId.toLowerCase());
}

function getRecentTransactions(allTransfers: TransferFragment[], limit = 100): TransferFragment[] {
  return allTransfers.slice(0, limit);
}

const TOP_HOLDERS_COUNT = 10;

function getHolders(transfers: TransferFragment[]): Holder[] {
  const tokenBalances: { [key: string]: bigint } = {};

  // Process each transfer to calculate balances
  for (const transfer of transfers) {
    const from = transfer.from.toLowerCase();
    const to = transfer.to.toLowerCase();
    const value = BigInt(transfer.value);

    // Subtract from sender
    tokenBalances[from] = (tokenBalances[from] || BigInt(0)) - value;
    // Add to receiver
    tokenBalances[to] = (tokenBalances[to] || BigInt(0)) + value;
  }

  // Convert to holders array, excluding zero address and non-positive balances
  const holders: Holder[] = [];
  for (const [address, balance] of Object.entries(tokenBalances)) {
    // Exclude zero address and non-positive balances
    if (address !== "0x0000000000000000000000000000000000000000" && balance > 0n) {
      holders.push({
        address,
        balance: balance.toString(),
      });
    }
  }

  // Sort by balance descending (highest holders first) and return top holders
  return holders.sort((a, b) => (BigInt(a.balance) > BigInt(b.balance) ? -1 : 1)).slice(0, TOP_HOLDERS_COUNT);
}

function getTopHoldersForTokens(allTransfers: TransferFragment[], tokenIds: string[]): { [tokenId: string]: Holder[] } {
  const result: { [tokenId: string]: Holder[] } = {};

  // Get top holders for each token using the already fetched data
  for (const tokenId of tokenIds) {
    const tokenTransfers = getTransactionsForToken(allTransfers, tokenId);
    const holders = getHolders(tokenTransfers);
    result[tokenId.toLowerCase()] = holders;
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

    // Get all transactions for all tokens in a single fetch
    const allTransfers = await getAllTransactionsForTokens(tokenIds, chainIdNum as SupportedChain);

    // Get top holders for each token using the fetched data
    const topHolders = getTopHoldersForTokens(allTransfers, tokenIds);

    // Get last 100 transactions across all tokens
    const recentTransactions = getRecentTransactions(allTransfers, 100);

    return new Response(
      JSON.stringify({
        topHolders,
        recentTransactions,
        totalTokens: tokenIds.length,
        totalTransactions: recentTransactions.length,
        tokenIds: tokenIds.map((id) => id.toLowerCase()),
        chainId: chainIdNum,
      }),
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
