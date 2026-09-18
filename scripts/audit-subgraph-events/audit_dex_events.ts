/**
 * Counts the DEX events a subgraph stored against the ones the chain actually emitted.
 *
 * These subgraphs key an event on `<txHash>#<counter>`. Where that counter lives on the pool it is
 * only unique per pool, so a transaction touching several pools hands two of them the same id and
 * the second entity is saved over the first. Nothing errors and nothing is logged, so the only way
 * to see the loss is to count the logs. Run it against a candidate deployment before moving the
 * `latest` tag onto it.
 *
 * Usage (from repository root):
 *   npx --yes tsx ./scripts/audit-subgraph-events/audit_dex_events.ts <subgraphUrl> [blocks]
 *
 *   npx --yes tsx ./scripts/audit-subgraph-events/audit_dex_events.ts \
 *     https://api.goldsky.com/api/public/<project>/subgraphs/swapr-algebra/4.0.0/gn 5000
 */
import { argv, env, exit } from "node:process";

/** `Swap`, `Mint` and `Burn` share their topic across Uniswap v3 and Algebra: same signatures. */
const TOPICS = {
  swaps: "0xc42079f94a6350d7e6235f29174924f928cc2ac818eb64fed8004e115fbcca67",
  mints: "0x7a53080ba414158be7ec69b987b5fb7d07dee101fe85488f0853ae16239d0bde",
  burns: "0x0c396cd989a39f4459b5fa1aed6a9a8dcdbc45908acfd67e028cd568da98982c",
} as const;

type Entity = keyof typeof TOPICS;

const RPC_URL = env.AUDIT_RPC_URL ?? "https://rpc.gnosischain.com";
/** One `id_in` page; ids are unique, so a page of this size matches at most this many rows. */
const PAGE_SIZE = 1000;
/**
 * Blocks per `eth_getLogs` call.
 *
 * Small because a public node answers a wide range with a truncated list rather than an error:
 * asking `rpc.gnosischain.com` for 40000 blocks of the swap topic returns 144 logs where 1000
 * blocks return 407. An audit built on a short log set would report a clean subgraph, which is the
 * one answer it must never give wrongly.
 */
const LOG_CHUNK_BLOCKS = Number(env.AUDIT_LOG_CHUNK_BLOCKS ?? 1000);

type Log = { address: string; blockNumber: string; transactionHash: string };

async function rpc<T>(method: string, params: unknown[]): Promise<T> {
  const res = await fetch(RPC_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  const json = (await res.json()) as { result?: T; error?: { message: string } };
  if (json.error) throw new Error(`${method}: ${json.error.message}`);
  return json.result as T;
}

/** `eth_getLogs` over `[fromBlock, toBlock]`, in chunks the node answers in full. */
async function getLogsChunked(topic: string, fromBlock: number, toBlock: number): Promise<Log[]> {
  const logs: Log[] = [];
  for (let start = fromBlock; start <= toBlock; start += LOG_CHUNK_BLOCKS) {
    const end = Math.min(start + LOG_CHUNK_BLOCKS - 1, toBlock);
    const page = await rpc<Log[]>("eth_getLogs", [
      { fromBlock: `0x${start.toString(16)}`, toBlock: `0x${end.toString(16)}`, topics: [topic] },
    ]);
    logs.push(...page);
  }
  return logs;
}

async function graphql<T>(url: string, query: string): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query }),
  });
  const json = (await res.json()) as { data?: T; errors?: { message: string }[] };
  if (json.errors?.length) throw new Error(json.errors.map((e) => e.message).join("; "));
  if (!json.data) throw new Error("subgraph returned no data");
  return json.data;
}

/** Which of these log emitters the subgraph knows as pools. Anything else belongs to another DEX. */
async function knownPools(url: string, addresses: string[]): Promise<Set<string>> {
  const known = new Set<string>();
  for (let i = 0; i < addresses.length; i += 100) {
    const ids = addresses.slice(i, i + 100).map((a) => `"${a}"`).join(",");
    const { pools } = await graphql<{ pools: { id: string }[] }>(url, `{ pools(first: ${PAGE_SIZE}, where: {id_in: [${ids}]}) { id } }`);
    for (const pool of pools) known.add(pool.id.toLowerCase());
  }
  return known;
}

/** Every stored entity of `entity` in the block range, over as many pages as it takes. */
async function storedEvents(url: string, entity: Entity, fromBlock: number, toBlock: number) {
  const rows: { id: string; transaction: { id: string } }[] = [];
  let lastId = "";
  while (true) {
    const where = `{transaction_: {blockNumber_gte: "${fromBlock}", blockNumber_lte: "${toBlock}"}, id_gt: "${lastId}"}`;
    const page = await graphql<Record<Entity, typeof rows>>(
      url,
      `{ ${entity}(first: ${PAGE_SIZE}, orderBy: id, orderDirection: asc, where: ${where}) { id transaction { id } } }`,
    );
    const items = page[entity];
    if (items.length === 0) return rows;
    rows.push(...items);
    const next = items[items.length - 1]?.id;
    if (!next || next === lastId) return rows;
    lastId = next;
  }
}

async function main() {
  const url = argv[2];
  const blocks = Number(argv[3] ?? 2000);
  if (!url || !Number.isFinite(blocks) || blocks <= 0) {
    console.error("usage: audit_dex_events.ts <subgraphUrl> [blocks]");
    exit(1);
  }

  const chainHead = Number.parseInt(await rpc<string>("eth_blockNumber", []), 16);
  // The window ends at whichever head is lower, short of it. A deployment still catching up has
  // indexed nothing past its own head, so measuring against the chain's would count every event
  // since as lost and report a clean subgraph as broken. Reading its own head instead lets a
  // candidate be audited while it syncs, which is the only way to check one before a long reindex
  // finishes.
  const { _meta } = await graphql<{ _meta: { block: { number: number } } }>(url, "{ _meta { block { number } } }");
  const toBlock = Math.min(chainHead, _meta.block.number) - 200;
  const fromBlock = toBlock - blocks;
  console.log(`rpc ${RPC_URL}\nchain head ${chainHead} | subgraph head ${_meta.block.number}\nblocks ${fromBlock}..${toBlock}\nsubgraph ${url}\n`);

  let lost = 0;
  for (const entity of Object.keys(TOPICS) as Entity[]) {
    const logs = await getLogsChunked(TOPICS[entity], fromBlock, toBlock);
    const pools = await knownPools(url, [...new Set(logs.map((l) => l.address.toLowerCase()))]);
    const onChain = logs.filter((l) => pools.has(l.address.toLowerCase()));
    if (onChain.length === 0) {
      console.log(`${entity.padEnd(6)} no logs on this subgraph's pools in the window`);
      continue;
    }
    const stored = await storedEvents(url, entity, fromBlock, toBlock);
    const missing = onChain.length - stored.length;
    lost += Math.max(missing, 0);
    const pct = ((missing / onChain.length) * 100).toFixed(1);
    console.log(`${entity.padEnd(6)} on-chain ${String(onChain.length).padStart(5)} | stored ${String(stored.length).padStart(5)} | lost ${String(missing).padStart(5)} (${pct}%)`);
  }

  console.log(lost === 0 ? "\nOK: every event on chain is in the subgraph." : `\nFAIL: ${lost} events on chain are missing from the subgraph.`);
  exit(lost === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  exit(1);
});
