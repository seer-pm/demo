import { type SupportedChain, isOpStack } from "@seer-pm/sdk/chains";
import {
  type Deposit_Filter,
  Deposit_OrderBy,
  OrderDirection,
  type Position_Filter,
  Position_OrderBy,
} from "@seer-pm/sdk/subgraph/swapr";
import type { Address } from "viem";
import { gnosis } from "viem/chains";
import { getDexSubgraphSdk, getSwaprAlgebraFarmingSdk, getSwaprAlgebraSdk } from "./goldskyClient";

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

const PAGE_SIZE = 1000;
const ID_BATCH_SIZE = 500;

/**
 * Whether this chain's DEX subgraph exposes the `Position` entity.
 *
 * Only Gnosis (Swapr's Algebra deployment) does among the chains that hold Seer markets. The
 * Optimism and Base Uniswap v3 deployments in use expose mints, burns and swaps only — verified
 * against both gateways — so those chains fall back to netting mint/burn events by `tx.origin`.
 * The generated Uniswap types do carry `Position`, because codegen reads the mainnet schema; that
 * is a fact about the schema, not about the deployments this queries, so the gate stays runtime.
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

/**
 * Every page of `query`, cursored on `id_gt`.
 *
 * Cursored rather than paged on `skip`: The Graph caps `skip` at 5000 and silently truncates past
 * it, the same defect class the mint/burn crawl documents. A short page is not evidence of the end
 * either — the gateway can cap a response independently of `first` — so only an empty page stops it.
 */
async function paginateById<T extends { id: string }>(
  query: (idGt: string) => Promise<T[]>,
  onPage: (rows: T[]) => void,
): Promise<void> {
  let lastId = "";
  while (true) {
    const page = await query(lastId);
    if (page.length === 0) return;
    onPage(page);
    const next = page[page.length - 1]?.id;
    if (!next || next === lastId) return;
    lastId = next;
  }
}

type RawPosition = Awaited<ReturnType<ReturnType<typeof getSwaprAlgebraSdk>["GetLiquidityPositions"]>>["positions"][0];

/** Which side of the index to read positions from: their owner, their pool, or their NFT id. */
type PositionScope =
  | Required<Pick<Position_Filter, "owner_in">>
  | Required<Pick<Position_Filter, "id_in">>
  | Required<Pick<Position_Filter, "pool_in">>;

/** Every live position in `scope`, over as many batches and pages as it takes. */
async function fetchPositions(scope: PositionScope): Promise<RawPosition[]> {
  const [key, values] = Object.entries(scope)[0] as [keyof Position_Filter, string[]];
  if (values.length === 0) return [];
  const sdk = getSwaprAlgebraSdk();
  const all: RawPosition[] = [];

  await Promise.all(
    chunk(values, ID_BATCH_SIZE).map((batch) =>
      paginateById<RawPosition>(
        async (idGt) => {
          const { positions } = await sdk.GetLiquidityPositions({
            first: PAGE_SIZE,
            orderBy: Position_OrderBy.Id,
            orderDirection: OrderDirection.Asc,
            where: { [key]: batch, liquidity_gt: "0", id_gt: idGt },
          });
          return positions;
        },
        (rows) => all.push(...rows),
      ),
    ),
  );
  return all;
}

/** Which side of the deposits index to read: the staker, or the NFT ids we already have. */
type DepositScope = Required<Pick<Deposit_Filter, "owner_in">> | Required<Pick<Deposit_Filter, "id_in">>;

/**
 * Position NFT id -> the address that staked it, for NFTs currently held by the farming centre.
 *
 * Staking leaves the position NFT owned by Algebra's farming centre, so `Position.owner` reads as
 * that contract for every staked position — verified across the whole deposit set, where the two
 * are exactly the same 102 NFTs and no deposit's own owner matches. On Seer this is not an edge
 * case: every pool with farming deposits is an outcome-token pool. Without this remap, attributing
 * by `Position.owner` would move all farmed liquidity off its owner's portfolio onto a contract.
 *
 * Keyed on the deposits table rather than on the farming centre's address, so it stays correct if
 * that address ever changes.
 */
async function fetchFarmingDepositOwners(scope: DepositScope): Promise<Map<string, string>> {
  const [key, values] = Object.entries(scope)[0] as [keyof Deposit_Filter, string[]];
  const owners = new Map<string, string>();
  if (values.length === 0) return owners;
  const sdk = getSwaprAlgebraFarmingSdk();

  for (const batch of chunk(values, ID_BATCH_SIZE)) {
    await paginateById<{ id: string; owner: string }>(
      async (idGt) => {
        const { deposits } = await sdk.GetDeposits({
          first: PAGE_SIZE,
          orderBy: Deposit_OrderBy.Id,
          orderDirection: OrderDirection.Asc,
          where: { [key]: batch, onFarmingCenter: true, id_gt: idGt },
        });
        return deposits;
      },
      (rows) => {
        for (const deposit of rows) owners.set(deposit.id, deposit.owner.toLowerCase());
      },
    );
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
export async function fetchWalletLiquidityLegs(chainId: SupportedChain, wallets: Address[]): Promise<LiquidityLeg[]> {
  if (!supportsPositionEntity(chainId) || wallets.length === 0) return [];
  const owners = wallets.map((wallet) => wallet.toLowerCase() as Address);
  const stakedOwners = await fetchFarmingDepositOwners({ owner_in: owners });
  const [held, staked] = await Promise.all([
    fetchPositions({ owner_in: owners }),
    fetchPositions({ id_in: [...stakedOwners.keys()] }),
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
  const positions = await fetchPositions({ pool_in: poolIds.map((id) => id.toLowerCase()) });
  if (positions.length === 0) return [];
  const stakedOwners = await fetchFarmingDepositOwners({ id_in: positions.map((position) => position.id) });
  return positions.map((position) => toLeg(position, stakedOwners.get(position.id) ?? position.owner));
}

/**
 * Current `sqrtPrice` per pool, for re-deriving what a stored position holds today.
 *
 * Both subgraph flavours expose `sqrtPrice` on `Pool`, so this works wherever LP is attributed at
 * all — unlike the `Position` entity, which only Gnosis has.
 */
export async function fetchPoolSqrtPrices(chainId: SupportedChain, poolIds: string[]): Promise<Map<string, bigint>> {
  const prices = new Map<string, bigint>();
  if (!supportsLiquidityAttribution(chainId) || poolIds.length === 0) return prices;
  const sdk = getDexSubgraphSdk(chainId);

  for (const batch of chunk([...new Set(poolIds.map((id) => id.toLowerCase()))], ID_BATCH_SIZE)) {
    // Uncursored, unlike the crawls above, and safely so: `id` is unique, so an `id_in` of
    // ID_BATCH_SIZE ids matches at most that many rows — half a PAGE_SIZE page. Raising
    // ID_BATCH_SIZE to or past PAGE_SIZE would make a batch fillable, and would need `paginateById`.
    const { pools } = await sdk.GetPoolSqrtPrices({ first: PAGE_SIZE, where: { id_in: batch } });
    for (const pool of pools) {
      prices.set(pool.id.toLowerCase(), BigInt(pool.sqrtPrice));
    }
  }
  return prices;
}
