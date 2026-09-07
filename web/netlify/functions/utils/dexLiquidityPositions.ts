import { type SupportedChain, isOpStack } from "@seer-pm/sdk/chains";
import { swaprGraphQLClient } from "@seer-pm/sdk/subgraph";
import { gnosis } from "viem/chains";
import { getDexGraphQLClient, runGoldskyDexRequest } from "./goldskyClient";

/**
 * One concentrated-liquidity position, attributed to whoever actually owns it.
 *
 * `sqrtPrice` rides along because the `Position` entity carries its pool inline: the amounts this
 * position represents are a function of the pool's *current* price, and fetching it separately
 * would leave a window in which the two disagree.
 */
export type LiquidityLeg = {
  /** Position NFT id, so a caller can attribute or de-duplicate. */
  id: string;
  owner: string;
  poolId: string;
  sqrtPrice: bigint;
  token0: string;
  token1: string;
  tickLower: number;
  tickUpper: number;
  liquidity: bigint;
};

type PositionFilter = { owner_in: string[] } | { id_in: string[] } | { pool_in: string[] };

const PAGE_SIZE = 1000;
const ID_BATCH_SIZE = 500;

/**
 * Whether this chain's DEX subgraph exposes the `Position` entity.
 *
 * Only Gnosis (Swapr's Algebra deployment) does among the chains that hold Seer markets. The
 * Optimism and Base Uniswap v3 deployments in use expose mints, burns and swaps only — verified
 * against both gateways — so those chains fall back to netting mint/burn events by `tx.origin`.
 */
export function supportsPositionEntity(chainId: SupportedChain): boolean {
  return chainId === gnosis.id;
}

/** True for chains with any supported LP source at all; Bunni and the rest are not attributed. */
export function supportsLiquidityAttribution(chainId: SupportedChain): boolean {
  return supportsPositionEntity(chainId) || isOpStack(chainId);
}

function chunk<T>(items: T[], size: number): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    batches.push(items.slice(i, i + size));
  }
  return batches;
}

type RawPosition = {
  id: string;
  owner: string;
  liquidity: string;
  tickLower: { tickIdx: string };
  tickUpper: { tickIdx: string };
  token0: { id: string };
  token1: { id: string };
  pool: { id: string; sqrtPrice: string };
};

/**
 * Every position matching `filter`, paginated to exhaustion.
 *
 * Paged on `id_gt` with `orderBy: id` rather than on `skip`: The Graph caps `skip` at 5000 and
 * silently truncates past it, which is the same defect class the mint/burn crawl documents. A short
 * page is not evidence of the end — the gateway can cap a response independently of `first` — so
 * only an empty page stops the loop.
 */
async function fetchPositionsPage(chainId: SupportedChain, filter: PositionFilter): Promise<RawPosition[]> {
  const client = getDexGraphQLClient(chainId);
  const query = `
    query SeerLiquidityPositions($where: Position_filter) {
      positions(first: ${PAGE_SIZE}, orderBy: id, orderDirection: asc, where: $where) {
        id
        owner
        liquidity
        tickLower { tickIdx }
        tickUpper { tickIdx }
        token0 { id }
        token1 { id }
        pool { id sqrtPrice }
      }
    }`;

  const all: RawPosition[] = [];
  let lastId = "";
  while (true) {
    const where = { ...filter, liquidity_gt: "0", id_gt: lastId };
    const data = await runGoldskyDexRequest(
      () => client.request<{ positions: RawPosition[] }>(query, { where }),
      "SeerLiquidityPositions",
    );
    const page = data?.positions ?? [];
    if (page.length === 0) break;
    all.push(...page);
    const next = page[page.length - 1]?.id;
    if (!next || next === lastId) break;
    lastId = next;
  }
  return all;
}

async function fetchPositions(chainId: SupportedChain, filter: PositionFilter): Promise<RawPosition[]> {
  const values = Object.values(filter)[0] as string[];
  if (values.length === 0) return [];
  const batches = chunk(values, ID_BATCH_SIZE);
  const key = Object.keys(filter)[0] as keyof PositionFilter;
  const results = await Promise.all(
    batches.map((batch) => fetchPositionsPage(chainId, { [key]: batch } as PositionFilter)),
  );
  return results.flat();
}

