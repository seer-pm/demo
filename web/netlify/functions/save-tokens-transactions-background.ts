import { graphQLClient } from "@seer-pm/sdk/subgraph";
import { Order_By, type Transfer_Bool_Exp, getSdk as getSeerSdk } from "@seer-pm/sdk/subgraph/seer";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_PROJECT_URL!, process.env.SUPABASE_API_KEY!);

export default async () => {
  let initialTimestamp: number | undefined = undefined;

  const { data: maxTimestampData, error: maxTimestampError } = await supabase
    .from("tokens_transfers")
    .select("timestamp")
    .order("timestamp", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (maxTimestampError) {
    console.error("Error fetching max timestamp from tokens_transfers:", maxTimestampError);
  } else if (maxTimestampData?.timestamp) {
    initialTimestamp = Number(maxTimestampData.timestamp);
  }

  console.log("initialTimestamp", initialTimestamp);

  const sdk = getSeerSdk(graphQLClient(100));
  const where: Transfer_Bool_Exp = initialTimestamp != null ? { timestamp: { _gt: String(initialTimestamp) } } : {};

  // Scheduled every ~5 minutes: fetching up to 1000 newer transfers per run is enough to stay ahead of the tip.
  // For large historical backfills use scripts/import-token-transfers/ instead of raising this limit.
  const { Transfer: rawTransfers = [] } = await sdk.GetTransfers({
    limit: 1000,
    offset: 0,
    where,
    orderBy: [{ timestamp: Order_By.Asc }],
  });

  const allTransfers = rawTransfers.filter(
    (t): t is typeof t & { token: { id: string } } => t.token != null && t.token.id != null,
  );

  console.log("transfersToInsert", allTransfers.length);
  if (allTransfers.length === 0) {
    return;
  }

  const transfersToInsert = allTransfers.map((transfer) => ({
    block_number: Number(transfer.blockNumber),
    timestamp: Number(transfer.timestamp),
    from: transfer.from,
    to: transfer.to,
    tx_hash: transfer.transactionHash,
    chain_id: transfer.chainId,
    token: transfer.token.id,
    value: transfer.value,
    log_index: Number(transfer.logIndex),
  }));

  console.log(`Upserting ${transfersToInsert.length} transfers...`);

  const { error: insertError } = await supabase.from("tokens_transfers").upsert(transfersToInsert, {
    onConflict: "chain_id,tx_hash,log_index",
  });

  if (insertError) {
    console.error("Error upserting tokens_transfers:", insertError);
    throw new Error(`Error upserting tokens_transfers: ${insertError.message}`);
  }

  console.log(`Completed upserting ${transfersToInsert.length} transfers`);
};
