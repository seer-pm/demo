/**
 * Creates a categorical market with more outcomes than fit in one transaction, using the "Other"
 * trick: every market gets an "Other" outcome, and the next market is a conditional market on
 * that "Other" (`parentMarket` = previous market, `parentOutcome` = index of "Other").
 *
 * WHY TWO STEPS PER MARKET: MarketFactory deploys one ERC20 wrapper per outcome, and that is most
 * of the gas. QuestionsFactory deploys the same wrappers (same position ids, same token data) in
 * `[from, to)` batches, and `Wrapped1155Factory.requireWrapped1155` is idempotent, so when
 * MarketFactory runs afterwards it only looks the wrappers up. Measured on a Gnosis fork:
 *   - without pre-deploy: 43 outcomes hit the 2^24 per-tx gas cap (EIP-7825)
 *   - with pre-deploy:    80 outcomes -> ~15.1M, 85 -> ~16.1M, 90 -> over the cap
 * so MAX_OUTCOMES defaults to 75, leaving plenty of margin. Children can only be pre-deployed
 * once their parent exists (the parent collection id is read from it), so markets are created
 * strictly in order.
 *
 * Usage (from the `web/` directory, so tsconfig `paths` resolve):
 *   Dry run (default): prints the plan and estimates gas for the next ERC20 batch.
 *     npx tsx scripts/create-other-chain-markets.ts --chain gnosis --market-name "Which ...?" --min-bond 10
 *   Execute:
 *     PRIVATE_KEY=0x... npx tsx scripts/create-other-chain-markets.ts --chain gnosis --market-name "Which ...?" --min-bond 10 --execute
 *   Resume an interrupted run (never re-creates a market already in the state file):
 *     PRIVATE_KEY=0x... npx tsx scripts/create-other-chain-markets.ts --resume tmp/<file>.json --execute
 *
 * Options:
 *   --chain <name>         gnosis, optimism, base or ethereum. Required unless resuming; a resumed
 *                          run keeps the chain it started on.
 *   --market-name <text>   The question, shared by every market in the chain. Required unless
 *                          resuming.
 *   --min-bond <amount>    Reality min bond, in the chain's native token. Required unless resuming.
 *   --outcomes <file>      One outcome per line; a trailing "Other" line is ignored (it is added
 *                          per market). Default scripts/outcomes.txt.
 *   --max-outcomes <n>     Outcomes per market, including "Other". Default 75.
 *   --erc20-batch <n>      ERC20 wrappers per QuestionsFactory tx. Default 40.
 *   --priority-fee <gwei>  maxPriorityFeePerGas. Default 1.
 *   --category <name>      Reality category. Default "misc".
 * Env: PRIVATE_KEY (only with --execute), RPC_URL (default: a public RPC for --chain).
 *
 * The opening time is always the moment the run starts; a resumed run keeps the original one so
 * every market in the chain shares it.
 */
import fs from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import {
  getCreateMarketExecution,
  getCreateMarketParams,
  MarketTypes,
  validateNewMarket,
} from "@seer-pm/sdk";
import { marketAbi, marketFactoryAbi } from "@seer-pm/sdk/contracts/market-factory";
import {
  type Abi,
  type Address,
  createPublicClient,
  createWalletClient,
  encodeFunctionData,
  type Hex,
  http,
  parseEther,
  parseGwei,
  parseEventLogs,
  zeroAddress,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base, gnosis, mainnet, optimism } from "viem/chains";

const OTHER_OUTCOME = "Other";
// Chains with a QuestionsFactory deployment, keyed by their `contracts/deployments` directory.
const CHAINS = {
  gnosis: { chain: gnosis, rpc: "https://rpc.gnosischain.com" },
  optimism: { chain: optimism, rpc: "https://mainnet.optimism.io" },
  base: { chain: base, rpc: "https://mainnet.base.org" },
  ethereum: { chain: mainnet, rpc: "https://ethereum-rpc.publicnode.com" },
} as const;
type ChainName = keyof typeof CHAINS;
const MAX_OUTCOMES = 75;
const ERC20_BATCH = 40;
// A gas limit close to the block gas limit (17M on Gnosis) only fits in an almost empty block, so
// keep the buffer over the estimate small and tip enough for validators to pick the tx up.
const GAS_BUFFER_PERCENT = 102n;
const PRIORITY_FEE_GWEI = "1";
const RECEIPT_TIMEOUT_MS = 30 * 60 * 1000;
// EIP-7825 per-transaction gas cap.
const TX_GAS_CAP = 16_777_216n;
const MAX_ESTIMATE = 16_200_000n;
const OUT_DIR = "tmp";
const questionsFactoryDeployment = (chain: ChainName) =>
  new URL(`../../contracts/deployments/${chain}/QuestionsFactory.json`, import.meta.url);

type CreatedMarket = {
  id?: Address;
  // Exclusive end of the outcome slots whose ERC20s are already deployed (Invalid included).
  erc20DeployedTo: number;
  otherToken?: Address;
  txHash?: Hex;
};

