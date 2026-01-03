import { promises as fs } from "node:fs";
import { dirname, join } from "node:path";
import { marketFactoryAbi, marketFactoryAddress } from "@/hooks/contracts/generated-market-factory.ts";
import { SupportedChain } from "@/lib/chains.ts";
import { MISC_CATEGORY, getCreateMarketParams } from "@/lib/create-market.ts";
import { MarketTypes } from "@/lib/market.ts";
import {
  http,
  Hex,
  PrivateKeyAccount,
  createPublicClient,
  createWalletClient,
  parseEther,
  parseGwei,
  zeroAddress,
} from "viem";
import type { PublicClient, TransactionReceipt, WalletClient } from "viem";
import { Address, nonceManager, privateKeyToAccount } from "viem/accounts";
import { optimism as activeChain } from "viem/chains";
import { parseEventLogs } from "viem/utils";
import {
  DEPENDENCIES_IGNORE,
  DEPENDENCY_FILTER,
  type DependencyFilter,
  MAX_DEPENDENCIES,
  type MarketCreationTask,
  type SeedRepos,
  buildMarketCreationTasks,
  fetchSeedRepos,
  fetchSeedReposWithDependencies,
} from "./deepfunding-markets-utils.ts";

const RPC_URL = "https://lb.drpc.org/optimism/As_mVw7_50IPk85yNYubcezE_O23TT8R8JDnrqRhf0fE";

// =================================================================== //
// =================================================================== //

const GAS_LIMIT: bigint | undefined = undefined /* 50_000_000n */; // Optional manual gas limit; currently not sent to viem, which will estimate gas itself.
const GAS_PRICE_MULTIPLIER = 4n; // Base multiplier over suggested gas fees to make txs more competitive
const MIN_MAX_FEE_PER_GAS = parseGwei("0.01"); // Minimum maxFeePerGas: 0.1 gwei (as recommended by Optimism docs)
const BASE_FEE_MULTIPLIER_THRESHOLD = parseGwei("0.05"); // 0.05 gwei - if base fee is above this, use higher multiplier
const HIGH_BASE_FEE_MULTIPLIER = 8n; // Higher multiplier when base fee is high (to account for 77% growth potential)
const DRY_RUN = false; // When true, only simulate transactions without sending them. NOTE: it only simulates the createMultiScalarMarket tx's
// If defined, use this address as the parent market instead of creating a new one
const DEFAULT_PARENT_MARKET: Address | undefined = "0x2d05454C1B4387b5d8Be84bEE20D58390A01Ca64"; // "0x2563389eB6d387BceC2aeA3E42C91E0163395bBe";
// When true, checks if pending transactions (status: "sent") were finally mined before sending new ones
// When false, always sends new transactions even if a previous one exists
const RESUME_PENDING_TRANSACTIONS = true;
// Maximum number of markets to create per execution. Set to undefined or 0 to create all markets.
const MAX_MARKETS_PER_EXECUTION: number | undefined = 0;
// When true, only creates questions and/or deploys the wrapped ERC20s using MarketPreDeployHelper, without creating markets.
// When false, creates the markets.
const PRE_DEPLOY_MARKETS_ONLY = false;

// MarketPreDeployHelper contract address on Optimism
//const MARKET_PRE_DEPLOY_HELPER_ADDRESS: Address = "0x03d03464BF9Eb20059Ca6eF6391E9C5d79d5E012"; // new factory
const MARKET_PRE_DEPLOY_HELPER_ADDRESS: Address = "0xdEB5dC052e55bf81C6d75CD47C961e0b280B3791"; // old factory

