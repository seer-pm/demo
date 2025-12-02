import { createClient } from "@supabase/supabase-js";
import { getAllTransfers } from "./utils/airdropCalculation/getAllTransfers";

const supabase = createClient(process.env.SUPABASE_PROJECT_URL!, process.env.SUPABASE_API_KEY!);

export default async () => {
  let initialTimestamp = 0;

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

  const chainId = 100; // TODO: make multi chain
  const allTransfers = await getAllTransfers("tokens", chainId, initialTimestamp);

  console.log("transfersToInsert", allTransfers.length);
  if (allTransfers.length > 0) {
    const transfersToInsert = allTransfers.map((transfer) => ({
      block_number: Number(transfer.blockNumber),
      timestamp: Number(transfer.timestamp),
      from: transfer.from,
      to: transfer.to,
      tx_hash: transfer.id.split("-")[0],
      chain_id: chainId,
      token: transfer.token.id,
      value: transfer.value,
      subgraph_id: `${transfer.id}-${chainId}`,
    }));

    const BATCH_SIZE = 5000;
    const batches = [];

    for (let i = 0; i < transfersToInsert.length; i += BATCH_SIZE) {
      batches.push(transfersToInsert.slice(i, i + BATCH_SIZE));
    }

    // Insert batches sequentially
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(`Inserting batch ${i + 1}/${batches.length} (${batch.length} records)...`);

      const { error: insertError } = await supabase.from("tokens_transfers").upsert(batch, {
        onConflict: "subgraph_id",
      });

      if (insertError) {
        console.log(`Error inserting batch ${i + 1}:`, insertError);
        throw new Error(`Error inserting batch ${i + 1}:`);
      }
    }

    console.log(`Completed inserting ${transfersToInsert.length} transfers in ${batches.length} batches`);
  }
};