type State = {
  marketName: string;
  chain: ChainName;
  chainId: number;
  openingTime: number;
  minBond: string;
  category: string;
  erc20Batch: number;
  chunks: string[][];
  markets: CreatedMarket[];
  // Saved before waiting for a receipt, so a run that dies with a tx in flight waits for that tx on
  // resume instead of sending it again (a second create market tx would duplicate the market).
  pendingTx?: { label: string; hash: Hex };
};

const { values: args } = parseArgs({
  options: {
    chain: { type: "string" },
    "market-name": { type: "string" },
    outcomes: { type: "string", default: "scripts/outcomes.txt" },
    "min-bond": { type: "string" },
    "max-outcomes": { type: "string", default: String(MAX_OUTCOMES) },
    "erc20-batch": { type: "string", default: String(ERC20_BATCH) },
    "priority-fee": { type: "string", default: PRIORITY_FEE_GWEI },
    category: { type: "string", default: "misc" },
    resume: { type: "string" },
    execute: { type: "boolean", default: false },
  },
});

/** Splits the names into as few markets as fit, balanced, each ending with "Other". */
function buildChunks(file: string, maxOutcomes: number): string[][] {
  const names = fs
    .readFileSync(file, "utf8")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((name) => name.toLowerCase() !== OTHER_OUTCOME.toLowerCase());
  const marketsCount = Math.ceil(names.length / (maxOutcomes - 1));
  const perMarket = Math.ceil(names.length / marketsCount);
  const chunks: string[][] = [];
  for (let i = 0; i < names.length; i += perMarket) {
    chunks.push([...names.slice(i, i + perMarket), OTHER_OUTCOME]);
  }
  return chunks;
}

function newState(): State {
  const chain = args.chain as ChainName | undefined;
  if (!chain || !(chain in CHAINS)) {
    throw new Error(`--chain is required, one of: ${Object.keys(CHAINS).join(", ")}`);
  }
  if (!args["market-name"]?.trim()) {
    throw new Error("--market-name is required");
  }
  if (!args["min-bond"]) {
    throw new Error("--min-bond is required");
  }
  const chunks = buildChunks(args.outcomes!, Number(args["max-outcomes"]));
  return {
    marketName: args["market-name"].trim(),
    chain,
    chainId: CHAINS[chain].chain.id,
    openingTime: Math.floor(Date.now() / 1000),
    minBond: parseEther(args["min-bond"]).toString(),
    category: args.category!,
    erc20Batch: Number(args["erc20-batch"]),
    chunks,
    markets: chunks.map(() => ({ erc20DeployedTo: 0 })),
  };
}

function marketProps(state: State, index: number) {
  return {
    marketType: MarketTypes.CATEGORICAL,
    marketName: state.marketName,
    outcomes: state.chunks[index],
    openingTime: state.openingTime,
    chainId: state.chainId,
    minBond: BigInt(state.minBond),
    category: state.category,
    parentMarket: state.markets[index - 1]?.id ?? zeroAddress,
    parentOutcome: BigInt(state.chunks[index - 1]?.indexOf(OTHER_OUTCOME) ?? 0),
  };
}

function printPlan(state: State) {
  console.log(`Market: ${state.marketName}`);
  console.log(
    `Chain: ${state.chain} (${state.chainId}), opening time: ${new Date(state.openingTime * 1000).toISOString()}`,
  );
  console.log(`Min bond: ${state.minBond} wei, category: ${state.category}`);
  console.log(`Markets to create: ${state.chunks.length}`);
  let first = 1;
  state.chunks.forEach((chunk, i) => {
    const names = chunk.length - 1;
    const parent =
      i === 0
        ? "root"
        : `parent M${i}, parentOutcome ${state.chunks[i - 1].indexOf(OTHER_OUTCOME)}`;
    const market = state.markets[i];
    const status = market.id
      ? ` [created ${market.id}]`
      : market.erc20DeployedTo
        ? ` [ERC20s ${market.erc20DeployedTo}/${chunk.length + 1}]`
        : "";
    console.log(
      `  M${i + 1}: names ${first}-${first + names - 1} + ${OTHER_OUTCOME} (${chunk.length} outcomes), ${parent}${status}`,
    );
    first += names;
  });
}

function saveState(file: string, state: State) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(state, null, 2));
}

