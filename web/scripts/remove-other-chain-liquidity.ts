/**
 * Removes the Swapr (Algebra v1) liquidity a wallet holds on the outcomes of one market. It undoes
 * `add-other-chain-liquidity.ts` for one market of a chain of "Other" markets; the rest of the chain is
 * left untouched.
 *
 * POSITIONS: every position NFT the wallet owns on the `outcome/sDAI` pool of one of the market's
 * outcomes, found by enumerating the wallet's NFTs rather than read from an add run's state file. That
 * covers the seed positions an add run puts in empty pools, and positions from more than one run. Each
 * one is removed in a single position manager multicall: decrease all its liquidity, collect the tokens
 * and fees, burn the empty NFT.
 *
 * The outcome tokens stay in the wallet. A merge needs an approval to the router for every outcome slot
 * (80 per market in a chain) and, outside the leaf market, the "Other" that was split into the next
 * market, while a single redeem after resolution recovers the winning outcome's value.
 *
 * MERGE (opt-in, --merge): the market merges as many complete sets as its scarcest outcome allows
 * (Invalid included). Merging a root market pays out sDAI; merging a child market pays out the parent
 * outcome it hangs from (the "Other" of the previous market in a chain), which stays in the wallet.
 * Traders moved the pool prices, so the outcomes come back in unequal amounts: what does not form a
 * complete set also stays in the wallet.
 *
 * Every step reads the chain, so rerunning the script resumes an interrupted run. A run refuses to start
 * while the wallet has transactions in flight, which keeps it from repeating a merge that is already
 * pending.
 *
 * Usage (from the `web/` directory):
 *   Dry run (default): lists the positions, and with --merge the merge they lead to.
 *     npx tsx scripts/remove-other-chain-liquidity.ts --market 0x... --owner 0x...
 *   Execute:
 *     PRIVATE_KEY=0x... npx tsx scripts/remove-other-chain-liquidity.ts --market 0x... --execute
 *
 * Options:
 *   --market <address>      The market to remove the liquidity from. Required.
 *   --owner <address>       Wallet to plan for in a dry run. Defaults to the PRIVATE_KEY account.
 *   --slippage <pct>        Tolerance for the amounts each position pays out. Default 1.
 *   --merge                 Also merge the complete sets the outcome tokens form. Off by default.
 *   --priority-fee <gwei>   maxPriorityFeePerGas. Default 1.
 * Env: PRIVATE_KEY (only with --execute), RPC_URL (default: a public Gnosis RPC).
 */
