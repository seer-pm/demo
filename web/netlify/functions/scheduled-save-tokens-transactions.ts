import { Config } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";
import { getAllTransactions } from "./utils/token-transactions";

const supabase = createClient(process.env.SUPABASE_PROJECT_URL!, process.env.SUPABASE_API_KEY!);

export default async () => {
  let initialTimestamp = "0";

  const { data: maxTimestampData, error: maxTimestampError } = await supabase
    .from("tokens_transfers")
    .select("timestamp")
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (maxTimestampError) {
    console.error("Error fetching max timestamp from tokens_transfers:", maxTimestampError);
  } else if (maxTimestampData?.timestamp) {
    initialTimestamp = String(maxTimestampData.timestamp);
  }

  console.log("initialTimestamp", initialTimestamp);

  const chainId = 100; // TODO: make multi chain
  const loopLimit = 5;
  const allTransfers = await getAllTransactions({}, initialTimestamp, chainId, loopLimit);

  console.log("transfersToInsert", allTransfers.length);

  if (allTransfers.length > 0) {
    const transfersToInsert = allTransfers.map((transfer) => ({
      block_number: transfer.block_number,
      timestamp: transfer.timestamp,
      from: transfer.from,
      to: transfer.to,
      tx_hash: transfer.tx_hash,
      chain_id: chainId,
      token: transfer.token,
      value: transfer.value.toString(),
    }));

    const { error: insertError } = await supabase.from("tokens_transfers").insert(transfersToInsert);
    if (insertError) {
      console.error("Error inserting token transfers:", insertError);
    }
  }
};

export const config: Config = {
  schedule: "*/5 * * * *",
};