async function main() {
  const stateFile = args.resume ?? path.join(OUT_DIR, `create-other-chain-markets.${Date.now()}.json`);
  const state: State = args.resume ? JSON.parse(fs.readFileSync(args.resume, "utf8")) : newState();
  if (args.resume && args.chain && args.chain !== state.chain) {
    throw new Error(`${args.resume} was started on ${state.chain}, not ${args.chain}`);
  }
  const { chain, rpc } = CHAINS[state.chain];

  state.chunks.forEach((_, i) => {
    const issues = validateNewMarket(marketProps(state, i));
    if (issues.length) {
      throw new Error(`M${i + 1} is invalid: ${JSON.stringify(issues)}`);
    }
  });
  printPlan(state);

  const questionsFactory = JSON.parse(fs.readFileSync(questionsFactoryDeployment(state.chain), "utf8")) as {
    address: Address;
    abi: Abi;
  };
  const transport = http(process.env.RPC_URL ?? rpc);
  const publicClient = createPublicClient({ chain, transport });
  const privateKey = process.env.PRIVATE_KEY as Hex | undefined;
  const account = privateKey ? privateKeyToAccount(privateKey) : undefined;
  const from = account?.address ?? "0x000000000000000000000000000000000000dEaD";

  const erc20BatchData = (index: number, start: number, end: number) =>
    encodeFunctionData({
      abi: questionsFactory.abi,
      functionName: "createCategoricalMarket",
      // Same struct MarketFactory receives, so the wrappers get the same position ids and names.
      args: [getCreateMarketParams(marketProps(state, index)), BigInt(start), BigInt(end), false, true],
    });

  const estimate = async (to: Address, data: Hex, label: string) => {
    const gas = await publicClient.estimateGas({ account: from, to, data });
    if (gas > MAX_ESTIMATE) {
      throw new Error(`${label} needs ${gas} gas, lower --max-outcomes / --erc20-batch`);
    }
    return gas;
  };

  const next = state.markets.findIndex((market) => !market.id);
  if (!args.execute) {
    // Only the next step can be simulated: later ones depend on what it deploys.
    if (next !== -1) {
      const market = state.markets[next];
      if (next > 0 && !state.markets[next - 1].id) {
        console.log("\nNothing to simulate yet.");
      } else {
        const slots = state.chunks[next].length + 1;
        const end = Math.min(market.erc20DeployedTo + state.erc20Batch, slots);
        const gas = await estimate(
          questionsFactory.address,
          erc20BatchData(next, market.erc20DeployedTo, end),
          `M${next + 1} ERC20s ${market.erc20DeployedTo}-${end}`,
        );
        console.log(`\nEstimated gas for M${next + 1} ERC20s ${market.erc20DeployedTo}-${end}: ${gas}`);
      }
    }
    console.log("\nDry run: pass --execute to create the markets.");
    return;
  }

  if (!account) {
    throw new Error("PRIVATE_KEY is required with --execute");
  }
  const walletClient = createWalletClient({ account, chain, transport });
  const send = async (to: Address, data: Hex, label: string) => {
    let hash = state.pendingTx?.label === label ? state.pendingTx.hash : undefined;
    if (hash) {
      console.log(`${label}: waiting for pending tx ${hash}...`);
    } else {
      const gas = await estimate(to, data, label);
      const buffered = (gas * GAS_BUFFER_PERCENT) / 100n;
      const gasLimit = buffered > TX_GAS_CAP ? TX_GAS_CAP : buffered;
      console.log(`${label} (gas ${gas})...`);
      hash = await walletClient.sendTransaction({
        to,
        data,
        gas: gasLimit,
        maxPriorityFeePerGas: parseGwei(args["priority-fee"]!),
      });
      state.pendingTx = { label, hash };
      saveState(stateFile, state);
      console.log(`  tx ${hash}`);
    }
    const receipt = await publicClient.waitForTransactionReceipt({
      hash,
      timeout: RECEIPT_TIMEOUT_MS,
    });
    if (receipt.status !== "success") {
      state.pendingTx = undefined;
      saveState(stateFile, state);
      throw new Error(`${label} reverted: ${hash}`);
    }
    state.pendingTx = undefined;
    return receipt;
  };

  saveState(stateFile, state);
  console.log(`\nState file: ${stateFile}`);

  for (let i = 0; i < state.chunks.length; i++) {
    const market = state.markets[i];
    if (market.id) continue;
    const props = marketProps(state, i);
    const slots = props.outcomes.length + 1;

    while (market.erc20DeployedTo < slots) {
      const end = Math.min(market.erc20DeployedTo + state.erc20Batch, slots);
      await send(
        questionsFactory.address,
        erc20BatchData(i, market.erc20DeployedTo, end),
        `M${i + 1} ERC20s ${market.erc20DeployedTo}-${end}`,
      );
      market.erc20DeployedTo = end;
      saveState(stateFile, state);
    }

    const tx = getCreateMarketExecution(props);
    const receipt = await send(tx.to, tx.data, `M${i + 1} create market`);
    const [newMarket] = parseEventLogs({
      abi: marketFactoryAbi,
      eventName: "NewMarket",
      logs: receipt.logs,
    });
    market.id = newMarket.args.market;
    market.txHash = receipt.transactionHash;
    [market.otherToken] = await publicClient.readContract({
      address: market.id,
      abi: marketAbi,
      functionName: "wrappedOutcome",
      args: [BigInt(props.outcomes.indexOf(OTHER_OUTCOME))],
    });
    saveState(stateFile, state);
    console.log(`  M${i + 1}: ${market.id}`);
  }

  console.log("\nDone:");
  console.table(
    state.markets.map((market, i) => ({
      market: `M${i + 1}`,
      id: market.id,
      parentMarket: marketProps(state, i).parentMarket,
      parentOutcome: Number(marketProps(state, i).parentOutcome),
      otherToken: market.otherToken,
      url: `https://app.seer.pm/markets/${state.chainId}/${market.id}`,
    })),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
