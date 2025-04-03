import { SupportedChain } from "@/lib/chains";
import { createClient } from "@supabase/supabase-js";
import { getBlockNumber } from "@wagmi/core";
import { config as wagmiConfig } from "./config.ts";

const supabase = createClient(process.env.VITE_SUPABASE_PROJECT_URL!, process.env.VITE_SUPABASE_API_KEY!);

export async function getLastProcessedBlock(networkId: SupportedChain, key: string): Promise<bigint> {
  const { data, error } = await supabase.from("key_value").select("value").eq("key", key).single();

  if (error) {
    if (error.code !== "PGRST116") {
      // Only throw if it's not a "not found" error
      throw error;
    }

    // default to current block - 100
    const currentBlock = await getBlockNumber(wagmiConfig, {
      chainId: networkId,
    });
    return currentBlock - 100n;
  }

  return BigInt(data.value.blockNumber);
}

export async function updateLastProcessedBlock(networkId: SupportedChain, blockNumber: bigint, key: string) {
  try {
    const { error } = await supabase.from("key_value").upsert(
      {
        key,
        value: { blockNumber: blockNumber.toString() },
      },
      { onConflict: "key" },
    );

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error(`Error updating last processed block for network ${networkId}:`, error);
    throw error;
  }
}