// MarketPreDeployHelper ABI - extracted from deployment JSON
const MARKET_PRE_DEPLOY_HELPER_ABI = [
  {
    inputs: [
      {
        components: [
          { internalType: "string", name: "marketName", type: "string" },
          { internalType: "string[]", name: "outcomes", type: "string[]" },
          { internalType: "string", name: "questionStart", type: "string" },
          { internalType: "string", name: "questionEnd", type: "string" },
          { internalType: "string", name: "outcomeType", type: "string" },
          { internalType: "uint256", name: "parentOutcome", type: "uint256" },
          { internalType: "address", name: "parentMarket", type: "address" },
          { internalType: "string", name: "category", type: "string" },
          { internalType: "string", name: "lang", type: "string" },
          { internalType: "uint256", name: "lowerBound", type: "uint256" },
          { internalType: "uint256", name: "upperBound", type: "uint256" },
          { internalType: "uint256", name: "minBond", type: "uint256" },
          { internalType: "uint32", name: "openingTime", type: "uint32" },
          { internalType: "string[]", name: "tokenNames", type: "string[]" },
        ],
        internalType: "struct MarketPreDeployHelper.CreateMarketParams",
        name: "params",
        type: "tuple",
      },
      { internalType: "uint256", name: "from", type: "uint256" },
      { internalType: "uint256", name: "to", type: "uint256" },
      { internalType: "bool", name: "createQuestions", type: "bool" },
      { internalType: "bool", name: "deployERC20", type: "bool" },
    ],
    name: "createMultiScalarMarket",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

// =================================================================== //
// =================================================================== //

// State management types
type MarketStatus =
  | "skipped"
  | "simulation_failed"
  | "transaction_failed"
  | "address_extraction_failed"
  | "transaction_sent"
  | "completed";

type SimulationStatus = "skipped" | "success" | "failed";
type TransactionStatus = "skipped" | "sent" | "mined" | "failed";
type AddressStatus = "skipped" | "pending" | "extracted" | "failed";

interface SimulationState {
  status: SimulationStatus;
  completedAt?: string;
  error?: string | null;
}

interface TransactionState {
  status: TransactionStatus;
  txHash?: string | null;
  sentAt?: string | null;
  minedAt?: string | null;
  error?: string | null;
}

interface MarketAddressState {
  status: AddressStatus;
  address?: string | null;
  extractedAt?: string | null;
  error?: string | null;
}

interface MarketState {
  seedRepo: string;
  index: number;
  dependencies: string[];
  dependenciesCount: number;
  status: MarketStatus;
  skipReason?: string;
  simulation: SimulationState;
  transaction: TransactionState;
  marketAddress: MarketAddressState;
}

interface ParentMarketState {
  address: string;
  txHash: string | null;
  status: "created" | "using_existing";
  createdAt: string;
}

interface ExecutionState {
  metadata: {
    startTime: string;
    lastUpdate: string;
    chainId: number;
    chainName: string;
    openingTime: number;
    config: {
      maxDependencies: number;
      dependencyFilter: DependencyFilter;
      dryRun: boolean;
      defaultParentMarket?: string;
    };
  };
  parentMarket: ParentMarketState;
  markets: MarketState[];
  summary: {
    totalMarkets: number;
    skipped: number;
    simulated: {
      success: number;
      failed: number;
    };
    transactions: {
      sent: number;
      mined: number;
      failed: number;
    };
    addresses: {
      extracted: number;
      failed: number;
    };
    completed: number;
    inProgress: number;
    failed: number;
  };
}

// Save state JSON alongside this script file, regardless of current working directory
const SCRIPT_DIR = dirname(new URL(import.meta.url).pathname);
const STATE_FILE_PATH = join(SCRIPT_DIR, "deepfunding-markets-state.json");

// State management functions
async function ensureStateDirectory(): Promise<void> {
  const stateDir = dirname(STATE_FILE_PATH);
  try {
    await fs.mkdir(stateDir, { recursive: true });
  } catch (error) {
    // Directory might already exist, ignore error
  }
}

async function loadState(): Promise<ExecutionState | null> {
  try {
    await ensureStateDirectory();
    const data = await fs.readFile(STATE_FILE_PATH, "utf-8");
    return JSON.parse(data) as ExecutionState;
  } catch (error) {
    // File doesn't exist or is invalid, return null
    return null;
  }
}

async function saveState(state: ExecutionState): Promise<void> {
  try {
    await ensureStateDirectory();
    state.metadata.lastUpdate = new Date().toISOString();
    state.summary = calculateSummary(state);
    await fs.writeFile(STATE_FILE_PATH, JSON.stringify(state, null, 2), "utf-8");
  } catch (error) {
    console.error("Error saving state:", error);
    // Don't throw, just log - we don't want to stop execution if state saving fails
  }
}

function initializeState(
  chainId: number,
  chainName: string,
  openingTime: number,
  marketCreationTasks: Array<{ seedRepo: string; index: number; dependencies: string[] }>,
): ExecutionState {
  const markets: MarketState[] = marketCreationTasks.map((task) => ({
    seedRepo: task.seedRepo,
    index: task.index,
    dependencies: task.dependencies,
    dependenciesCount: task.dependencies.length,
    status: "simulation_failed", // Will be updated as we progress
    simulation: {
      status: "skipped",
    },
    transaction: {
      status: "skipped",
    },
    marketAddress: {
      status: "skipped",
    },
  }));

  return {
    metadata: {
      startTime: new Date().toISOString(),
      lastUpdate: new Date().toISOString(),
      chainId,
      chainName,
      openingTime,
      config: {
        maxDependencies: MAX_DEPENDENCIES,
        dependencyFilter: DEPENDENCY_FILTER,
        dryRun: DRY_RUN,
        defaultParentMarket: DEFAULT_PARENT_MARKET,
      },
    },
    parentMarket: {
      address: "" as Address,
      txHash: null,
      status: "using_existing",
      createdAt: new Date().toISOString(),
    },
    markets,
    summary: {
      totalMarkets: markets.length,
      skipped: 0,
      simulated: {
        success: 0,
        failed: 0,
      },
      transactions: {
        sent: 0,
        mined: 0,
        failed: 0,
      },
      addresses: {
        extracted: 0,
        failed: 0,
      },
      completed: 0,
      inProgress: 0,
      failed: 0,
    },
  };
}

function calculateSummary(state: ExecutionState): ExecutionState["summary"] {
  let skipped = 0;
  let simulationSuccess = 0;
  let simulationFailed = 0;
  let transactionsSent = 0;
  let transactionsMined = 0;
  let transactionsFailed = 0;
  let addressesExtracted = 0;
  let addressesFailed = 0;
  let completed = 0;
  let inProgress = 0;
  let failed = 0;

  for (const market of state.markets) {
    if (market.status === "skipped") {
      skipped++;
      continue;
    }

    // Count simulations
    if (market.simulation.status === "success") {
      simulationSuccess++;
    } else if (market.simulation.status === "failed") {
      simulationFailed++;
    }

    // Count transactions
    if (market.transaction.status === "sent" || market.transaction.status === "mined") {
      transactionsSent++;
    }
    if (market.transaction.status === "mined") {
      transactionsMined++;
    } else if (market.transaction.status === "failed") {
      transactionsFailed++;
    }

    // Count addresses
    if (market.marketAddress.status === "extracted") {
      addressesExtracted++;
    } else if (market.marketAddress.status === "failed") {
      addressesFailed++;
    }

    // Count overall status
    if (market.status === "completed") {
      completed++;
    } else if (market.status === "transaction_sent") {
      inProgress++;
    } else if (
      market.status === "simulation_failed" ||
      market.status === "transaction_failed" ||
      market.status === "address_extraction_failed"
    ) {
      failed++;
    }
  }

  return {
    totalMarkets: state.markets.length,
    skipped,
    simulated: {
      success: simulationSuccess,
      failed: simulationFailed,
    },
    transactions: {
      sent: transactionsSent,
      mined: transactionsMined,
      failed: transactionsFailed,
    },
    addresses: {
      extracted: addressesExtracted,
      failed: addressesFailed,
    },
    completed,
    inProgress,
    failed,
  };
}

function printSummary(state: ExecutionState): void {
  const { summary } = state;
  console.log("\n=== Execution Summary ===");
  console.log(`Total Markets: ${summary.totalMarkets}`);
  console.log(`Skipped: ${summary.skipped}`);
  console.log("\nSimulations:");
  console.log(`  Success: ${summary.simulated.success}`);
  console.log(`  Failed: ${summary.simulated.failed}`);
  console.log("\nTransactions:");
  console.log(`  Sent: ${summary.transactions.sent}`);
  console.log(`  Mined: ${summary.transactions.mined}`);
  console.log(`  Failed: ${summary.transactions.failed}`);
  console.log("\nMarket Addresses:");
  console.log(`  Extracted: ${summary.addresses.extracted}`);
  console.log(`  Failed: ${summary.addresses.failed}`);
  console.log("\nOverall Status:");
  console.log(`  Completed: ${summary.completed}`);
  console.log(`  In Progress: ${summary.inProgress}`);
  console.log(`  Failed: ${summary.failed}`);
  console.log(`\nState saved to: ${STATE_FILE_PATH}`);
  console.log("========================\n");
}

async function createMulticategoricalMarket(
  publicClient: PublicClient,
  walletClient: WalletClient,
  account: PrivateKeyAccount,
  seedRepos: SeedRepos,
  chainId: SupportedChain,
  openingTime: number,
  maxFeePerGas: bigint,
  maxPriorityFeePerGas: bigint,
): Promise<`0x${string}`> {
  const outcomes = seedRepos;
  // Pass empty tokenNames array - getTokenNames will use generateTokenName internally
  const tokenNames: string[] = [];

  const marketName = "Which of those repositories will have their dependencies evaluated?";

  const simulation = await publicClient.simulateContract({
    account,
    address: marketFactoryAddress[chainId],
    functionName: "createMultiCategoricalMarket",
    abi: marketFactoryAbi,
    args: [
      getCreateMarketParams({
        marketType: MarketTypes.MULTI_CATEGORICAL,
        marketName,
        outcomes,
        tokenNames,
        parentMarket: zeroAddress,
        parentOutcome: BigInt(0),
        lowerBound: BigInt(0),
        upperBound: BigInt(0),
        unit: "",
        category: MISC_CATEGORY,
        openingTime,
        chainId,
        collateralToken1: "",
        collateralToken2: "",
        isArbitraryQuestion: false,
      }),
    ],
    maxFeePerGas,
    maxPriorityFeePerGas,
  });

  const txHash = await walletClient.writeContract({
    ...simulation.request,
    maxFeePerGas,
    maxPriorityFeePerGas,
  });
  return txHash;
}

/**
 * Calculates optimal gas fees for Optimism based on current base fee.
 * Implements Optimism recommendations:
 * - Uses minimum maxFeePerGas of 0.1 gwei to prevent stuck transactions
 * - Applies dynamic multiplier (4x or 8x) based on current base fee
 * - Accounts for Optimism's 77% base fee growth potential (vs 12.5% on L1)
 * @param publicClient The public client to query blockchain data
 * @returns Object containing maxFeePerGas and maxPriorityFeePerGas
 */
async function calculateOptimalGasFees(publicClient: PublicClient): Promise<{
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
}> {
  // Get current base fee from the latest block (recommended by Optimism docs)
  const latestBlock = await publicClient.getBlock({ blockTag: "latest" });
  const currentBaseFee = latestBlock.baseFeePerGas ?? 0n;

  console.log("Current base fee (wei):", currentBaseFee.toString());

  // Calculate dynamic multiplier based on current base fee
  // Optimism base fee can grow up to 77% vs 12.5% on L1, so use higher multiplier when base fee is high
  const dynamicMultiplier =
    currentBaseFee > BASE_FEE_MULTIPLIER_THRESHOLD ? HIGH_BASE_FEE_MULTIPLIER : GAS_PRICE_MULTIPLIER;

  console.log(`Using dynamic multiplier: ${dynamicMultiplier}x (base fee: ${currentBaseFee.toString()} wei)`);

  // Estimate competitive gas fees once and reuse them
  const estimatedFees = await publicClient.estimateFeesPerGas();
  const baseMaxFeePerGas = estimatedFees.maxFeePerGas ?? estimatedFees.gasPrice!;
  const baseMaxPriorityFeePerGas =
    estimatedFees.maxPriorityFeePerGas ?? estimatedFees.gasPrice ?? estimatedFees.maxFeePerGas ?? baseMaxFeePerGas / 2n;

  // Apply dynamic multiplier and ensure minimum maxFeePerGas (0.1 gwei as per Optimism recommendation)
  let maxFeePerGas = baseMaxFeePerGas * dynamicMultiplier;
  if (maxFeePerGas < MIN_MAX_FEE_PER_GAS) {
    maxFeePerGas = MIN_MAX_FEE_PER_GAS;
    console.log(`Applied minimum maxFeePerGas: ${MIN_MAX_FEE_PER_GAS.toString()} wei (0.1 gwei)`);
  }

  const maxPriorityFeePerGas = baseMaxPriorityFeePerGas * dynamicMultiplier;

  console.log("Using gas fees (wei):", {
    baseFee: currentBaseFee.toString(),
    baseMaxFeePerGas: baseMaxFeePerGas.toString(),
    maxFeePerGas: maxFeePerGas.toString(),
    maxPriorityFeePerGas: maxPriorityFeePerGas.toString(),
    multiplier: dynamicMultiplier.toString(),
  });

  return {
    maxFeePerGas,
    maxPriorityFeePerGas,
  };
}

async function getMarketAddressFromTxHash(txHash: `0x${string}`, publicClient: PublicClient): Promise<Address> {
  // Wait for transaction to be mined
  const receipt = await publicClient.waitForTransactionReceipt({
    hash: txHash,
  });

  // Parse the NewMarket event from the transaction receipt
  const parsedLogs = parseEventLogs({
    abi: marketFactoryAbi,
    eventName: "NewMarket",
    logs: receipt.logs,
  });

  if (!parsedLogs || parsedLogs.length === 0) {
    throw new Error(`NewMarket event not found in transaction ${txHash}`);
  }

  const marketAddress = parsedLogs[0]?.args?.market;
  if (!marketAddress) {
    throw new Error(`Market address not found in NewMarket event from transaction ${txHash}`);
  }

  return marketAddress as Address;
}

/**
 * Checks if a pending transaction was finally mined and extracts the market address.
 * Returns null if the transaction is still pending or failed.
 */
async function checkPendingTransaction(
  txHash: `0x${string}`,
  publicClient: PublicClient,
): Promise<{ address: Address; receipt: TransactionReceipt } | null> {
  try {
    // Try to get the transaction receipt without waiting
    const receipt = await publicClient.getTransactionReceipt({
      hash: txHash,
    });

    if (!receipt || receipt.status === "reverted") {
      return null;
    }

    // Parse the NewMarket event from the transaction receipt
    const parsedLogs = parseEventLogs({
      abi: marketFactoryAbi,
      eventName: "NewMarket",
      logs: receipt.logs,
    });

    if (!parsedLogs || parsedLogs.length === 0) {
      return null;
    }

    const marketAddress = parsedLogs[0]?.args?.market;
    if (!marketAddress) {
      return null;
    }

    return { address: marketAddress as Address, receipt };
  } catch (error) {
    // Transaction not found or still pending
    return null;
  }
}

(async () => {
  const chainId = activeChain.id;

  const privateKey = process.env.LIQUIDITY_ACCOUNT_PRIVATE_KEY!;
  const account = privateKeyToAccount((privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`) as Hex, {
    nonceManager,
  });

  const publicClient = createPublicClient({
    chain: activeChain,
    transport: http(RPC_URL),
  });

  const walletClient = createWalletClient({
    chain: activeChain,
    transport: http(RPC_URL),
    account,
  });

  // Calculate optimal gas fees based on current base fee and Optimism recommendations
  const { maxFeePerGas, maxPriorityFeePerGas } = await calculateOptimalGasFees(publicClient);

  // Set opening time to now (markets open immediately)
  const openingTime = 1766558788;

  try {
    console.log("Fetching seed repos data...");
    const seedRepos = await fetchSeedRepos();
    const seedReposWithDeps = await fetchSeedReposWithDependencies();

    console.log(`Found ${seedRepos.length} seed repositories`);

    // Step 1: Create the multicategorical market (or use existing one)
    let parentMarketAddress: Address;
    let state: ExecutionState | null = null;

    if (DEFAULT_PARENT_MARKET) {
      parentMarketAddress = DEFAULT_PARENT_MARKET;
      console.log(`Using existing parent market address: ${parentMarketAddress}`);
    } else {
      console.log("Creating multicategorical market...");
      const parentMarketTxHash = await createMulticategoricalMarket(
        publicClient,
        walletClient,
        account,
        seedRepos,
        chainId,
        openingTime,
        maxFeePerGas,
        maxPriorityFeePerGas,
      );
      console.log(`Multicategorical market created, tx hash: ${parentMarketTxHash}`);

      // Wait for the transaction to be mined and get the market address
      console.log("Waiting for transaction to be mined...");
      parentMarketAddress = await getMarketAddressFromTxHash(parentMarketTxHash, publicClient);
      console.log(`Parent market address: ${parentMarketAddress}`);
    }

    // Step 2: Create conditional multiscalar markets for each seed repo
    // Prepare all market creation tasks using shared utility
    let marketCreationTasks: MarketCreationTask[] = buildMarketCreationTasks(seedRepos, seedReposWithDeps, {
      dependencyFilter: DEPENDENCY_FILTER,
      maxDependencies: MAX_DEPENDENCIES,
      dependenciesIgnore: DEPENDENCIES_IGNORE,
    });

    // Initialize or load state
    state = await loadState();
    if (!state) {
      state = initializeState(chainId, activeChain.name, openingTime, marketCreationTasks);
    } else {
      // Sync existing state with current market creation tasks
      // Add any missing markets from current tasks
      for (const task of marketCreationTasks) {
        const existingMarket = state.markets.find((m) => m.seedRepo === task.seedRepo && m.index === task.index);
        if (!existingMarket) {
          state.markets.push({
            seedRepo: task.seedRepo,
            index: task.index,
            dependencies: task.dependencies,
            dependenciesCount: task.dependencies.length,
            status: task.skipReason ? "skipped" : "simulation_failed",
            skipReason: task.skipReason,
            simulation: { status: "skipped" as SimulationStatus },
            transaction: { status: "skipped" as TransactionStatus },
            marketAddress: { status: "skipped" as AddressStatus },
          });
        }
      }
      // Update metadata
      state.metadata.chainId = chainId;
      state.metadata.chainName = activeChain.name;
      state.metadata.openingTime = openingTime;
    }

    // First, update state with current task dependencies and skipReason (re-evaluate based on current config)
    // This allows markets that were previously skipped to be re-enabled if configuration changed
    // This MUST happen BEFORE filtering by MAX_MARKETS_PER_EXECUTION
    for (const task of marketCreationTasks) {
      const marketState = state!.markets.find((m) => m.seedRepo === task.seedRepo && m.index === task.index);
      if (marketState) {
        const wasSkipped = marketState.status === "skipped";
        const shouldBeSkipped = task.skipReason || task.dependencies.length === 0;

        // Update dependencies and skipReason from current task
        marketState.dependencies = task.dependencies;
        marketState.dependenciesCount = task.dependencies.length;
        marketState.skipReason = task.skipReason;

        // If market was previously skipped but should no longer be skipped, reset status
        if (wasSkipped && !shouldBeSkipped) {
          console.log(
            `[${task.seedRepo}] Previously skipped (${marketState.skipReason || "unknown reason"}), but now has ${task.dependencies.length} dependencies - re-enabling for processing`,
          );
          marketState.status = "simulation_failed"; // Reset to allow processing
          marketState.simulation.status = "skipped"; // Will be updated during simulation
        } else if (!wasSkipped && shouldBeSkipped) {
          // If market was not skipped but should now be skipped, update status
          marketState.status = "skipped";
          marketState.skipReason = task.skipReason || "no_dependencies";
          marketState.simulation.status = "skipped";
        }
      }
    }

    // Filter out already completed markets before applying MAX_MARKETS_PER_EXECUTION limit
    // This ensures we process the next pending market even if previous ones are completed
    // Now we use the UPDATED state (after re-evaluation)
    const pendingTasks = marketCreationTasks.filter((task) => {
      const marketState = state!.markets.find((m) => m.seedRepo === task.seedRepo && m.index === task.index);
      // Include if not completed and not skipped (after re-evaluation)
      if (!marketState) return true;
      if (marketState.status === "completed" && marketState.marketAddress.status === "extracted") return false;
      if (marketState.status === "skipped") return false; // Exclude markets that are still skipped after re-evaluation

      // When MAX_MARKETS_PER_EXECUTION > 0 and RESUME_PENDING_TRANSACTIONS is true,
      // exclude markets with pending transactions (status: "sent") because they will be skipped anyway.
      // This ensures we always find markets that can actually be processed.
      if (
        MAX_MARKETS_PER_EXECUTION !== undefined &&
        MAX_MARKETS_PER_EXECUTION > 0 &&
        RESUME_PENDING_TRANSACTIONS &&
        marketState.transaction.status === "sent"
      ) {
        return false; // Exclude markets with pending transactions when we need to find processable markets
      }

      return true;
    });

    // Limit number of markets to create if MAX_MARKETS_PER_EXECUTION is set
    // Apply limit only to pending (non-completed, non-skipped) markets
    if (MAX_MARKETS_PER_EXECUTION !== undefined && MAX_MARKETS_PER_EXECUTION > 0) {
      const originalCount = marketCreationTasks.length;
      const pendingCount = pendingTasks.length;
      const limitedPendingTasks = pendingTasks.slice(0, MAX_MARKETS_PER_EXECUTION);

      // Create a set of limited pending task keys for quick lookup
      const limitedTaskKeys = new Set(limitedPendingTasks.map((t) => `${t.seedRepo}-${t.index}`));

      // Filter marketCreationTasks to include only tasks in the limited pending set
      // (completed tasks will be skipped during processing anyway)
      marketCreationTasks = marketCreationTasks.filter((task) => {
        const key = `${task.seedRepo}-${task.index}`;
        return limitedTaskKeys.has(key);
      });

      console.log(
        `Limiting to ${MAX_MARKETS_PER_EXECUTION} pending markets per execution (${pendingCount} pending, ${originalCount} total markets)`,
      );
    }

    // Update parent market info
    state.parentMarket = {
      address: parentMarketAddress,
      txHash: DEFAULT_PARENT_MARKET ? null : "unknown", // We don't track this if using existing
      status: DEFAULT_PARENT_MARKET ? "using_existing" : "created",
      createdAt: state.parentMarket.createdAt || new Date().toISOString(),
    };

    // Step 2a: Simulate all contracts in parallel
    console.log("Simulating all market creations...");
    const simulations = await Promise.all(
      marketCreationTasks.map(async ({ seedRepo, index, dependencies, skipReason }) => {
        // Find or create market state
        let marketState = state!.markets.find((m) => m.seedRepo === seedRepo && m.index === index);
        if (!marketState) {
          marketState = {
            seedRepo,
            index,
            dependencies,
            dependenciesCount: dependencies.length,
            status: skipReason ? "skipped" : "simulation_failed",
            skipReason,
            simulation: { status: "skipped" as SimulationStatus },
            transaction: { status: "skipped" as TransactionStatus },
            marketAddress: { status: "skipped" as AddressStatus },
          };
          state!.markets.push(marketState);
        } else {
          // State was already updated before the simulation loop (see above)
          // Just ensure consistency here
          marketState.dependencies = dependencies;
          marketState.dependenciesCount = dependencies.length;
          marketState.skipReason = skipReason;
        }

        // Skip if already completed - no need to simulate or process further
        if (marketState.status === "completed" && marketState.marketAddress.status === "extracted") {
          console.log(`[${seedRepo}] Already completed with address ${marketState.marketAddress.address}, skipping...`);
          return { seedRepo, index, simulation: null, error: null, marketState };
        }

        // Skip if current task should be skipped (re-evaluate based on current dependencies)
        if (skipReason || dependencies.length === 0) {
          marketState.status = "skipped";
          marketState.skipReason = skipReason || "no_dependencies";
          marketState.simulation.status = "skipped";
          return { seedRepo, index, simulation: null, error: null, marketState };
        }

        // If we already have a txHash, try to extract the market address directly without simulating
        if (marketState.transaction.txHash && marketState.transaction.status !== "mined") {
          console.log(
            `[${seedRepo}] Found existing txHash (${marketState.transaction.txHash}), attempting to extract market address...`,
          );
          try {
            const pendingCheck = await checkPendingTransaction(
              marketState.transaction.txHash as `0x${string}`,
              publicClient,
            );
            if (pendingCheck) {
              // Transaction was mined! Extract address and mark as completed
              console.log(
                `[${seedRepo}] Successfully extracted market address from existing tx: ${pendingCheck.address}`,
              );
              marketState.transaction.status = "mined";
              marketState.transaction.minedAt = new Date().toISOString();
              marketState.marketAddress = {
                status: "extracted",
                address: pendingCheck.address,
                extractedAt: new Date().toISOString(),
                error: null,
              };
              marketState.status = "completed";
              marketState.simulation = {
                status: "skipped",
                completedAt: new Date().toISOString(),
                error: null,
              };
              // Return a mock simulation object so the rest of the flow works
              // The actual transaction was already sent, so we just need to mark it as successful
              return {
                seedRepo,
                index,
                simulation: null, // No simulation needed since tx already exists
                error: null,
                marketState,
              };
            }

            // Transaction still pending or not found - will be handled in transaction processing step
            console.log(
              `[${seedRepo}] Existing transaction not yet mined, will check again during transaction processing`,
            );
            // Mark simulation as skipped since we'll use the existing tx
            marketState.simulation = {
              status: "skipped",
              completedAt: new Date().toISOString(),
              error: null,
            };
            // Return null simulation but no error - transaction processing will handle it
            return { seedRepo, index, simulation: null, error: null, marketState };
          } catch (error) {
            console.error(`[${seedRepo}] Error checking existing transaction:`, (error as Error).message);
            // If checking fails, fall through to simulation
          }
        }

        try {
          // For multiscalar markets, the question format should be:
          // "What will be the juror weight (computed through Huber loss minimization in the log domain with δ = 1.345σ, using private data) of [dependency] for <seedRepo> in the round 2 of the deepfunding competition?"
          // The [dependency] part will be replaced by each dependency in the outcomes array
          const questionStart =
            "What will be the juror weight (computed through Huber loss minimization in the log domain with δ = 1.345σ, using private data) of ";
          const questionEnd = ` for ${seedRepo} in the round 2 of the deepfunding competition?`;
          const outcomeType = "dependency";

          // Construct the market name with [dependency] placeholder
          // This format is required for getQuestionParts to extract questionStart and questionEnd
          const marketName = `${questionStart}[${outcomeType}]${questionEnd}`;

          // Step 1: Create questions and ERC20s first using MarketPreDeployHelper
          const createMarketParams = getCreateMarketParams({
            marketType: MarketTypes.MULTI_SCALAR,
            marketName,
            outcomes: dependencies,
            tokenNames: [],
            parentMarket: parentMarketAddress,
            parentOutcome: BigInt(index),
            lowerBound: BigInt(0),
            upperBound: parseEther("1"),
            unit: "weight",
            category: MISC_CATEGORY,
            openingTime,
            chainId,
            collateralToken1: "",
            collateralToken2: "",
            isArbitraryQuestion: false,
          });

          // Create questions only if CREATE_QUESTIONS_ONLY is true (and not in DRY_RUN)
          if (PRE_DEPLOY_MARKETS_ONLY && !DRY_RUN) {
            console.log(`[${seedRepo}] Creating questions...`);
            const questionsSimulation = await publicClient.simulateContract({
              account,
              address: MARKET_PRE_DEPLOY_HELPER_ADDRESS,
              functionName: "createMultiScalarMarket",
              abi: MARKET_PRE_DEPLOY_HELPER_ABI,
              args: [
                createMarketParams, // params
                0n, // from
                BigInt(dependencies.length), // to
                false, // createQuestions
                true, // deployERC20
              ],
              maxFeePerGas,
              maxPriorityFeePerGas,
              gas: GAS_LIMIT,
            });

            const questionsTxHash = await walletClient.writeContract({
              ...questionsSimulation.request,
              gas: undefined, // Let viem estimate
            });

            console.log(`[${seedRepo}] Questions transaction sent, tx hash: ${questionsTxHash}`);
            await publicClient.waitForTransactionReceipt({ hash: questionsTxHash });
            console.log(`[${seedRepo}] Questions created successfully`);
          }

          // If CREATE_QUESTIONS_ONLY is true, skip market creation
          if (PRE_DEPLOY_MARKETS_ONLY) {
            // Update state - questions created (or simulated), market skipped
            marketState.simulation = {
              status: "skipped",
              completedAt: new Date().toISOString(),
              error: null,
            };
            marketState.status = DRY_RUN ? "completed" : "completed";
            return { seedRepo, index, simulation: null, error: null, marketState };
          }

          // Step 2: Create market using MarketFactory (will reuse existing questions)
          const simulation = await publicClient.simulateContract({
            account,
            address: marketFactoryAddress[chainId],
            functionName: "createMultiScalarMarket",
            abi: marketFactoryAbi,
            args: [createMarketParams],
            maxFeePerGas,
            maxPriorityFeePerGas,
            gas: GAS_LIMIT,
          });

          // Update state
          marketState.simulation = {
            status: "success",
            completedAt: new Date().toISOString(),
            error: null,
          };
          // In DRY_RUN, mark as completed since we won't send transactions
          // Otherwise, will be updated when transaction is sent
          marketState.status = DRY_RUN ? "completed" : "simulation_failed";

          return { seedRepo, index, simulation, error: null, marketState };
        } catch (error) {
          console.error(`Error simulating market for ${seedRepo}:`, (error as Error).message);
          // Update state
          marketState.simulation = {
            status: "failed",
            completedAt: new Date().toISOString(),
            error: (error as Error).message,
          };
          marketState.status = "simulation_failed";
          return { seedRepo, index, simulation: null, error, marketState };
        }
      }),
    );

    if (DRY_RUN || PRE_DEPLOY_MARKETS_ONLY) {
      // Log simulation results
      // Exclude skipped markets from failed simulations count
      const successfulSimulations = simulations.filter((result) => result.simulation !== null && result.error === null);
      const failedSimulations = simulations.filter(
        (result) => (result.simulation === null || result.error !== null) && result.marketState?.status !== "skipped",
      );
      const skippedSimulations = simulations.filter((result) => result.marketState?.status === "skipped");

      console.log("\n=== Results ===");
      if (PRE_DEPLOY_MARKETS_ONLY) {
        console.log(`Questions created for ${successfulSimulations.length} markets`);
        if (skippedSimulations.length > 0) {
          console.log(`Skipped ${skippedSimulations.length} markets (not processed)`);
        }
        if (failedSimulations.length > 0) {
          console.error(`Failed to create questions for ${failedSimulations.length} markets:`);
          for (const result of failedSimulations) {
            console.error(`  - ${result.seedRepo}: ${result.error?.message || "Unknown error"}`);
          }
        }
        console.log("CREATE_QUESTIONS_ONLY enabled: skipping market creation.");
      } else {
        console.log(`Successfully simulated ${successfulSimulations.length} markets`);
        if (skippedSimulations.length > 0) {
          console.log(`Skipped ${skippedSimulations.length} markets (not simulated)`);
        }
        if (failedSimulations.length > 0) {
          console.error(`Failed to simulate ${failedSimulations.length} markets:`);
          for (const result of failedSimulations) {
            console.error(`  - ${result.seedRepo}: ${result.error?.message || "Unknown error"}`);
          }
        }
        console.log("DRY_RUN enabled: skipping transaction sending and address extraction.");
      }
      console.log("========================\n");

      // Save final state and print summary
      if (state) {
        await saveState(state);
        printSummary(state);
      }
      return;
    }

    // Step 2b: Send transactions, wait for confirmation, and extract market addresses sequentially
    const totalTransactions = simulations.length;

    // Count how many markets will actually be processed (not skipped or already completed)
    const marketsToProcess = simulations.filter(({ marketState, error, simulation }) => {
      if (marketState?.status === "skipped") return false;
      if (marketState?.status === "completed" && marketState.marketAddress.status === "extracted") return false;
      if ((error || !simulation) && !marketState?.transaction.txHash) return false;
      return true;
    }).length;

    const alreadyCompleted = simulations.filter(
      ({ marketState }) => marketState?.status === "completed" && marketState.marketAddress.status === "extracted",
    ).length;

    const skipped = simulations.filter(({ marketState }) => marketState?.status === "skipped").length;

    console.log(
      `Processing ${marketsToProcess} markets sequentially (${totalTransactions} total: ${marketsToProcess} to process, ${alreadyCompleted} already completed, ${skipped} skipped)...`,
    );
    const successful: Array<{
      seedRepo: string;
      txHash: `0x${string}`;
      marketAddress: Address | null;
      marketState: MarketState;
      wasAlreadyCompleted?: boolean;
    }> = [];
    const failed: Array<{ seedRepo: string; error: Error; marketState: MarketState }> = [];

    for (let i = 0; i < simulations.length; i++) {
      const { seedRepo, simulation, error, marketState } = simulations[i];
      const txNumber = i + 1;

      // Skip if market was intentionally skipped (e.g., exceeds limit, in ignore list, etc.)
      if (marketState?.status === "skipped") {
        console.log(`[${txNumber}/${totalTransactions}] Skipping ${seedRepo}: ${marketState.skipReason || "skipped"}`);
        continue;
      }

      // Skip if market is already completed (address was extracted during simulation phase)
      if (marketState?.status === "completed" && marketState.marketAddress.status === "extracted") {
        console.log(
          `[${txNumber}/${totalTransactions}] Skipping ${seedRepo}: already completed with address ${marketState.marketAddress.address}`,
        );
        successful.push({
          seedRepo,
          txHash: marketState.transaction.txHash as `0x${string}`,
          marketAddress: marketState.marketAddress.address as Address,
          marketState,
          wasAlreadyCompleted: true,
        });
        continue;
      }

      // If we have an error or no simulation, but we have a txHash, we can still process it
      // (this happens when we skipped simulation because txHash already exists)
      if ((error || !simulation) && !marketState?.transaction.txHash) {
        console.error(
          `[${txNumber}/${totalTransactions}] Skipping ${seedRepo}: simulation failed and no existing txHash`,
        );
        if (marketState) {
          marketState.transaction = {
            status: "skipped",
            txHash: null,
            sentAt: null,
            minedAt: null,
            error: "Skipped due to simulation failure",
          };
          failed.push({ seedRepo, error: error || new Error("Simulation is null"), marketState });
          // Persist state after marking this market as failed/skipped
          if (state) {
            await saveState(state);
          }
        }
        continue;
      }

      if (!marketState) {
        console.error(`[${txNumber}/${totalTransactions}] Skipping ${seedRepo}: marketState is null`);
        continue;
      }

      try {
        let txHash: `0x${string}`;
        let marketAddress: Address;
        let isResumed = false;

        // Check if we should resume a pending transaction
        if (
          RESUME_PENDING_TRANSACTIONS &&
          marketState.transaction.status === "sent" &&
          marketState.transaction.txHash
        ) {
          const existingTxHash = marketState.transaction.txHash as `0x${string}`;
          console.log(
            `[${txNumber}/${totalTransactions}] Checking if pending transaction was mined for ${seedRepo} (tx: ${existingTxHash})...`,
          );

          const pendingCheck = await checkPendingTransaction(existingTxHash, publicClient);
          if (pendingCheck) {
            // Transaction was finally mined!
            txHash = existingTxHash;
            marketAddress = pendingCheck.address;
            isResumed = true;
            console.log(
              `[${txNumber}/${totalTransactions}] Found mined transaction for ${seedRepo}, market address: ${marketAddress}`,
            );
          } else {
            // Transaction still pending or not found - skip sending new transaction when RESUME_PENDING_TRANSACTIONS is true
            console.log(
              `[${txNumber}/${totalTransactions}] Pending transaction not found/mined for ${seedRepo}, skipping (RESUME_PENDING_TRANSACTIONS=true). Will check again on next run.`,
            );
            // Don't update state, keep it as "sent" so it will be checked again next time
            continue;
          }
        } else {
          // Check if we have an existing txHash but no simulation (e.g., address_extraction_failed state)
          if (marketState.transaction.txHash && !simulation) {
            const existingTxHash = marketState.transaction.txHash as `0x${string}`;
            console.log(
              `[${txNumber}/${totalTransactions}] Found existing txHash without simulation for ${seedRepo} (tx: ${existingTxHash}), checking if mined...`,
            );

            const pendingCheck = await checkPendingTransaction(existingTxHash, publicClient);
            if (pendingCheck) {
              // Transaction was mined!
              txHash = existingTxHash;
              marketAddress = pendingCheck.address;
              isResumed = true;
              console.log(
                `[${txNumber}/${totalTransactions}] Found mined transaction for ${seedRepo}, market address: ${marketAddress}`,
              );
            } else {
              // Transaction still pending - wait for it
              console.log(
                `[${txNumber}/${totalTransactions}] Waiting for existing transaction to be mined for ${seedRepo}...`,
              );
              txHash = existingTxHash;
              marketAddress = await getMarketAddressFromTxHash(txHash, publicClient);
              console.log(
                `[${txNumber}/${totalTransactions}] Transaction mined for ${seedRepo}, market address: ${marketAddress}`,
              );
            }
          } else if (!simulation) {
            // No simulation and no txHash - this shouldn't happen, but handle gracefully
            throw new Error("No simulation and no existing txHash - cannot proceed");
          } else {
            // No pending transaction or RESUME_PENDING_TRANSACTIONS is false - send new transaction
            console.log(`[${txNumber}/${totalTransactions}] Sending transaction for ${seedRepo}...`);
            txHash = await walletClient.writeContract({
              ...simulation.request,
              maxFeePerGas,
              maxPriorityFeePerGas,
            });
            console.log(`[${txNumber}/${totalTransactions}] Transaction sent for ${seedRepo}, tx hash: ${txHash}`);

            // Update state - transaction sent
            marketState.transaction = {
              status: "sent",
              txHash,
              sentAt: new Date().toISOString(),
              minedAt: null,
              error: null,
            };
            marketState.status = "transaction_sent";
            marketState.marketAddress.status = "pending";

            // Wait for transaction to be mined and extract market address
            console.log(`[${txNumber}/${totalTransactions}] Waiting for transaction to be mined for ${seedRepo}...`);
            marketAddress = await getMarketAddressFromTxHash(txHash, publicClient);
            console.log(
              `[${txNumber}/${totalTransactions}] Transaction mined for ${seedRepo}, market address: ${marketAddress}`,
            );
          }
        }

        // Update state - transaction mined and address extracted
        marketState.transaction.status = "mined";
        if (isResumed) {
          // When resuming, try to get the block timestamp from the receipt
          // For now, use current time but keep original sentAt
          marketState.transaction.minedAt = new Date().toISOString();
        } else {
          marketState.transaction.minedAt = new Date().toISOString();
        }
        marketState.marketAddress = {
          status: "extracted",
          address: marketAddress,
          extractedAt: new Date().toISOString(),
          error: null,
        };
        marketState.status = "completed";

        successful.push({ seedRepo, txHash, marketAddress, marketState, wasAlreadyCompleted: false });
        // Persist state after successfully processing this market
        if (state) {
          await saveState(state);
        }
      } catch (error) {
        const errorMessage = (error as Error).message;
        console.error(`[${txNumber}/${totalTransactions}] Error processing ${seedRepo}:`, errorMessage);

        // Determine if error occurred during sending or during mining/extraction
        const currentTxStatus = marketState.transaction.status;
        if (currentTxStatus === "sent" || currentTxStatus === "mined") {
          // Error occurred during mining or address extraction
          marketState.marketAddress = {
            status: "failed",
            address: null,
            extractedAt: new Date().toISOString(),
            error: errorMessage,
          };
          marketState.status = "address_extraction_failed";
        } else {
          // Error occurred during transaction sending
          marketState.transaction = {
            status: "failed",
            txHash: null,
            sentAt: new Date().toISOString(),
            minedAt: null,
            error: errorMessage,
          };
          marketState.status = "transaction_failed";
        }

        failed.push({ seedRepo, error: error as Error, marketState });
        // Persist state after a failed send/mining/address extraction
        if (state) {
          await saveState(state);
        }
      }
    }

    // Print results summary
    const newlyProcessed = successful.filter((s) => !s.wasAlreadyCompleted).length;
    const alreadyCompletedCount = successful.filter((s) => s.wasAlreadyCompleted).length;
    console.log(
      `\nSuccessfully processed ${newlyProcessed} new markets${alreadyCompletedCount > 0 ? ` (${alreadyCompletedCount} were already completed)` : ""}`,
    );
    if (failed.length > 0) {
      console.error(`Failed to process ${failed.length} markets:`);
      for (const { seedRepo, error } of failed) {
        console.error(`  - ${seedRepo}: ${error.message}`);
      }
    }

    // Print all market addresses
    if (successful.length > 0) {
      console.log("\n=== Multi-scalar Market Addresses ===");
      for (const { seedRepo, txHash, marketAddress } of successful) {
        if (marketAddress) {
          console.log(`${seedRepo}:`);
          console.log(`  Market Address: ${marketAddress}`);
          console.log(`  Transaction Hash: ${txHash}`);
        } else {
          console.log(`${seedRepo}: Failed to extract market address`);
          console.log(`  Transaction Hash: ${txHash}`);
        }
      }
      console.log("=====================================\n");
    }

    // Save final state and print summary
    if (state) {
      await saveState(state);
      printSummary(state);
    }
  } catch (error) {
    console.error("Error creating DeepFunding markets:", error.message);
    throw error;
  }
})();