/**
 * Position NFT id -> the address that staked it, for NFTs currently held by the farming centre.
 *
 * Staking transfers the position NFT to Algebra's farming centre, so `Position.owner` reads as that
 * contract for every staked position. On Seer that is not an edge case: every pool with farming
 * deposits is an outcome-token pool. Without this remap, switching attribution from `tx.origin` to
 * `Position.owner` would move all farmed liquidity off its owner's portfolio and onto a contract.
 */
async function fetchFarmingDepositOwners(filter: { owner_in: string[] } | { id_in: string[] }) {
  const client = swaprGraphQLClient(gnosis.id, "algebrafarming");
  const owners = new Map<string, string>();
  if (!client) {
    console.warn("dexLiquidityPositions: algebra farming subgraph unavailable; staked LP is unattributed");
    return owners;
  }
  const values = Object.values(filter)[0] as string[];
  if (values.length === 0) return owners;
  const key = Object.keys(filter)[0] as "owner_in" | "id_in";

  const query = `
    query SeerFarmingDeposits($where: Deposit_filter) {
      deposits(first: ${PAGE_SIZE}, orderBy: id, orderDirection: asc, where: $where) {
        id
        owner
      }
    }`;

  for (const batch of chunk(values, ID_BATCH_SIZE)) {
    let lastId = "";
    while (true) {
      const where = { [key]: batch, onFarmingCenter: true, id_gt: lastId };
      const data = await runGoldskyDexRequest(
        () => client.request<{ deposits: { id: string; owner: string }[] }>(query, { where }),
        "SeerFarmingDeposits",
      );
      const page = data?.deposits ?? [];
      if (page.length === 0) break;
      for (const deposit of page) {
        owners.set(deposit.id, deposit.owner.toLowerCase());
      }
      const next = page[page.length - 1]?.id;
      if (!next || next === lastId) break;
      lastId = next;
    }
  }
  return owners;
}

function toLeg(position: RawPosition, owner: string): LiquidityLeg {
  return {
    id: position.id,
    owner: owner.toLowerCase(),
    poolId: position.pool.id.toLowerCase(),
    sqrtPrice: BigInt(position.pool.sqrtPrice),
    token0: position.token0.id.toLowerCase(),
    token1: position.token1.id.toLowerCase(),
    tickLower: Number(position.tickLower.tickIdx),
    tickUpper: Number(position.tickUpper.tickIdx),
    liquidity: BigInt(position.liquidity),
  };
}

/**
 * Every live LP position belonging to `wallets`, held directly or staked in farming.
 *
 * Owner-keyed, so it needs no market list and costs one query per chain however many wallets are
 * asked about — and, unlike netting mint/burn events by `tx.origin`, it follows the position NFT
 * and attributes positions opened by contracts (a Safe, a forwarder) to the contract that owns them.
 */
export async function fetchWalletLiquidityLegs(chainId: SupportedChain, wallets: string[]): Promise<LiquidityLeg[]> {
  if (!supportsPositionEntity(chainId) || wallets.length === 0) return [];
  const owners = wallets.map((wallet) => wallet.toLowerCase());
  const stakedOwners = await fetchFarmingDepositOwners({ owner_in: owners });
  const [held, staked] = await Promise.all([
    fetchPositions(chainId, { owner_in: owners }),
    fetchPositions(chainId, { id_in: [...stakedOwners.keys()] }),
  ]);

  const legs = new Map<string, LiquidityLeg>();
  for (const position of held) {
    legs.set(position.id, toLeg(position, position.owner));
  }
  for (const position of staked) {
    const owner = stakedOwners.get(position.id);
    if (owner) legs.set(position.id, toLeg(position, owner));
  }
  return [...legs.values()];
}

/** Every live LP position in `poolIds`, with staked positions credited to who staked them. */
export async function fetchPoolLiquidityLegs(chainId: SupportedChain, poolIds: string[]): Promise<LiquidityLeg[]> {
  if (!supportsPositionEntity(chainId) || poolIds.length === 0) return [];
  const positions = await fetchPositions(chainId, { pool_in: poolIds.map((id) => id.toLowerCase()) });
  if (positions.length === 0) return [];
  const stakedOwners = await fetchFarmingDepositOwners({ id_in: positions.map((position) => position.id) });
  return positions.map((position) => toLeg(position, stakedOwners.get(position.id) ?? position.owner));
}
