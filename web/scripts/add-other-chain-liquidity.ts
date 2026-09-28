/**
 * Spreads an sDAI budget as Swapr (Algebra v1) concentrated liquidity over every outcome of a chain of
 * "Other" markets created by `create-other-chain-markets.ts`.
 *
 * The final outcomes are every named outcome plus the "Other" of the last market. The "Other" of a
 * non-leaf market is the collateral of the next one, so it gets split instead of pooled. Each final
 * outcome gets its own `outcome/sDAI` pool and one position over the same sDAI price range.
 *
 * HOW THE BUDGET IS SPLIT: every outcome receives the same amount S of outcome tokens, so S complete
 * sets cover all of them: S sDAI are split in M1, the S "Other" of M1 are split in M2, and so on. When
 * the pool price sits inside the range the position also needs some sDAI (the buy side), b(P)/a(P) per
 * outcome token, where for a price P and range [pL, pU]:
 *   a(P) = 1/sqrt(P) - 1/sqrt(pU)   (outcome tokens per unit of liquidity)
 *   b(P) = sqrt(P) - sqrt(pL)       (sDAI per unit of liquidity)
 * so the budget B = S * (1 + sum b(Pi)/a(Pi)). The ratio depends on each pool's rounded ticks, and a
 * new pool's tick spacing is only known once it exists, so pools are created first and S is fixed
 * afterwards, before any collateral is split.
 *
 * Steps (each one resumable): create missing pools, fix S, split, approve the position manager, mint.
 *
 * Usage (from the `web/` directory):
 *   Dry run (default): reads the markets and pools and prints the plan.
 *     npx tsx scripts/add-other-chain-liquidity.ts --from-state tmp/create-other-chain-markets.<ts>.json --amount 5 --min-price 0.004 --max-price 0.2
 *   Execute:
 *     PRIVATE_KEY=0x... npx tsx scripts/add-other-chain-liquidity.ts --from-state tmp/<file>.json --amount 5 --min-price 0.004 --max-price 0.2 --execute
 *   Resume an interrupted run (keeps its S, range and outcome list):
 *     PRIVATE_KEY=0x... npx tsx scripts/add-other-chain-liquidity.ts --resume tmp/add-other-chain-liquidity.<ts>.json --execute
 *
 * Options:
 *   --markets <a,b,c>       Market ids from the root to the leaf. Or:
 *   --from-state <file>     A create-other-chain-markets state file to read the market ids from.
 *   --amount <sDAI>         Total budget: complete sets plus the buy side of every position.
 *   --min-price <sDAI>      Lower end of the range. Required.
 *   --max-price <sDAI>      Upper end of the range. Required.
 *   --initial-price <sDAI>  Price for pools the script creates. Default 1/N, so the prices add up to 1.
 *   --slippage <pct>        Tolerance for the minted amounts. Default 1.
 *   --priority-fee <gwei>   maxPriorityFeePerGas. Default 1.
 * Env: PRIVATE_KEY (only with --execute), RPC_URL (default: a public Gnosis RPC).
 *
 * A pool that already exists is used at its current price. If that price is at or above the upper end
 * of the range the position would hold only sDAI, so that outcome is skipped and its tokens stay in
 * the wallet. The Invalid tokens of every market (S each) also stay in the wallet.
 */
