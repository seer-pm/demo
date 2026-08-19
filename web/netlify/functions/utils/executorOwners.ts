import { createClient } from "@supabase/supabase-js";
import { type Address, getAddress, zeroAddress } from "viem";
import { getPublicClientByChainId } from "./config";
import type { Database } from "./supabase";
import {
  EXECUTOR_BYTECODES,
  OWNER_MAP_KEY,
  type OwnerMap,
  TRADE_EXECUTOR_CHAIN_ID,
  predictExecutorAddress,
} from "./tradeExecutorOwnersCore";

export {
  OWNER_MAP_KEY,
  TRADE_EXECUTOR_CHAIN_ID,
  canonicalAddress,
  predictExecutorAddress,
  type OwnerMap,
} from "./tradeExecutorOwnersCore";

const supabase = createClient<Database>(process.env.SUPABASE_PROJECT_URL!, process.env.SUPABASE_API_KEY!);

/** `0xef0100 || address` — EIP-7702 delegation. The account is still the user's own EOA. */
const EIP_7702_PREFIX = "0xef0100";

const OWNER_ABI = [
  {
    inputs: [],
    name: "owner",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

interface StoredOwnerMap {
  updatedAt: string;
  owners: OwnerMap;
}

export async function readOwnerMap(): Promise<OwnerMap> {
  const { data, error } = await supabase.from("key_value").select("value").eq("key", OWNER_MAP_KEY).maybeSingle();
  if (error) throw error;
  return (data?.value as StoredOwnerMap | undefined)?.owners ?? {};
}

async function writeOwnerMap(owners: OwnerMap): Promise<void> {
  const { error } = await supabase
    .from("key_value")
    .upsert(
      { key: OWNER_MAP_KEY, value: { updatedAt: new Date().toISOString(), owners } satisfies StoredOwnerMap },
      { onConflict: "key" },
    );
  if (error) throw error;
}

const CODE_CONCURRENCY = 10;
const OWNER_BATCH = 50;

async function mapPool<T, R>(items: T[], concurrency: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) || 0 }, async () => {
      while (next < items.length) {
        const index = next++;
        results[index] = await fn(items[index]);
      }
    }),
  );
  return results;
}

/**
 * Rebuild the map for `addresses` and store it.
 *
 * Derive each address's executor addresses, keep the ones that have bytecode, and confirm
 * ownership with `owner()`. Addresses whose own code is a 7702 delegation are left alone.
 */
export async function refreshOwnerMap(addresses: string[]): Promise<OwnerMap> {
  const unique = [...new Set(addresses.map((address) => address.toLowerCase()))];
  if (unique.length === 0) return {};

  const client = getPublicClientByChainId(TRADE_EXECUTOR_CHAIN_ID);

  const candidates: { executor: string; owner: string }[] = [];
  for (const owner of unique) {
    for (const bytecode of EXECUTOR_BYTECODES) {
      const executor = predictExecutorAddress(owner as Address, bytecode).toLowerCase();
      if (executor !== owner) candidates.push({ executor, owner });
    }
  }

  const deployed = (
    await mapPool(candidates, CODE_CONCURRENCY, async (candidate) => {
      try {
        const code = await client.getCode({ address: candidate.executor as Address });
        return code && code !== "0x" ? candidate : null;
      } catch {
        return null;
      }
    })
  ).filter((candidate): candidate is { executor: string; owner: string } => candidate !== null);

  const owners: OwnerMap = {};
  for (const { executor, owner } of deployed) {
    owners[executor] = owner;
  }

  const selfCodes = await mapPool(unique, CODE_CONCURRENCY, async (address) => {
    try {
      const code = await client.getCode({ address: address as Address });
      return { address, code: code ?? "0x" };
    } catch {
      return { address, code: "0x" };
    }
  });

  const contracts = selfCodes
    .filter(({ code }) => code !== "0x" && !code.toLowerCase().startsWith(EIP_7702_PREFIX))
    .map(({ address }) => address)
    .filter((address) => !owners[address]);

  for (let i = 0; i < contracts.length; i += OWNER_BATCH) {
    const batch = contracts.slice(i, i + OWNER_BATCH);
    const results = await client.multicall({
      allowFailure: true,
      contracts: batch.map((address) => ({
        address: address as Address,
        abi: OWNER_ABI,
        functionName: "owner" as const,
      })),
    });
    results.forEach((result, index) => {
      if (result.status !== "success") return;
      const owner = result.result as Address | undefined;
      if (!owner || owner === zeroAddress) return;
      const ownerLc = getAddress(owner).toLowerCase();
      if (ownerLc === batch[index]) return;
      owners[batch[index]] = ownerLc;
    });
  }

  await writeOwnerMap(owners);
  console.log(
    `executorOwners: ${unique.length} owners, ${deployed.length} derived executors, ` +
      `${contracts.length} other contracts, ${Object.keys(owners).length} rolled up`,
  );
  return owners;
}

/** Every executor address in the map — the wallets that must also be scored. */
export function executorsOf(owners: OwnerMap): string[] {
  return Object.keys(owners);
}