import { parseArgs } from "node:util";
import { getMergeExecution, getRouterAddress } from "@seer-pm/sdk";
import { marketAbi } from "@seer-pm/sdk/contracts/market-factory";
import {
  http,
  type Address,
  type Hex,
  createPublicClient,
  createWalletClient,
  decodeFunctionResult,
  encodeFunctionData,
  erc20Abi,
  formatEther,
  isAddress,
  maxUint128,
  maxUint256,
  parseAbi,
  parseGwei,
  zeroAddress,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { gnosis } from "viem/chains";

const INVALID_OUTCOME = "Invalid";
const RPC = "https://rpc.gnosischain.com";
const SDAI: Address = "0xaf204776c7245bF4147c2612BF6e5972Ee483701";
const POSITION_MANAGER: Address = "0x91fd594c46d8b01e62dbdebed2401dde01817834";
const PRIORITY_FEE_GWEI = "1";
const GAS_BUFFER_PERCENT = 120n;
// An Algebra pool writes an oracle timepoint on its first interaction in a block. An estimate taken in a
// block where a previous tx already wrote it leaves that write out.
const GAS_BUFFER_FIXED = 100_000n;
// EIP-7825 per-transaction gas cap. Merging an 80-slot market estimates close to it, and estimates run
// well above the gas actually used, so the buffered limit is clamped to the cap instead of failing.
const TX_GAS_CAP = 16_777_216n;
const RECEIPT_TIMEOUT_MS = 30 * 60 * 1000;
// Removals touch one NFT each, so they are simulated and sent in flight together, this many at a time.
const PIPELINE = 20;

// Swapr's Algebra v1.9 position manager: `positions` has no fee field, unlike Uniswap v3's.
const positionManagerAbi = parseAbi([
  "function balanceOf(address owner) view returns (uint256)",
  "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
  "function positions(uint256 tokenId) view returns (uint96 nonce, address operator, address token0, address token1, int24 tickLower, int24 tickUpper, uint128 liquidity, uint256 feeGrowthInside0LastX128, uint256 feeGrowthInside1LastX128, uint128 tokensOwed0, uint128 tokensOwed1)",
  "struct DecreaseLiquidityParams { uint256 tokenId; uint128 liquidity; uint256 amount0Min; uint256 amount1Min; uint256 deadline; }",
  "function decreaseLiquidity(DecreaseLiquidityParams params) payable returns (uint256 amount0, uint256 amount1)",
  "struct CollectParams { uint256 tokenId; address recipient; uint128 amount0Max; uint128 amount1Max; }",
  "function collect(CollectParams params) payable returns (uint256 amount0, uint256 amount1)",
  "function burn(uint256 tokenId) payable",
  "function multicall(bytes[] data) payable returns (bytes[] results)",
]);

type Market = {
  id: Address;
  // Every outcome slot, Invalid last: a merge takes the same amount of each.
  names: string[];
  tokens: Address[];
  // What a merge pays out: sDAI for a root market, the parent outcome for a child market.
  payout: { token: Address; name: string };
};

type OwnedPosition = {
  tokenId: bigint;
  outcome: { name: string; token: Address };
  outcomeIsToken0: boolean;
  liquidity: bigint;
};

type LpPosition = {
  tokenId: bigint;
  outcome: string;
  outcomeToken: Address;
  outcomeIsToken0: boolean;
  liquidity: bigint;
  // What `decreaseLiquidity` releases at the current price, the part the slippage tolerance applies to.
  amount0: bigint;
  amount1: bigint;
  // What the wallet receives: the released amounts plus fees and anything already owed.
  outcomeOut: bigint;
  sdaiOut: bigint;
};

const { values: args } = parseArgs({
  options: {
    market: { type: "string" },
    owner: { type: "string" },
    slippage: { type: "string", default: "1" },
    merge: { type: "boolean", default: false },
    "priority-fee": { type: "string", default: PRIORITY_FEE_GWEI },
    execute: { type: "boolean", default: false },
  },
});

const transport = http(process.env.RPC_URL ?? RPC);
const publicClient = createPublicClient({ chain: gnosis, transport });

const deadline = () => BigInt(Math.floor(Date.now() / 1000) + 3600);

async function readMarket(id: Address): Promise<Market> {
  const [numOutcomes, parentMarket, parentOutcome] = await Promise.all([
    publicClient.readContract({ address: id, abi: marketAbi, functionName: "numOutcomes" }),
    publicClient.readContract({ address: id, abi: marketAbi, functionName: "parentMarket" }),
    publicClient.readContract({ address: id, abi: marketAbi, functionName: "parentOutcome" }),
  ]);
  const indexes = [...Array(Number(numOutcomes)).keys()];
  const [names, wrapped] = await Promise.all([
    publicClient.multicall({
      allowFailure: false,
      contracts: indexes.map(
        (i) => ({ address: id, abi: marketAbi, functionName: "outcomes", args: [BigInt(i)] }) as const,
      ),
    }),
    // The Invalid slot follows the named outcomes.
    publicClient.multicall({
      allowFailure: false,
      contracts: [...indexes, indexes.length].map(
        (i) => ({ address: id, abi: marketAbi, functionName: "wrappedOutcome", args: [BigInt(i)] }) as const,
      ),
    }),
  ]);
  let payout = { token: SDAI, name: "sDAI" };
  if (parentMarket !== zeroAddress) {
    const [[parentToken], parentName] = await Promise.all([
      publicClient.readContract({ address: id, abi: marketAbi, functionName: "parentWrappedOutcome" }),
      publicClient.readContract({
        address: parentMarket,
        abi: marketAbi,
        functionName: "outcomes",
        args: [parentOutcome],
      }),
    ]);
    payout = { token: parentToken, name: `"${parentName}" of ${parentMarket}` };
  }
  return { id, names: [...names, INVALID_OUTCOME], tokens: wrapped.map(([token]) => token), payout };
}

/** Position manager calls that empty a position and burn its NFT. */
function removeCalls(owner: Address, tokenId: bigint, liquidity: bigint, amount0Min: bigint, amount1Min: bigint) {
  const decrease = encodeFunctionData({
    abi: positionManagerAbi,
    functionName: "decreaseLiquidity",
    args: [{ tokenId, liquidity, amount0Min, amount1Min, deadline: deadline() }],
  });
  const collect = encodeFunctionData({
    abi: positionManagerAbi,
    functionName: "collect",
    args: [{ tokenId, recipient: owner, amount0Max: maxUint128, amount1Max: maxUint128 }],
  });
  const burn = encodeFunctionData({ abi: positionManagerAbi, functionName: "burn", args: [tokenId] });
  // `decreaseLiquidity` rejects a zero amount, and an emptied position may still owe tokens.
  return liquidity > 0n ? [decrease, collect, burn] : [collect, burn];
}

/** The wallet's positions on the market's pools, with what removing each one pays out right now. */
async function readPositions(owner: Address, market: Market): Promise<LpPosition[]> {
  const outcomeByToken = new Map(
    market.tokens.map((token, i) => [token.toLowerCase(), { name: market.names[i], token }] as const),
  );
  const count = await publicClient.readContract({
    address: POSITION_MANAGER,
    abi: positionManagerAbi,
    functionName: "balanceOf",
    args: [owner],
  });
  const tokenIds = await publicClient.multicall({
    allowFailure: false,
    contracts: [...Array(Number(count)).keys()].map(
      (i) =>
        ({
          address: POSITION_MANAGER,
          abi: positionManagerAbi,
          functionName: "tokenOfOwnerByIndex",
          args: [owner, BigInt(i)],
        }) as const,
    ),
  });
  const reads = await publicClient.multicall({
    allowFailure: false,
    contracts: tokenIds.map(
      (tokenId) =>
        ({ address: POSITION_MANAGER, abi: positionManagerAbi, functionName: "positions", args: [tokenId] }) as const,
    ),
  });

  const matched = reads.flatMap<OwnedPosition>(([, , token0, token1, , , liquidity], i) => {
    const outcomeIsToken0 = token1.toLowerCase() === SDAI.toLowerCase();
    if (!outcomeIsToken0 && token0.toLowerCase() !== SDAI.toLowerCase()) return [];
    const outcome = outcomeByToken.get((outcomeIsToken0 ? token0 : token1).toLowerCase());
    return outcome ? [{ tokenId: tokenIds[i], outcome, outcomeIsToken0, liquidity }] : [];
  });

  const positions: LpPosition[] = [];
  for (let start = 0; start < matched.length; start += PIPELINE) {
    positions.push(
      ...(await Promise.all(matched.slice(start, start + PIPELINE).map((p) => simulateRemoval(owner, p)))),
    );
  }
  return positions;
}

/** What removing a position pays out right now. */
async function simulateRemoval(
  owner: Address,
  { tokenId, outcome, outcomeIsToken0, liquidity }: OwnedPosition,
): Promise<LpPosition> {
  // The simulation runs as the owner, the only account the position manager lets decrease the position.
  const { result } = await publicClient.simulateContract({
    account: owner,
    address: POSITION_MANAGER,
    abi: positionManagerAbi,
    functionName: "multicall",
    args: [removeCalls(owner, tokenId, liquidity, 0n, 0n)],
  });
  const [amount0, amount1] =
    liquidity > 0n
      ? decodeFunctionResult({ abi: positionManagerAbi, functionName: "decreaseLiquidity", data: result[0] })
      : [0n, 0n];
  const [collected0, collected1] = decodeFunctionResult({
    abi: positionManagerAbi,
    functionName: "collect",
    data: result[liquidity > 0n ? 1 : 0],
  });
  return {
    tokenId,
    outcome: outcome.name,
    outcomeToken: outcome.token,
    outcomeIsToken0,
    liquidity,
    amount0,
    amount1,
    outcomeOut: outcomeIsToken0 ? collected0 : collected1,
    sdaiOut: outcomeIsToken0 ? collected1 : collected0,
  };
}

/** The wallet's balance of each of the market's outcome slots, in slot order. */
async function readBalances(owner: Address, market: Market): Promise<bigint[]> {
  return publicClient.multicall({
    allowFailure: false,
    contracts: market.tokens.map(
      (token) => ({ address: token, abi: erc20Abi, functionName: "balanceOf", args: [owner] }) as const,
    ),
  });
}

/** Index of the slot with the smallest balance: it caps the complete sets a merge can take. */
const scarcest = (balances: bigint[]) => balances.reduce((min, balance, i) => (balance < balances[min] ? i : min), 0);

function printPlan(market: Market, positions: LpPosition[], balances: bigint[]) {
  if (positions.length) {
    console.table(
      positions.map((position) => ({
        outcome: position.outcome.slice(0, 32),
        tokenId: position.tokenId.toString(),
        status: position.liquidity > 0n ? "" : "no liquidity",
        outcomeTokens: Number(formatEther(position.outcomeOut)).toFixed(4),
        sDAI: Number(formatEther(position.sdaiOut)).toFixed(6),
      })),
    );
  }
  const collectedSdai = positions.reduce((total, position) => total + position.sdaiOut, 0n);
  console.log(`Market: ${market.id}, ${market.names.length} outcome slots`);
  console.log(`Positions to remove: ${positions.length}, paying out ${formatEther(collectedSdai)} sDAI`);
  if (!args.merge) return;

  const held = balances.map(
    (balance, i) =>
      balance +
      positions
        .filter((position) => position.outcomeToken.toLowerCase() === market.tokens[i].toLowerCase())
        .reduce((total, position) => total + position.outcomeOut, 0n),
  );
  const limit = scarcest(held);
  console.log(
    `Merge: ${formatEther(held[limit])} complete sets (limited by ${market.names[limit]}), paying out ${market.payout.name}`,
  );
}

async function main() {
  if (!args.market || !isAddress(args.market)) {
    throw new Error("Pass --market with the market's address");
  }
  const privateKey = process.env.PRIVATE_KEY as Hex | undefined;
  const account = privateKey ? privateKeyToAccount(privateKey) : undefined;
  const owner = (account?.address ?? args.owner) as Address | undefined;
  if (!owner) {
    throw new Error("Pass --owner, or PRIVATE_KEY for the wallet that holds the liquidity");
  }
  if (account && args.owner && args.owner.toLowerCase() !== account.address.toLowerCase()) {
    throw new Error(`--owner ${args.owner} is not the PRIVATE_KEY account ${account.address}`);
  }

  const market = await readMarket(args.market);
  const positions = await readPositions(owner, market);
  printPlan(market, positions, await readBalances(owner, market));

  if (!args.execute) {
    console.log("\nDry run: pass --execute to remove the liquidity.");
    return;
  }
  if (!account) {
    throw new Error("PRIVATE_KEY is required with --execute");
  }
  const [mined, pending] = await Promise.all([
    publicClient.getTransactionCount({ address: account.address, blockTag: "latest" }),
    publicClient.getTransactionCount({ address: account.address, blockTag: "pending" }),
  ]);
  if (pending > mined) {
    throw new Error(`${account.address} has ${pending - mined} txs in flight. Rerun once they are mined.`);
  }
  const walletClient = createWalletClient({ account, chain: gnosis, transport });
  const maxPriorityFeePerGas = parseGwei(args["priority-fee"]!);
  const sdaiBalance = () =>
    publicClient.readContract({ address: SDAI, abi: erc20Abi, functionName: "balanceOf", args: [account.address] });
  const sdaiBefore = await sdaiBalance();

  const gasFor = async (to: Address, data: Hex) => {
    const gas = await publicClient.estimateGas({ account, to, data });
    if (gas > TX_GAS_CAP) {
      throw new Error(`${to} call needs ${gas} gas, over the per-tx cap`);
    }
    const buffered = (gas * GAS_BUFFER_PERCENT) / 100n + GAS_BUFFER_FIXED;
    return buffered > TX_GAS_CAP ? TX_GAS_CAP : buffered;
  };

  const waitFor = async (hash: Hex, label: string) => {
    const receipt = await publicClient.waitForTransactionReceipt({ hash, timeout: RECEIPT_TIMEOUT_MS });
    if (receipt.status !== "success") {
      throw new Error(`${label} reverted: ${hash}`);
    }
    return receipt;
  };

  /** Sends independent txs with consecutive nonces, then waits for all of them. */
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

  // 1. Removals. Pulling liquidity does not move a pool's price, so positions sharing a pool (an add run's
  // seed and its mint) keep their simulated amounts while the others land.
  const slippageBps = BigInt(Math.round(Number(args.slippage) * 100));
  const slippage = (amount: bigint) => (amount * (10_000n - slippageBps)) / 10_000n;
  await sendPipelined(
    positions.map((position) => ({
      to: POSITION_MANAGER,
      data: encodeFunctionData({
        abi: positionManagerAbi,
        functionName: "multicall",
        args: [
          removeCalls(
            account.address,
            position.tokenId,
            position.liquidity,
            slippage(position.amount0),
            slippage(position.amount1),
          ),
        ],
      }),
      label: `remove ${position.outcome} #${position.tokenId}`,
    })),
  );

  // 2. Merge, sized from the live balances.
  if (args.merge) {
    const balances = await readBalances(account.address, market);
    const amount = balances[scarcest(balances)];
    if (amount === 0n) {
      console.log("merge: nothing to merge");
    } else {
      const seerMarket = { id: market.id, type: "Generic" as const, chainId: gnosis.id };
      const router = getRouterAddress(seerMarket);
      const allowances = await publicClient.multicall({
        allowFailure: false,
        contracts: market.tokens.map(
          (token) =>
            ({ address: token, abi: erc20Abi, functionName: "allowance", args: [account.address, router] }) as const,
        ),
      });
      await sendPipelined(
        market.tokens
          .map((token, i) => ({ token, name: market.names[i], allowance: allowances[i] }))
          .filter(({ allowance }) => allowance < amount)
          .map(({ token, name }) => ({
            to: token,
            data: encodeFunctionData({ abi: erc20Abi, functionName: "approve", args: [router, maxUint256] }),
            label: `approve ${name}`,
          })),
      );
      // Child markets were split with sDAI as the collateral argument, so they merge with it too.
      const merge = getMergeExecution({ router, market: seerMarket, collateralToken: SDAI, amount });
      const hash = await walletClient.sendTransaction({
        to: merge.to,
        data: merge.data,
        gas: await gasFor(merge.to, merge.data),
        maxPriorityFeePerGas,
      });
      console.log(`merge ${formatEther(amount)} sets into ${market.payout.name}: ${hash}`);
      await waitFor(hash, "merge");
    }
  }

  const [sdaiAfter, left] = await Promise.all([sdaiBalance(), readBalances(account.address, market)]);
  const leftover = left.filter((balance) => balance > 0n);
  console.log(`\nDone: ${formatEther(sdaiAfter - sdaiBefore)} sDAI back to the wallet.`);
  console.log(
    `Left in the wallet: ${leftover.length} of the market's outcome tokens, ${formatEther(leftover.reduce((a, b) => a + b, 0n))} in total.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