import fs from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { getRouterAddress, getSplitExecution, getToken0Token1 } from "@seer-pm/sdk";
import { marketAbi } from "@seer-pm/sdk/contracts/market-factory";
import { TickMath } from "@uniswap/v3-sdk";
import {
  type Address,
  createPublicClient,
  createWalletClient,
  encodeFunctionData,
  erc20Abi,
  formatEther,
  type Hex,
  http,
  maxUint256,
  parseAbi,
  parseEther,
  parseEventLogs,
  parseGwei,
  zeroAddress,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { gnosis } from "viem/chains";

const OTHER_OUTCOME = "Other";
const RPC = "https://rpc.gnosischain.com";
const SDAI: Address = "0xaf204776c7245bF4147c2612BF6e5972Ee483701";
// Swapr runs Algebra v1.9 on Gnosis. `poolByPair` lives on the factory the position manager points to,
// not on the pool deployer used for CREATE2 addresses.
const POSITION_MANAGER: Address = "0x91fd594c46d8b01e62dbdebed2401dde01817834";
const ALGEBRA_FACTORY: Address = "0xA0864cCA6E114013AB0e27cbd5B6f4c8947da766";
// Algebra v1 pools start with this spacing. Only used to preview ticks of pools that do not exist yet.
const DEFAULT_TICK_SPACING = 60;
const PRIORITY_FEE_GWEI = "1";
const GAS_BUFFER_PERCENT = 120n;
// EIP-7825 per-transaction gas cap. Splitting an 80-slot market estimates close to it, and estimates run
// well above the gas actually used, so the buffered limit is clamped to the cap instead of failing.
const TX_GAS_CAP = 16_777_216n;
const RECEIPT_TIMEOUT_MS = 30 * 60 * 1000;
// Idempotent txs (pool creation, approvals) are sent in flight together, this many at a time.
const PIPELINE = 20;
const Q96 = 2n ** 96n;
const OUT_DIR = "tmp";

const positionManagerAbi = parseAbi([
  "function createAndInitializePoolIfNecessary(address token0, address token1, uint160 sqrtPriceX96) payable returns (address pool)",
  "struct MintParams { address token0; address token1; int24 tickLower; int24 tickUpper; uint256 amount0Desired; uint256 amount1Desired; uint256 amount0Min; uint256 amount1Min; address recipient; uint256 deadline; }",
  "function mint(MintParams params) payable returns (uint256 tokenId, uint128 liquidity, uint256 amount0, uint256 amount1)",
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
]);
const factoryAbi = parseAbi(["function poolByPair(address, address) view returns (address)"]);
const poolAbi = parseAbi([
  "function globalState() view returns (uint160 price, int24 tick, uint16 fee, uint16 timepointIndex, uint8 communityFeeToken0, uint8 communityFeeToken1, bool unlocked)",
  "function tickSpacing() view returns (int24)",
]);

type Outcome = {
  market: number;
  index: number;
  name: string;
  token: Address;
  tokenId?: string;
  mintTx?: Hex;
  skipped?: string;
};

type State = {
  markets: Address[];
  // Wei strings.
  amount: string;
  minPrice: string;
  maxPrice: string;
  initialPrice: string;
  slippageBps: number;
  outcomes: Outcome[];
  // Outcome tokens per outcome (= complete sets per market), fixed once every pool exists.
  sets?: string;
  // Markets already split, in order.
  splitDone: number;
  // Saved before waiting for a receipt, so a resumed run waits for an in-flight split or mint instead of
  // sending it again.
  pendingTx?: { label: string; hash: Hex };
};

type PoolState = { pool: Address; sqrtPriceX96: bigint; tickSpacing: number };

type Position = {
  outcomeIsToken0: boolean;
  token0: Address;
  token1: Address;
  tickLower: number;
  tickUpper: number;
  outcomeAmount: bigint;
  sdaiAmount: bigint;
};

const { values: args } = parseArgs({
  options: {
    markets: { type: "string" },
    "from-state": { type: "string" },
    amount: { type: "string" },
    "min-price": { type: "string" },
    "max-price": { type: "string" },
    "initial-price": { type: "string" },
    slippage: { type: "string", default: "1" },
    "priority-fee": { type: "string", default: PRIORITY_FEE_GWEI },
    resume: { type: "string" },
    execute: { type: "boolean", default: false },
  },
});

const transport = http(process.env.RPC_URL ?? RPC);
const publicClient = createPublicClient({ chain: gnosis, transport });

const ceilDiv = (a: bigint, b: bigint) => (a + b - 1n) / b;

function sqrtBigInt(value: bigint): bigint {
  if (value < 2n) return value;
  let x = value;
  let y = (x + 1n) / 2n;
  while (y < x) {
    x = y;
    y = (x + value / x) / 2n;
  }
  return x;
}

const sqrtAtTick = (tick: number) => BigInt(TickMath.getSqrtRatioAtTick(tick).toString());

/** sqrtPriceX96 of a pool whose outcome trades at `priceWad` sDAI. Both tokens have 18 decimals. */
function outcomeSqrtPriceX96(priceWad: bigint, outcomeIsToken0: boolean): bigint {
  const WAD = 10n ** 18n;
  return outcomeIsToken0 ? sqrtBigInt((priceWad * Q96 * Q96) / WAD) : sqrtBigInt((WAD * Q96 * Q96) / priceWad);
}

/**
 * Ticks of the sDAI range in pool orientation, rounded outwards to the spacing. With the outcome as
 * token1 the pool quotes outcome per sDAI, so the range is inverted.
 */
function rangeTicks(state: State, outcomeIsToken0: boolean, tickSpacing: number) {
  const minPrice = Number(formatEther(BigInt(state.minPrice)));
  const maxPrice = Number(formatEther(BigInt(state.maxPrice)));
  const [low, high] = outcomeIsToken0 ? [minPrice, maxPrice] : [1 / maxPrice, 1 / minPrice];
  const toTick = (price: number) => Math.log(price) / Math.log(1.0001);
  return {
    tickLower: Math.floor(toTick(low) / tickSpacing) * tickSpacing,
    tickUpper: Math.ceil(toTick(high) / tickSpacing) * tickSpacing,
  };
}

/**
 * Position holding `outcomeAmount` outcome tokens at the pool's price, with the sDAI that price needs.
 * Undefined when the outcome trades at or above the range, where the position would hold only sDAI.
 */
function positionFor(
  state: State,
  outcome: Outcome,
  pool: { sqrtPriceX96: bigint; tickSpacing: number },
  outcomeAmount: bigint,
): Position | undefined {
  const { token0, token1 } = getToken0Token1(outcome.token, SDAI);
  const outcomeIsToken0 = token0 === outcome.token.toLowerCase();
  const { tickLower, tickUpper } = rangeTicks(state, outcomeIsToken0, pool.tickSpacing);
  const sqrtA = sqrtAtTick(tickLower);
  const sqrtB = sqrtAtTick(tickUpper);
  const sqrtP = pool.sqrtPriceX96;
  let sdaiAmount: bigint;
  if (outcomeIsToken0) {
    // The outcome is sold as the price rises from max(P, lower) to upper.
    if (sqrtP >= sqrtB) return undefined;
    const from = sqrtP > sqrtA ? sqrtP : sqrtA;
    const liquidity = (outcomeAmount * from * sqrtB) / ((sqrtB - from) * Q96);
    sdaiAmount = sqrtP > sqrtA ? ceilDiv(liquidity * (sqrtP - sqrtA), Q96) : 0n;
  } else {
    // The outcome is sold as the price falls from min(P, upper) to lower.
    if (sqrtP <= sqrtA) return undefined;
    const to = sqrtP < sqrtB ? sqrtP : sqrtB;
    const liquidity = (outcomeAmount * Q96) / (to - sqrtA);
    sdaiAmount = sqrtP < sqrtB ? ceilDiv(liquidity * (sqrtB - sqrtP) * Q96, sqrtB * sqrtP) : 0n;
  }
  return { outcomeIsToken0, token0, token1, tickLower, tickUpper, outcomeAmount, sdaiAmount };
}

async function readPools(outcomes: Outcome[]): Promise<(PoolState | undefined)[]> {
  const pools = await publicClient.multicall({
    allowFailure: false,
    contracts: outcomes.map((outcome) => {
      const { token0, token1 } = getToken0Token1(outcome.token, SDAI);
      return { address: ALGEBRA_FACTORY, abi: factoryAbi, functionName: "poolByPair", args: [token0, token1] } as const;
    }),
  });
  const existing = pools.filter((pool) => pool !== zeroAddress);
  const reads = await publicClient.multicall({
    allowFailure: false,
    contracts: existing.flatMap((pool) => [
      { address: pool, abi: poolAbi, functionName: "globalState" } as const,
      { address: pool, abi: poolAbi, functionName: "tickSpacing" } as const,
    ]),
  });
  const byPool = new Map(
    existing.map((pool, i) => {
      const [globalState, tickSpacing] = [reads[2 * i], reads[2 * i + 1]] as [
        readonly [bigint, ...unknown[]],
        number,
      ];
      return [pool, { pool, sqrtPriceX96: globalState[0], tickSpacing }];
    }),
  );
  return pools.map((pool) => byPool.get(pool));
}

async function readOutcomes(markets: Address[]): Promise<Outcome[]> {
  const outcomes: Outcome[] = [];
  for (let m = 0; m < markets.length; m++) {
    const market = markets[m];
    const read = <T>(functionName: "numOutcomes" | "parentMarket" | "parentOutcome") =>
      publicClient.readContract({ address: market, abi: marketAbi, functionName }) as Promise<T>;
    const [numOutcomes, parentMarket, parentOutcome] = await Promise.all([
      read<bigint>("numOutcomes"),
      read<Address>("parentMarket"),
      read<bigint>("parentOutcome"),
    ]);
    const indexes = [...Array(Number(numOutcomes)).keys()];
    const [names, wrapped] = await Promise.all([
      publicClient.multicall({
        allowFailure: false,
        contracts: indexes.map(
          (i) => ({ address: market, abi: marketAbi, functionName: "outcomes", args: [BigInt(i)] }) as const,
        ),
      }),
      publicClient.multicall({
        allowFailure: false,
        contracts: indexes.map(
          (i) => ({ address: market, abi: marketAbi, functionName: "wrappedOutcome", args: [BigInt(i)] }) as const,
        ),
      }),
    ]);
    const otherIndex = names.indexOf(OTHER_OUTCOME);
    if (otherIndex === -1) {
      throw new Error(`M${m + 1} ${market} has no "${OTHER_OUTCOME}" outcome`);
    }
    const expectedParent = m === 0 ? zeroAddress : markets[m - 1];
    if (parentMarket.toLowerCase() !== expectedParent.toLowerCase()) {
      throw new Error(`M${m + 1} ${market} has parent ${parentMarket}, expected ${expectedParent}`);
    }
    if (m > 0) {
      const parentOther = outcomes.find((o) => o.market === m - 1 && o.name === OTHER_OUTCOME);
      if (Number(parentOutcome) !== parentOther?.index) {
        throw new Error(`M${m + 1} ${market} hangs from outcome ${parentOutcome}, not from "${OTHER_OUTCOME}"`);
      }
    }
    names.forEach((name, index) => {
      outcomes.push({ market: m, index, name, token: wrapped[index][0] });
    });
  }
  // The "Other" of every market but the last is split into the next market instead of pooled.
  return outcomes.filter((o) => o.name !== OTHER_OUTCOME || o.market === markets.length - 1);
}

function marketsFromArgs(): Address[] {
  if (args.markets) {
    return args.markets.split(",").map((id) => id.trim() as Address);
  }
  if (args["from-state"]) {
    const created = JSON.parse(fs.readFileSync(args["from-state"], "utf8")) as {
      chainId: number;
      markets: { id?: Address }[];
    };
    if (created.chainId !== gnosis.id) {
      throw new Error(`${args["from-state"]} is on chain ${created.chainId}, this script only supports Gnosis`);
    }
    if (created.markets.some((market) => !market.id)) {
      throw new Error(`${args["from-state"]} has markets that were not created yet`);
    }
    return created.markets.map((market) => market.id!);
  }
  throw new Error("Pass --markets or --from-state");
}

async function newState(): Promise<State> {
  if (!args.amount) {
    throw new Error("--amount is required");
  }
  if (!args["min-price"] || !args["max-price"]) {
    throw new Error("--min-price and --max-price are required");
  }
  const markets = marketsFromArgs();
  const outcomes = await readOutcomes(markets);
  const minPrice = parseEther(args["min-price"]);
  const maxPrice = parseEther(args["max-price"]);
  const initialPrice = args["initial-price"] ? parseEther(args["initial-price"]) : parseEther("1") / BigInt(outcomes.length);
  if (!(minPrice > 0n && minPrice < maxPrice && maxPrice < parseEther("1"))) {
    throw new Error("Expected 0 < --min-price < --max-price < 1");
  }
  if (initialPrice < minPrice || initialPrice >= maxPrice) {
    throw new Error(`--initial-price ${formatEther(initialPrice)} is outside the range`);
  }
  return {
    markets,
    amount: parseEther(args.amount).toString(),
    minPrice: minPrice.toString(),
    maxPrice: maxPrice.toString(),
    initialPrice: initialPrice.toString(),
    slippageBps: Math.round(Number(args.slippage) * 100),
    outcomes,
    splitDone: 0,
  };
}

/** Pool state to plan with: the live pool, or the one the script would create. */
function plannedPool(state: State, outcome: Outcome, pool: PoolState | undefined) {
  if (pool) return pool;
  const outcomeIsToken0 = outcome.token.toLowerCase() < SDAI.toLowerCase();
  return {
    sqrtPriceX96: outcomeSqrtPriceX96(BigInt(state.initialPrice), outcomeIsToken0),
    tickSpacing: DEFAULT_TICK_SPACING,
  };
}

/** Outcome tokens per outcome that spend the budget: S = B / (1 + sum of sDAI per outcome token). */
function computeSets(state: State, pools: (PoolState | undefined)[]): bigint {
  const ONE = parseEther("1");
  let sdaiPerSet = 0n;
  state.outcomes.forEach((outcome, i) => {
    if (outcome.tokenId || outcome.skipped) return;
    const position = positionFor(state, outcome, plannedPool(state, outcome, pools[i]), ONE);
    sdaiPerSet += position?.sdaiAmount ?? 0n;
  });
  // The margin absorbs the per-position rounding up of the sDAI side.
  return (BigInt(state.amount) * ONE) / (ONE + sdaiPerSet) - 10n ** 6n;
}

function printPlan(state: State, pools: (PoolState | undefined)[], sets: bigint) {
  const rows = state.outcomes.map((outcome, i) => {
    const pool = plannedPool(state, outcome, pools[i]);
    const position = positionFor(state, outcome, pool, sets);
    return {
      market: `M${outcome.market + 1}`,
      outcome: outcome.name.slice(0, 32),
      pool: pools[i] ? pools[i]!.pool : "new",
      ticks: position ? `${position.tickLower}..${position.tickUpper}` : "-",
      outcomeTokens: position ? Number(formatEther(position.outcomeAmount)).toFixed(4) : "-",
      sDAI: position ? Number(formatEther(position.sdaiAmount)).toFixed(6) : "-",
      status: outcome.tokenId ? `minted #${outcome.tokenId}` : (outcome.skipped ?? (position ? "" : "price above range")),
    };
  });
  console.table(rows);
  const buySide = state.outcomes.reduce((total, outcome, i) => {
    if (outcome.tokenId || outcome.skipped) return total;
    const position = positionFor(state, outcome, plannedPool(state, outcome, pools[i]), sets);
    return total + (position?.sdaiAmount ?? 0n);
  }, 0n);
  console.log(`Markets: ${state.markets.map((m, i) => `M${i + 1} ${m}`).join(", ")}`);
  console.log(
    `Outcomes: ${state.outcomes.length}, pools to create: ${pools.filter((p) => !p).length}, range ${formatEther(BigInt(state.minPrice))}-${formatEther(BigInt(state.maxPrice))} sDAI, initial price ${formatEther(BigInt(state.initialPrice))}`,
  );
  console.log(
    `Budget ${formatEther(BigInt(state.amount))} sDAI = ${formatEther(sets)} complete sets + ${formatEther(buySide)} sDAI buy side`,
  );
  if (pools.some((p) => !p)) {
    console.log(`(ticks of new pools assume tick spacing ${DEFAULT_TICK_SPACING}; S is fixed once they exist)`);
  }
}

function saveState(file: string, state: State) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(state, null, 2));
}

