import type { SupportedChain, TokenTransfer } from "@seer-pm/sdk";
import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import pLimit from "p-limit";
import { Address, formatUnits, zeroAddress } from "viem";

import type { Database } from "../supabase";

const supabase: SupabaseClient<Database> = createClient<Database>(
  process.env.SUPABASE_PROJECT_URL!,
  process.env.SUPABASE_API_KEY!,
);

function isAllChains(chainId: SupportedChain | 0): chainId is 0 {
  return chainId === 0;
}

export async function getAllTransfers(chainId: SupportedChain | 0, token?: Address | string) {
  const tokenFilter = token ? String(token).toLowerCase() : undefined;

  let qMin = supabase.from("tokens_transfers").select("timestamp");
  let qMax = supabase.from("tokens_transfers").select("timestamp");
  if (!isAllChains(chainId)) {
    qMin = qMin.eq("chain_id", Number(chainId));
    qMax = qMax.eq("chain_id", Number(chainId));
  }
  if (tokenFilter) {
    qMin = qMin.eq("token", tokenFilter);
    qMax = qMax.eq("token", tokenFilter);
  }

  const [{ data: minRow }, { data: maxRow }] = await Promise.all([
    qMin.order("timestamp", { ascending: true }).limit(1).maybeSingle(),
    qMax.order("timestamp", { ascending: false }).limit(1).maybeSingle(),
  ]);

  const startTime = Number(minRow?.timestamp ?? 0);
  const endTime = Number(maxRow?.timestamp ?? 0);
  if (minRow?.timestamp == null || maxRow?.timestamp == null) {
    return [];
  }

  const CHUNK_SIZE = 24 * 60 * 60 * 7; // 7 days in seconds
  const chunks: Promise<TokenTransfer[]>[] = [];
  const limit = pLimit(10);
  const exclusiveEndTime = endTime + 1;

  for (let time = startTime; time < exclusiveEndTime; time += CHUNK_SIZE) {
    chunks.push(
      limit(() =>
        fetchDatabaseTimeRange(supabase, chainId, time, Math.min(time + CHUNK_SIZE, exclusiveEndTime), tokenFilter),
      ),
    );
  }

  const results = await Promise.all(chunks);
  return results.flat();
}

export function tokensTransfersRowToTransfer(
  row: Database["public"]["Tables"]["tokens_transfers"]["Row"],
): TokenTransfer {
  return {
    id: `${row.chain_id}-${row.tx_hash}-${row.log_index}`,
    chain_id: row.chain_id,
    from: row.from as Address,
    to: row.to as Address,
    timestamp: row.timestamp,
    block_number: row.block_number,
    tx_hash: row.tx_hash,
    log_index: row.log_index,
    value: BigInt(row.value),
    token: row.token as Address,
  };
}

async function fetchDatabaseTimeRange(
  client: SupabaseClient<Database>,
  chainId: SupportedChain | 0,
  chunkStart: number,
  chunkEnd: number,
  tokenFilter?: string,
): Promise<TokenTransfer[]> {
  let allTransfers: TokenTransfer[] = [];
  let cursor:
    | {
        timestamp: number;
        chainId: number;
        blockNumber: number;
        txHash: string;
        logIndex: number;
      }
    | undefined;
  const allChains = isAllChains(chainId);

  while (!cursor || cursor.timestamp < chunkEnd) {
    let q = client
      .from("tokens_transfers")
      .select("block_number,chain_id,from,to,timestamp,token,tx_hash,value,log_index")
      .gte("timestamp", chunkStart)
      .lt("timestamp", chunkEnd)
      .order("timestamp", { ascending: true })
      .order("chain_id", { ascending: true })
      .order("block_number", { ascending: true })
      .order("tx_hash", { ascending: true })
      .order("log_index", { ascending: true })
      .limit(1000);

    if (!allChains) {
      q = q.eq("chain_id", Number(chainId));
    }
    if (tokenFilter) {
      q = q.eq("token", tokenFilter);
    }

    if (cursor) {
      q = q.or(
        [
          `timestamp.gt.${cursor.timestamp}`,
          `and(timestamp.eq.${cursor.timestamp},chain_id.gt.${cursor.chainId})`,
          `and(timestamp.eq.${cursor.timestamp},chain_id.eq.${cursor.chainId},block_number.gt.${cursor.blockNumber})`,
          `and(timestamp.eq.${cursor.timestamp},chain_id.eq.${cursor.chainId},block_number.eq.${cursor.blockNumber},tx_hash.gt.${cursor.txHash})`,
          `and(timestamp.eq.${cursor.timestamp},chain_id.eq.${cursor.chainId},block_number.eq.${cursor.blockNumber},tx_hash.eq.${cursor.txHash},log_index.gt.${cursor.logIndex})`,
        ].join(","),
      );
    }

    const { data: rows, error } = await q;
    if (error) {
      throw error;
    }

    if (!rows?.length) {
      break;
    }

    const transfers = rows.map(tokensTransfersRowToTransfer);
    allTransfers = allTransfers.concat(transfers);

    if (rows.length < 1000) {
      break;
    }
    const lastRow = rows[rows.length - 1];
    cursor = {
      timestamp: Number(lastRow.timestamp),
      chainId: Number(lastRow.chain_id),
      blockNumber: Number(lastRow.block_number),
      txHash: lastRow.tx_hash,
      logIndex: Number(lastRow.log_index),
    };
  }

  return allTransfers;
}

export function getHoldersAtTimestamp(allTransfers: TokenTransfer[], timestamp: number) {
  const records = allTransfers.filter((transfer) => Number(transfer.timestamp) <= timestamp);
  const tokenBalances: { [key: string]: { [key: string]: bigint } } = {};

  // Process each transfer
  for (const transfer of records) {
    const tokenId = transfer.token.toLowerCase();
    const from = transfer.from.toLowerCase();
    const to = transfer.to.toLowerCase();
    const value = BigInt(transfer.value);

    // Initialize token balances if not exists
    if (!tokenBalances[from]) {
      tokenBalances[from] = {};
    }
    if (!tokenBalances[to]) {
      tokenBalances[to] = {};
    }

    tokenBalances[from][tokenId] = (tokenBalances[from][tokenId] ?? 0n) - value;
    tokenBalances[to][tokenId] = (tokenBalances[to][tokenId] ?? 0n) + value;
  }

  const formattedBalances: { [key: string]: { [key: string]: number } } = {};
  for (const [user, balances] of Object.entries(tokenBalances)) {
    // Exclude zero address and non-positive balances
    if (user !== zeroAddress) {
      formattedBalances[user] = {};
      for (const [tokenId, balance] of Object.entries(balances)) {
        if (balance > 0n) {
          formattedBalances[user][tokenId] = Number(formatUnits(balance, 18));
        }
      }
    }
  }
  return formattedBalances;
}
