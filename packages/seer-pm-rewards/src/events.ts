import {
  type Address,
  type Hex,
  type PublicClient,
  type RpcLog,
  decodeEventLog,
  encodeEventTopics,
  hexToBigInt,
  hexToNumber,
  numberToHex,
  pad,
  parseAbi,
} from "viem";
import type { SourceChain } from "./chains.ts";

const poolManagerAbi = parseAbi([
  "event Initialize(bytes32 indexed id, address indexed currency0, address indexed currency1, uint24 fee, int24 tickSpacing, address hooks, uint160 sqrtPriceX96, int24 tick)",
  "event ModifyLiquidity(bytes32 indexed id, address indexed sender, int24 tickLower, int24 tickUpper, int256 liquidityDelta, bytes32 salt)",
  "event Swap(bytes32 indexed id, address indexed sender, int128 amount0, int128 amount1, uint160 sqrtPriceX96, uint128 liquidity, int24 tick, uint24 fee)",
]);

const positionManagerAbi = parseAbi(["event Transfer(address indexed from, address indexed to, uint256 indexed id)"]);

type EventPosition = { blockNumber: bigint; logIndex: number; timestamp: number };

/** The only on-chain inputs of the reward computation, in chain order. */
export type ChainEvent = EventPosition &
  (
    | { kind: "initialize"; poolId: Hex; tick: number }
    | { kind: "swap"; poolId: Hex; tick: number }
    | {
        kind: "modifyLiquidity";
        poolId: Hex;
        sender: Address;
        tickLower: number;
        tickUpper: number;
        liquidityDelta: bigint;
        salt: Hex;
      }
    | { kind: "transfer"; tokenId: bigint; to: Address }
  );

export function sortEvents(events: ChainEvent[]): ChainEvent[] {
  return [...events].sort((a, b) =>
    a.blockNumber === b.blockNumber ? a.logIndex - b.logIndex : a.blockNumber < b.blockNumber ? -1 : 1,
  );
}

/**
 * Many providers cap `eth_getLogs` ranges or result sizes; a failed range is split in half and
 * retried, and the smaller range is kept for the rest of the scan.
 */
async function getLogs(
  client: PublicClient,
  filter: { address: Address; topics: (Hex | Hex[] | null)[] },
  fromBlock: bigint,
  toBlock: bigint,
  maxRange: bigint,
): Promise<RpcLog[]> {
  const logs: RpcLog[] = [];
  let range = maxRange;
  for (let from = fromBlock; from <= toBlock; ) {
    const to = from + range - 1n < toBlock ? from + range - 1n : toBlock;
    try {
      const chunk = await client.request({
        method: "eth_getLogs",
        params: [{ ...filter, fromBlock: numberToHex(from), toBlock: numberToHex(to) }],
      });
      logs.push(...chunk);
      from = to + 1n;
    } catch (error) {
      if (range === 1n) throw error;
      range /= 2n;
    }
  }
  return logs;
}

/** Last block with `timestamp < cutoff`. The chain head must already be past the cutoff. */
export async function findLastBlockBefore(client: PublicClient, cutoff: number, fromBlock: bigint): Promise<bigint> {
  const head = await client.getBlock();
  if (Number(head.timestamp) < cutoff) {
    throw new Error(`chain ${client.chain?.id}: head block ${head.number} is still before the cutoff`);
  }
  let lo = fromBlock - 1n; // timestamp < cutoff (or before the range)
  let hi = head.number; // timestamp >= cutoff
  while (hi - lo > 1n) {
    const mid = (lo + hi) / 2n;
    const block = await client.getBlock({ blockNumber: mid });
    if (Number(block.timestamp) < cutoff) lo = mid;
    else hi = mid;
  }
  return lo;
}

const BLOCK_FETCH_CONCURRENCY = 25;

/**
 * Pool events of `poolIds` and the PositionManager transfers of every token id that modified their
 * liquidity, from the hook deployment block through `toBlock`.
 */
export async function fetchChainEvents(
  client: PublicClient,
  source: SourceChain,
  poolIds: Hex[],
  toBlock: bigint,
  maxRange = 1_000_000n,
): Promise<ChainEvent[]> {
  const poolTopics = (["Initialize", "ModifyLiquidity", "Swap"] as const).map(
    (eventName) => encodeEventTopics({ abi: poolManagerAbi, eventName })[0],
  );
  const poolLogs = await getLogs(
    client,
    { address: source.poolManager, topics: [poolTopics, poolIds] },
    source.fromBlock,
    toBlock,
    maxRange,
  );

  const events: ChainEvent[] = [];
  const tokenIds = new Set<bigint>();
  const blockTimestamps = new Map<bigint, number>();
  const position = (log: RpcLog) => {
    const blockNumber = hexToBigInt(log.blockNumber!);
    const { blockTimestamp } = log as RpcLog & { blockTimestamp?: Hex };
    if (blockTimestamp) blockTimestamps.set(blockNumber, hexToNumber(blockTimestamp));
    return { blockNumber, logIndex: hexToNumber(log.logIndex!), timestamp: 0 };
  };

  for (const log of poolLogs) {
    const { eventName, args } = decodeEventLog({ abi: poolManagerAbi, topics: log.topics, data: log.data });
    const base = position(log);
    if (eventName === "ModifyLiquidity") {
      const { id, sender, tickLower, tickUpper, liquidityDelta, salt } = args;
      const poolId = id.toLowerCase() as Hex;
      events.push({ ...base, kind: "modifyLiquidity", poolId, sender, tickLower, tickUpper, liquidityDelta, salt });
      if (sender.toLowerCase() === source.positionManager.toLowerCase()) tokenIds.add(hexToBigInt(salt));
    } else {
      const kind = eventName === "Initialize" ? "initialize" : "swap";
      events.push({ ...base, kind, poolId: args.id.toLowerCase() as Hex, tick: args.tick });
    }
  }

  // Topic OR-lists are capped by some providers, so the token ids are queried in batches.
  const transferTopic = encodeEventTopics({ abi: positionManagerAbi, eventName: "Transfer" })[0];
  const ids = [...tokenIds].map((id) => pad(numberToHex(id), { size: 32 }));
  for (let i = 0; i < ids.length; i += 100) {
    const transferLogs = await getLogs(
      client,
      { address: source.positionManager, topics: [transferTopic, null, null, ids.slice(i, i + 100)] },
      source.fromBlock,
      toBlock,
      maxRange,
    );
    for (const log of transferLogs) {
      const { args } = decodeEventLog({ abi: positionManagerAbi, topics: log.topics, data: log.data });
      events.push({ ...position(log), kind: "transfer", tokenId: args.id, to: args.to });
    }
  }

  const missing = [...new Set(events.map((e) => e.blockNumber))].filter((n) => !blockTimestamps.has(n));
  for (let i = 0; i < missing.length; i += BLOCK_FETCH_CONCURRENCY) {
    const blocks = await Promise.all(
      missing.slice(i, i + BLOCK_FETCH_CONCURRENCY).map((blockNumber) => client.getBlock({ blockNumber })),
    );
    for (const block of blocks) blockTimestamps.set(block.number, Number(block.timestamp));
  }
  for (const event of events) event.timestamp = blockTimestamps.get(event.blockNumber)!;

  return sortEvents(events);
}