async function main() {
  const stateFile = args.resume ?? path.join(OUT_DIR, `add-other-chain-liquidity.${Date.now()}.json`);
  const state: State = args.resume ? JSON.parse(fs.readFileSync(args.resume, "utf8")) : await newState();

  const privateKey = process.env.PRIVATE_KEY as Hex | undefined;
  const account = privateKey ? privateKeyToAccount(privateKey) : undefined;
  const from = account?.address ?? "0x000000000000000000000000000000000000dEaD";

  let pools = await readPools(state.outcomes);
  printPlan(state, pools, state.sets ? BigInt(state.sets) : computeSets(state, pools));

  if (account) {
    const [sdaiBalance, xdaiBalance] = await Promise.all([
      publicClient.readContract({ address: SDAI, abi: erc20Abi, functionName: "balanceOf", args: [account.address] }),
      publicClient.getBalance({ address: account.address }),
    ]);
    console.log(`Wallet ${account.address}: ${formatEther(sdaiBalance)} sDAI, ${formatEther(xdaiBalance)} xDAI`);
    if (!state.splitDone && sdaiBalance < BigInt(state.amount)) {
      throw new Error("Not enough sDAI for the budget");
    }
  }

  const createPoolData = (outcome: Outcome) => {
    const { token0, token1 } = getToken0Token1(outcome.token, SDAI);
    const sqrtPriceX96 = outcomeSqrtPriceX96(BigInt(state.initialPrice), token0 === outcome.token.toLowerCase());
    return encodeFunctionData({
      abi: positionManagerAbi,
      functionName: "createAndInitializePoolIfNecessary",
      args: [token0, token1, sqrtPriceX96],
    });
  };

  if (!args.execute) {
    const missing = state.outcomes.find((_, i) => !pools[i]);
    if (missing) {
      const gas = await publicClient.estimateGas({ account: from, to: POSITION_MANAGER, data: createPoolData(missing) });
      console.log(`\nEstimated gas to create the ${missing.name} pool: ${gas}`);
    }
    console.log("\nDry run: pass --execute to add the liquidity.");
    return;
  }

  if (!account) {
    throw new Error("PRIVATE_KEY is required with --execute");
  }
  const walletClient = createWalletClient({ account, chain: gnosis, transport });
  const maxPriorityFeePerGas = parseGwei(args["priority-fee"]!);
  saveState(stateFile, state);
  console.log(`\nState file: ${stateFile}`);

  const gasFor = async (to: Address, data: Hex) => {
    const gas = await publicClient.estimateGas({ account, to, data });
    if (gas > TX_GAS_CAP) {
      throw new Error(`${to} call needs ${gas} gas, over the per-tx cap`);
    }
    const buffered = (gas * GAS_BUFFER_PERCENT) / 100n;
    return buffered > TX_GAS_CAP ? TX_GAS_CAP : buffered;
  };

  const waitFor = async (hash: Hex, label: string, onMined?: () => void) => {
    const receipt = await publicClient.waitForTransactionReceipt({ hash, timeout: RECEIPT_TIMEOUT_MS });
    onMined?.();
    if (receipt.status !== "success") {
      throw new Error(`${label} reverted: ${hash}`);
    }
    return receipt;
  };

  /** Sends txs that are safe to repeat with consecutive nonces, then waits for all of them. */
  const sendPipelined = async (txs: { to: Address; data: Hex; label: string }[]) => {
    for (let start = 0; start < txs.length; start += PIPELINE) {
      let nonce = await publicClient.getTransactionCount({ address: account.address, blockTag: "pending" });
      const sent: { hash: Hex; label: string }[] = [];
      for (const tx of txs.slice(start, start + PIPELINE)) {
        const hash = await walletClient.sendTransaction({
          to: tx.to,
          data: tx.data,
          gas: await gasFor(tx.to, tx.data),
          nonce: nonce++,
          maxPriorityFeePerGas,
        });
        console.log(`${tx.label}: ${hash}`);
        sent.push({ hash, label: tx.label });
      }
      for (const { hash, label } of sent) {
        await waitFor(hash, label);
      }
    }
  };

  /** Sends a tx that must not be repeated, recording it so a resumed run waits for it instead. */
  const sendOnce = async (to: Address, data: Hex, label: string) => {
    let hash = state.pendingTx?.label === label ? state.pendingTx.hash : undefined;
    if (hash) {
      console.log(`${label}: waiting for pending tx ${hash}...`);
    } else {
      hash = await walletClient.sendTransaction({ to, data, gas: await gasFor(to, data), maxPriorityFeePerGas });
      state.pendingTx = { label, hash };
      saveState(stateFile, state);
      console.log(`${label}: ${hash}`);
    }
    // A receipt timeout keeps `pendingTx`, so the resumed run waits for the same tx.
    return waitFor(hash, label, () => {
      state.pendingTx = undefined;
      saveState(stateFile, state);
    });
  };

  // 1. Pools. `createAndInitializePoolIfNecessary` is a no-op on a pool that exists.
  await sendPipelined(
    state.outcomes
      .filter((outcome, i) => !pools[i] && !outcome.tokenId && !outcome.skipped)
      .map((outcome) => ({ to: POSITION_MANAGER, data: createPoolData(outcome), label: `pool ${outcome.name}` })),
  );
  pools = await readPools(state.outcomes);

  // 2. S, with every pool's real tick spacing.
  if (!state.sets) {
    state.sets = computeSets(state, pools).toString();
    saveState(stateFile, state);
    console.log(`\nComplete sets per market: ${formatEther(BigInt(state.sets))}`);
  }
  const sets = BigInt(state.sets);

  // 3. Splits. Child markets take sDAI as the collateral argument and pull the parent's "Other" token.
  for (let m = state.splitDone; m < state.markets.length; m++) {
    const market = { id: state.markets[m], type: "Generic" as const, chainId: gnosis.id };
    const router = getRouterAddress(market);
    const collateral =
      m === 0
        ? SDAI
        : (await publicClient.readContract({ address: market.id, abi: marketAbi, functionName: "parentWrappedOutcome" }))[0];
    const allowance = await publicClient.readContract({
      address: collateral,
      abi: erc20Abi,
      functionName: "allowance",
      args: [account.address, router],
    });
    if (allowance < sets) {
      await sendPipelined([
        {
          to: collateral,
          data: encodeFunctionData({ abi: erc20Abi, functionName: "approve", args: [router, maxUint256] }),
          label: `approve M${m + 1} collateral`,
        },
      ]);
    }
    const split = getSplitExecution({ router, market, collateralToken: SDAI, amount: sets });
    await sendOnce(split.to, split.data, `split M${m + 1}`);
    state.splitDone = m + 1;
    saveState(stateFile, state);
  }

  // 4. Approvals to the position manager. `amount` is what this run needs; the approval itself is
  // unlimited, like the router's, so a later pass on the same markets skips this step.
  const toApprove = [
    { token: SDAI, amount: BigInt(state.amount), label: "approve sDAI" },
    ...state.outcomes
      .filter((outcome) => !outcome.tokenId && !outcome.skipped)
      .map((outcome) => ({ token: outcome.token, amount: sets, label: `approve ${outcome.name}` })),
  ];
  const allowances = await publicClient.multicall({
    allowFailure: false,
    contracts: toApprove.map(
      ({ token }) =>
        ({
          address: token,
          abi: erc20Abi,
          functionName: "allowance",
          args: [account.address, POSITION_MANAGER],
        }) as const,
    ),
  });
  await sendPipelined(
    toApprove
      .filter((_, i) => allowances[i] < toApprove[i].amount)
      .map(({ token, label }) => ({
        to: token,
        data: encodeFunctionData({ abi: erc20Abi, functionName: "approve", args: [POSITION_MANAGER, maxUint256] }),
        label,
      })),
  );

  // 5. Mints, one at a time and each re-read at the pool's current price.
  const slippage = (amount: bigint) => (amount * BigInt(10_000 - state.slippageBps)) / 10_000n;
  for (let i = 0; i < state.outcomes.length; i++) {
    const outcome = state.outcomes[i];
    if (outcome.tokenId || outcome.skipped) continue;
    const label = `mint ${outcome.name} (M${outcome.market + 1} #${outcome.index})`;
    let data: Hex = "0x";
    if (state.pendingTx?.label !== label) {
      const [pool] = await readPools([outcome]);
      const position = pool && positionFor(state, outcome, pool, sets);
      if (!position) {
        outcome.skipped = pool ? "price above range" : "no pool";
        saveState(stateFile, state);
        console.log(`${label}: skipped, ${outcome.skipped}`);
        continue;
      }
      const [amount0, amount1] = position.outcomeIsToken0
        ? [position.outcomeAmount, position.sdaiAmount]
        : [position.sdaiAmount, position.outcomeAmount];
      data = encodeFunctionData({
        abi: positionManagerAbi,
        functionName: "mint",
        args: [
          {
            token0: position.token0,
            token1: position.token1,
            tickLower: position.tickLower,
            tickUpper: position.tickUpper,
            amount0Desired: amount0,
            amount1Desired: amount1,
            amount0Min: slippage(amount0),
            amount1Min: slippage(amount1),
            recipient: account.address,
            deadline: BigInt(Math.floor(Date.now() / 1000) + 3600),
          },
        ],
      });
    }
    const receipt = await sendOnce(POSITION_MANAGER, data, label);
    const [minted] = parseEventLogs({ abi: positionManagerAbi, eventName: "Transfer", logs: receipt.logs }).filter(
      (log) => log.address.toLowerCase() === POSITION_MANAGER.toLowerCase() && log.args.from === zeroAddress,
    );
    outcome.tokenId = minted.args.tokenId.toString();
    outcome.mintTx = receipt.transactionHash;
    saveState(stateFile, state);
  }

  console.log("\nDone:");
  printPlan(state, await readPools(state.outcomes), sets);
  console.log(`Left in the wallet: ${formatEther(sets)} Invalid tokens of each market, skipped outcomes and dust.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
