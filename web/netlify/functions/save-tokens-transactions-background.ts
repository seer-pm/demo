import type { SupportedChain } from "@seer-pm/sdk";
import { graphQLClient } from "@seer-pm/sdk/subgraph";
import { Order_By, type Transfer_Bool_Exp, getSdk as getSeerSdk } from "@seer-pm/sdk/subgraph/seer";
import { createClient } from "@supabase/supabase-js";
import { sepolia } from "viem/chains";
import { chainIds } from "./utils/config.ts";
import type { Database } from "./utils/supabase.ts";

const supabase = createClient<Database>(process.env.SUPABASE_PROJECT_URL!, process.env.SUPABASE_API_KEY!);

const PAGE_SIZE = 1000;
const UPSERT_CHUNK = 100;

async function processChain(chainId: SupportedChain) {
  let initialTimestamp: number | undefined = undefined;

  const { data: maxTimestampData, error: maxTimestampError } = await supabase
    .from("tokens_transfers")
    .select("timestamp")
    .eq("chain_id", chainId)
    .order("timestamp", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (maxTimestampError) {
    console.error(`[Chain ${chainId}] Error fetching max timestamp from tokens_transfers:`, maxTimestampError);
  } else if (maxTimestampData?.timestamp) {
    initialTimestamp = Number(maxTimestampData.timestamp);
  }

  console.log(`[Chain ${chainId}] initialTimestamp:`, initialTimestamp);

  const sdk = getSeerSdk(graphQLClient(chainId));
  const where: Transfer_Bool_Exp = {
    chainId: { _eq: String(chainId) },
    ...(initialTimestamp != null ? { timestamp: { _gt: String(initialTimestamp) } } : {}),
  };

  // Scheduled every ~5 minutes: fetching up to 1000 newer transfers per run is enough to stay ahead of the tip.
  // For large historical backfills use scripts/import-token-transfers/ instead of raising this limit.
  const { Transfer: rawTransfers = [] } = await sdk.GetTransfers({
    limit: PAGE_SIZE,
    offset: 0,
    where,
    orderBy: [{ timestamp: Order_By.Asc }],
  });

  const allTransfers = rawTransfers.filter(
    (t): t is typeof t & { token: { id: string } } => t.token != null && t.token.id != null,
  );

  console.log(`[Chain ${chainId}] transfersToInsert:`, allTransfers.length);
  if (allTransfers.length === 0) {
    return { chainId, count: 0 };
  }

  const transfersToInsert = allTransfers.map((transfer) => ({
    block_number: Number(transfer.blockNumber),
    timestamp: Number(transfer.timestamp),
    from: transfer.from,
    to: transfer.to,
    tx_hash: transfer.transactionHash,
    tx_from: transfer.transactionFrom,
    chain_id: Number(transfer.chainId),
    token: transfer.token.id,
    value: Number(transfer.value),
    log_index: Number(transfer.logIndex),
  }));

  console.log(`[Chain ${chainId}] Upserting ${transfersToInsert.length} transfers in chunks of ${UPSERT_CHUNK}...`);

  for (let i = 0; i < transfersToInsert.length; i += UPSERT_CHUNK) {
    const chunk = transfersToInsert.slice(i, i + UPSERT_CHUNK);
    const { error: insertError } = await supabase.from("tokens_transfers").upsert(chunk, {
      onConflict: "chain_id,tx_hash,log_index",
    });

    if (insertError) {
      console.error(
        `[Chain ${chainId}] Error upserting tokens_transfers chunk [${i}..${i + chunk.length}]:`,
        insertError,
      );
      throw new Error(`[Chain ${chainId}] Error upserting tokens_transfers: ${insertError.message}`);
    }
  }

  console.log(`[Chain ${chainId}] Completed upserting ${transfersToInsert.length} transfers`);
  return { chainId, count: transfersToInsert.length };
}

export default async () => {
  const activeChains = (chainIds as readonly number[]).filter(
    (chainId): chainId is SupportedChain => chainId !== sepolia.id,
  );

  const results = await Promise.allSettled(activeChains.map((chainId) => processChain(chainId)));

  for (const result of results) {
    if (result.status === "rejected") {
      console.error("Chain processing failed:", result.reason);
    }
  }
};
