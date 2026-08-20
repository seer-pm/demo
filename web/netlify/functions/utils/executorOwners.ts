import { createClient } from "@supabase/supabase-js";
import { type Address, getAddress, zeroAddress } from "viem";
import { getPublicClientByChainId } from "./config";
import { type OwnerMapRecord, isOwnerMapStale, parseOwnerMapRecord, unknownOwnerCandidates } from "./ownerMapRecord";
import type { Database, Json } from "./supabase";
import {
  type OwnerMap,
  type TradeExecutorChainConfig,
  getTradeExecutorConfig,
  ownerMapKey,
  predictedExecutorsForOwner,
} from "./tradeExecutorOwnersCore";

export {
  TRADE_EXECUTOR_CHAIN_IDS,
  TRADE_EXECUTOR_CHAINS,
  canonicalAddress,
  getTradeExecutorConfig,
  hasTradeExecutorConfig,
  jobUsesTradeExecutors,
  ownerMapKey,
  predictExecutorAddress,
  predictedExecutorsForOwner,
  type OwnerMap,
  type TradeExecutorChainConfig,
} from "./tradeExecutorOwnersCore";

export {
  OWNER_MAP_TTL_MS,
  isOwnerMapStale,
  parseOwnerMapRecord,
  unknownOwnerCandidates,
  type OwnerMapRecord,
} from "./ownerMapRecord";

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

export async function readOwnerMapRecord(chainId: number): Promise<OwnerMapRecord> {
  const { data, error } = await supabase
    .from("key_value")
    .select("value")
    .eq("key", ownerMapKey(chainId))
    .maybeSingle();
  if (error) throw error;
  return parseOwnerMapRecord(data?.value);
}

export async function readOwnerMap(chainId: number): Promise<OwnerMap> {
  if (!getTradeExecutorConfig(chainId)) return {};
  return (await readOwnerMapRecord(chainId)).owners;
}

async function writeOwnerMapRecord(chainId: number, owners: OwnerMap, scannedOwners: string[]): Promise<void> {
  const value = {
    updatedAt: new Date().toISOString(),
    owners,
    scannedOwners: [...new Set(scannedOwners.map((address) => address.toLowerCase()))],
  };
  const { error } = await supabase
    .from("key_value")
    .upsert({ key: ownerMapKey(chainId), value: value as Json }, { onConflict: "key" });
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

type ProbedOwnerMap = {
  owners: OwnerMap;
  deployedCount: number;
  otherContracts: number;
};

async function probeOwnerMap(
  chainId: number,
  config: TradeExecutorChainConfig,
  unique: string[],
): Promise<ProbedOwnerMap> {
  const client = getPublicClientByChainId(chainId);

  const candidates: { executor: string; owner: string }[] = [];
  for (const owner of unique) {
    for (const executor of predictedExecutorsForOwner(owner, config)) {
      candidates.push({ executor, owner });
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

  return { owners, deployedCount: deployed.length, otherContracts: contracts.length };
}

function mergeProbedOwnerMap(
  config: TradeExecutorChainConfig,
  existing: OwnerMapRecord,
  unique: string[],
  probed: OwnerMap,
): OwnerMapRecord {
  const owners = { ...existing.owners };
  const scanned = new Set(existing.scannedOwners);
  for (const owner of unique) {
    scanned.add(owner);
    for (const executor of predictedExecutorsForOwner(owner, config)) {
      if (owners[executor] === owner) delete owners[executor];
    }
  }
  for (const [executor, owner] of Object.entries(probed)) {
    owners[executor] = owner;
    scanned.add(executor);
    scanned.add(owner);
  }
  return {
    updatedAt: new Date().toISOString(),
    owners,
    scannedOwners: [...scanned],
  };
}

/**
 * Probe `addresses` on-chain, merge into the stored map, and persist.
 *
 * Derive each address's executor addresses, keep the ones that have bytecode, and confirm
 * ownership with `owner()`. Addresses whose own code is a 7702 delegation are left alone.
 */
export async function refreshOwnerMap(chainId: number, addresses: string[]): Promise<OwnerMap> {
  const config = getTradeExecutorConfig(chainId);
  if (!config) return {};

  const refreshStartedMs = Date.now();
  const unique = [...new Set(addresses.map((address) => address.toLowerCase()))];
  if (unique.length === 0) {
    const existing = await readOwnerMapRecord(chainId);
    return existing.owners;
  }

  const existing = await readOwnerMapRecord(chainId);
  const probed = await probeOwnerMap(chainId, config, unique);
  const merged = mergeProbedOwnerMap(config, existing, unique, probed.owners);
  await writeOwnerMapRecord(chainId, merged.owners, merged.scannedOwners);
  console.log(
    `executorOwners[${chainId}]: ${unique.length} owners, ${probed.deployedCount} derived executors, ` +
      `${probed.otherContracts} other contracts, ${Object.keys(merged.owners).length} rolled up ` +
      `+${Date.now() - refreshStartedMs}ms`,
  );
  return merged.owners;
}

/**
 * Prefer the KV map. RPC only when it is empty/stale or the candidate list has unseen addresses.
 */
export async function resolveOwnerMap(chainId: number, addresses: string[]): Promise<OwnerMap> {
  if (!getTradeExecutorConfig(chainId)) return {};

  const record = await readOwnerMapRecord(chainId);
  if (isOwnerMapStale(record)) {
    return refreshOwnerMap(chainId, addresses);
  }
  const unknown = unknownOwnerCandidates(addresses, record);
  if (unknown.length === 0) {
    console.log(
      `executorOwners[${chainId}]: cache hit scanned=${record.scannedOwners.length} rolled=${Object.keys(record.owners).length}`,
    );
    return record.owners;
  }
  return refreshOwnerMap(chainId, unknown);
}

/** Every executor address in the map — the wallets that must also be scored. */
export function executorsOf(owners: OwnerMap): string[] {
  return Object.keys(owners);
}
