/**
 * Complete-set composite trade execution: mint+sell and buy+merge as 7702 batches or sequential txs.
 *
 * A route has one AMM leg per outcome other than the target (see `CompleteSetLeg.swapLegs`), so
 * on a market with many outcomes the batch can outgrow a transaction. Every chain caps a single
 * transaction at 2^24 gas (EIP-7825), whatever its block limit, so the calls are packed into
 * batches under `COMPLETE_SET_BATCH_GAS_BUDGET` and sent one after another. The split (or the
 * merge) sits in the first (or the last) batch; a batch that fails in between leaves the user
 * holding outcome tokens, never short of anything.
 */

import type { Address, Client } from "viem";
import { sendTransaction } from "viem/actions";
import { gnosis } from "viem/chains";
import type { AmmTrade } from "./amm-trade";
import { fetchNeededApprovals, getApprovals7702 } from "./approvals";
import type { SupportedChain } from "./chains";
import type { CompleteSetLeg } from "./complete-set-quote";
import { buildAmmTradeExecution, getTradeApprovals7702 } from "./execute-trade";
import type { Execution } from "./execution";
import { getMergeExecution } from "./merge-positions";
import { getRouterAddress } from "./router-addresses";
import { getSplitExecution } from "./split-position";
import type { TradeTokensProps } from "./trade-utils";
import { getMaximumAmountIn } from "./trade-utils";

/** Routes that split collateral first and then swap legs of the freshly minted set. */
const SPLIT_FIRST_ROUTES = new Set<CompleteSetLeg["route"]>(["mintSell", "mintToCover"]);

/**
 * Gas one batch may plan for. EIP-7825 caps a transaction at 16,777,216 gas on every supported
 * chain; the rest is margin for the wallet's estimation buffer and the 7702 delegate overhead.
 */
export const COMPLETE_SET_BATCH_GAS_BUDGET = 12_000_000n;

/** Gas each piece of a complete-set batch is planned with. Measured on Seer pools, rounded up. */
export interface CompleteSetGasProfile {
  swap: bigint;
  approve: bigint;
  splitBase: bigint;
  splitPerOutcome: bigint;
  mergeBase: bigint;
  mergePerOutcome: bigint;
  /** What the 7702 delegate adds per call. */
  callOverhead: bigint;
}

const UNISWAP_GAS_PROFILE: CompleteSetGasProfile = {
  swap: 200_000n,
  approve: 50_000n,
  splitBase: 150_000n,
  splitPerOutcome: 110_000n,
  mergeBase: 120_000n,
  mergePerOutcome: 110_000n,
  callOverhead: 15_000n,
};

/** Swapr (Algebra) swaps cost about twice a Uniswap V3 swap. */
const SWAPR_GAS_PROFILE: CompleteSetGasProfile = { ...UNISWAP_GAS_PROFILE, swap: 400_000n };

export function getCompleteSetGasProfile(chainId: number): CompleteSetGasProfile {
  return chainId === gnosis.id ? SWAPR_GAS_PROFILE : UNISWAP_GAS_PROFILE;
}

/** One AMM leg, flattened to what execution needs. */
interface ExecutableLeg {
  token: Address;
  amount: bigint;
  trade: AmmTrade;
  /** DEX router the leg's input has to be approved to. */
  spender: Address;
  /** buy+merge: collateral this leg may pull at the slippage limit. */
  maxIn: bigint;
}

type ValidatedCompleteSetTrade = {
  completeSetLeg: NonNullable<TradeTokensProps["completeSetLeg"]>;
} & (
  | {
      route: "mintSell" | "mintToCover";
      splitAmount: bigint;
      /** Outcomes sold after the split: every other outcome for mintSell, the target for mintToCover. */
      sellLegs: ExecutableLeg[];
    }
  | {
      route: "buyMerge";
      mergeAmount: bigint;
      /** Outcomes bought before the merge, already net of what the wallet holds. */
      buyLegs: ExecutableLeg[];
      /** Every wrapped outcome the merge burns, Invalid included. */
      mergeOutcomeTokens: Address[];
    }
);

function getValidatedMaximumAmountIn(trade: AmmTrade): bigint {
  let maxBuyIn: bigint;
  try {
    maxBuyIn = getMaximumAmountIn(trade);
  } catch {
    throw new Error("Complete-set trade requires a valid maximum amount in from trade");
  }
  if (maxBuyIn <= 0n) {
    throw new Error("Complete-set trade requires a positive maximum amount in");
  }
  return maxBuyIn;
}

function getLegSpender(trade: AmmTrade, fallback: Address): Address {
  return (trade.approveAddress as Address | undefined) ?? fallback;
}

function validateCompleteSetTradeProps(props: TradeTokensProps): ValidatedCompleteSetTrade {
  const { completeSetLeg, trade } = props;
  if (!completeSetLeg) {
    throw new Error("Complete-set trade requires completeSetLeg");
  }
  if (!trade.approveAddress) {
    throw new Error("Complete-set trade requires trade.approveAddress");
  }
  const swapSpender = trade.approveAddress as Address;
  const { swapLegs } = completeSetLeg;

  if (SPLIT_FIRST_ROUTES.has(completeSetLeg.route)) {
    const route = completeSetLeg.route as "mintSell" | "mintToCover";
    const splitAmount = completeSetLeg.splitAmount;
    if (!splitAmount) {
      throw new Error(`${route} route requires splitAmount`);
    }

    if (swapLegs && swapLegs.length > 0) {
      return {
        completeSetLeg,
        route,
        splitAmount,
        sellLegs: swapLegs.map((leg) => ({
          token: leg.outcomeToken.address,
          amount: leg.amount,
          trade: leg.trade,
          spender: getLegSpender(leg.trade, swapSpender),
          maxIn: 0n,
        })),
      };
    }

    // Single-leg form. Defaults keep mint+sell on its original behaviour: sell exactly what was
    // minted. mint+sell sells the outcome opposite the target; mint-to-cover sells the target
    // itself and says so explicitly through swapInputToken. Exactly one of the two is present.
    const swapInputAmount = completeSetLeg.swapInputAmount ?? splitAmount;
    if (swapInputAmount <= 0n) {
      throw new Error(`${route} route requires a positive swapInputAmount`);
    }
    const swapInputToken = completeSetLeg.swapInputToken ?? completeSetLeg.oppositeOutcomeToken;
    if (!swapInputToken) {
      throw new Error(`${route} route requires swapInputToken or oppositeOutcomeToken`);
    }
    return {
      completeSetLeg,
      route,
      splitAmount,
      sellLegs: [{ token: swapInputToken.address, amount: swapInputAmount, trade, spender: swapSpender, maxIn: 0n }],
    };
  }

  if (completeSetLeg.route === "buyMerge") {
    const mergeAmount = completeSetLeg.mergeAmount;
    if (!mergeAmount) {
      throw new Error("buyMerge route requires mergeAmount");
    }

    if (swapLegs && swapLegs.length > 0) {
      return {
        completeSetLeg,
        route: "buyMerge",
        mergeAmount,
        buyLegs: swapLegs.map((leg) => ({
          token: leg.outcomeToken.address,
          amount: leg.amount,
          trade: leg.trade,
          spender: getLegSpender(leg.trade, swapSpender),
          maxIn: getValidatedMaximumAmountIn(leg.trade),
        })),
        mergeOutcomeTokens: [
          completeSetLeg.targetOutcomeToken.address,
          ...swapLegs.map((leg) => leg.outcomeToken.address),
          ...(completeSetLeg.heldOutcomeTokens ?? []).map((held) => held.token.address),
        ],
      };
    }

    // Single-leg form: buys the one outcome opposite the target and burns the whole set. Without
    // the opposite token the merge would be under-approved and revert.
    if (!completeSetLeg.oppositeOutcomeToken) {
      throw new Error("buyMerge route requires oppositeOutcomeToken");
    }
    return {
      completeSetLeg,
      route: "buyMerge",
      mergeAmount,
      buyLegs: [
        {
          token: completeSetLeg.oppositeOutcomeToken.address,
          amount: mergeAmount,
          trade,
          spender: swapSpender,
          maxIn: getValidatedMaximumAmountIn(trade),
        },
      ],
      mergeOutcomeTokens: [
        completeSetLeg.targetOutcomeToken.address,
        completeSetLeg.oppositeOutcomeToken.address,
        ...(completeSetLeg.invalidOutcomeToken ? [completeSetLeg.invalidOutcomeToken.address] : []),
      ],
    };
  }

  throw new Error(`Unsupported complete-set route: ${completeSetLeg.route as string}`);
}

/** Calls that have to land in the same batch, with the gas they are planned to use. */
interface CallUnit {
  calls: Execution[];
  gas: bigint;
}

/** Collateral each spender may pull for the given legs, added up per spender. */
function sumMaxInBySpender(legs: ExecutableLeg[]): Map<Address, bigint> {
  const totals = new Map<Address, bigint>();
  for (const leg of legs) {
    totals.set(leg.spender, (totals.get(leg.spender) ?? 0n) + leg.maxIn);
  }
  return totals;
}

/** Greedy packing: units go into the current batch while it fits the budget, in order. */
function packUnits(units: CallUnit[], budget: bigint): CallUnit[][] {
  const batches: CallUnit[][] = [];
  let current: CallUnit[] = [];
  let currentGas = 0n;

  for (const unit of units) {
    if (current.length > 0 && currentGas + unit.gas > budget) {
      batches.push(current);
      current = [];
      currentGas = 0n;
    }
    current.push(unit);
    currentGas += unit.gas;
  }
  if (current.length > 0) {
    batches.push(current);
  }
  return batches;
}

async function buildSplitFirstBatches(
  validated: Extract<ValidatedCompleteSetTrade, { route: "mintSell" | "mintToCover" }>,
  account: Address,
  isTradingCredits: boolean,
): Promise<Execution[][]> {
  const { completeSetLeg, splitAmount, sellLegs } = validated;
  const router = getRouterAddress(completeSetLeg.market);
  const chainId = completeSetLeg.market.chainId as SupportedChain;
  const gas = getCompleteSetGasProfile(chainId);
  // The set minted has the target and Invalid on top of what gets sold; mint-to-cover keeps more,
  // but a slight overestimate only errs towards a smaller batch.
  const outcomeCount = BigInt(sellLegs.length + 2);

  const split: CallUnit = {
    calls: [
      ...getTradeApprovals7702({
        tokensAddresses: [completeSetLeg.collateralToken],
        account,
        spender: router,
        amounts: splitAmount,
        chainId,
      }),
      getSplitExecution({
        router,
        market: completeSetLeg.market,
        collateralToken: completeSetLeg.collateralToken,
        amount: splitAmount,
      }),
    ],
    gas: gas.approve + gas.splitBase + gas.splitPerOutcome * outcomeCount + 2n * gas.callOverhead,
  };

  const sells: CallUnit[] = await Promise.all(
    sellLegs.map(async (leg) => ({
      calls: [
        ...getTradeApprovals7702({
          tokensAddresses: [leg.token],
          account,
          spender: leg.spender,
          amounts: leg.amount,
          chainId,
        }),
        await buildAmmTradeExecution(leg.trade, account, isTradingCredits),
      ],
      gas: gas.approve + gas.swap + 2n * gas.callOverhead,
    })),
  );

  return packUnits([split, ...sells], COMPLETE_SET_BATCH_GAS_BUDGET).map((batch) =>
    batch.flatMap((unit) => unit.calls),
  );
}

async function buildBuyMergeBatches(
  validated: Extract<ValidatedCompleteSetTrade, { route: "buyMerge" }>,
  account: Address,
  isTradingCredits: boolean,
): Promise<Execution[][]> {
  const { completeSetLeg, mergeAmount, buyLegs, mergeOutcomeTokens } = validated;
  const router = getRouterAddress(completeSetLeg.market);
  const chainId = completeSetLeg.market.chainId as SupportedChain;
  const gas = getCompleteSetGasProfile(chainId);
  const outcomeCount = BigInt(mergeOutcomeTokens.length);

  // Each buy is planned with its own approval so that a batch never comes out short of gas;
  // the approvals actually emitted are one per spender per batch, see below.
  const buys: (CallUnit & { leg: ExecutableLeg })[] = await Promise.all(
    buyLegs.map(async (leg) => ({
      leg,
      calls: [await buildAmmTradeExecution(leg.trade, account, isTradingCredits)],
      gas: gas.approve + gas.swap + 2n * gas.callOverhead,
    })),
  );

  const merge: CallUnit = {
    calls: [
      ...getTradeApprovals7702({
        tokensAddresses: mergeOutcomeTokens,
        account,
        spender: router,
        amounts: mergeAmount,
        chainId,
      }),
      getMergeExecution({
        router,
        market: completeSetLeg.market,
        collateralToken: completeSetLeg.collateralToken,
        amount: mergeAmount,
      }),
    ],
    gas:
      gas.approve * outcomeCount +
      gas.mergeBase +
      gas.mergePerOutcome * outcomeCount +
      (outcomeCount + 1n) * gas.callOverhead,
  };

  const packed = packUnits([...buys, merge], COMPLETE_SET_BATCH_GAS_BUDGET);

  return packed.map((batch) => {
    const legsInBatch = batch.flatMap((unit) => ("leg" in unit ? [(unit as { leg: ExecutableLeg }).leg] : []));
    const approvals = [...sumMaxInBySpender(legsInBatch)].flatMap(([spender, maxIn]) =>
      getTradeApprovals7702({
        tokensAddresses: [completeSetLeg.collateralToken],
        account,
        spender,
        amounts: maxIn,
        chainId,
      }),
    );
    return [...approvals, ...batch.flatMap((unit) => unit.calls)];
  });
}

/**
 * How many batches the 7702 path will send, from the gas plan alone (no calldata is built, so
 * this is synchronous and cheap enough for the confirmation dialog). Mirrors the packing of
 * `buildCompleteSetTradeBatches7702`.
 */
export function countCompleteSetBatches(props: TradeTokensProps): number {
  const validated = validateCompleteSetTradeProps(props);
  const chainId = validated.completeSetLeg.market.chainId;
  const gas = getCompleteSetGasProfile(chainId);
  const unit = (units: bigint[]) => units.map((g) => ({ calls: [], gas: g }));

  if (validated.route === "buyMerge") {
    const outcomeCount = BigInt(validated.mergeOutcomeTokens.length);
    return packUnits(
      unit([
        ...validated.buyLegs.map(() => gas.approve + gas.swap + 2n * gas.callOverhead),
        gas.approve * outcomeCount +
          gas.mergeBase +
          gas.mergePerOutcome * outcomeCount +
          (outcomeCount + 1n) * gas.callOverhead,
      ]),
      COMPLETE_SET_BATCH_GAS_BUDGET,
    ).length;
  }

  const outcomeCount = BigInt(validated.sellLegs.length + 2);
  return packUnits(
    unit([
      gas.approve + gas.splitBase + gas.splitPerOutcome * outcomeCount + 2n * gas.callOverhead,
      ...validated.sellLegs.map(() => gas.approve + gas.swap + 2n * gas.callOverhead),
    ]),
    COMPLETE_SET_BATCH_GAS_BUDGET,
  ).length;
}

/**
 * Calls for the 7702 path, grouped into batches that each fit one transaction. Batches must be
 * sent in order: the split opens the first, the merge closes the last.
 */
export async function buildCompleteSetTradeBatches7702(props: TradeTokensProps): Promise<Execution[][]> {
  const { account, isTradingCredits } = props;
  const validated = validateCompleteSetTradeProps(props);

  if (validated.route === "buyMerge") {
    return buildBuyMergeBatches(validated, account, isTradingCredits);
  }
  return buildSplitFirstBatches(validated, account, isTradingCredits);
}

/** The 7702 calls as one flat list: only right when they fit a single batch. */
export async function buildCompleteSetTradeCalls7702(props: TradeTokensProps): Promise<Execution[]> {
  const batches = await buildCompleteSetTradeBatches7702(props);
  return batches.flat();
}

async function sendCalls(client: Client, account: Address, calls: Execution[]): Promise<`0x${string}` | undefined> {
  let hash: `0x${string}` | undefined;
  for (const call of calls) {
    hash = await sendTransaction(client, { ...call, account, chain: client.chain });
  }
  return hash;
}

async function sendNeededApprovals(
  client: Client,
  account: Address,
  chainId: SupportedChain,
  tokens: Address[],
  spender: Address,
  amounts: bigint[],
): Promise<void> {
  const needed = await fetchNeededApprovals(client, tokens, account, spender, amounts);
  for (const approval of needed) {
    await sendCalls(
      client,
      account,
      getApprovals7702({
        tokensAddresses: [approval.tokenAddress],
        account,
        spender,
        amounts: approval.amount,
        chainId,
      }),
    );
  }
}

/** Sequential path for wallets without 7702: one transaction per approval, swap, split or merge. */
export async function executeCompleteSetTrade(client: Client, props: TradeTokensProps): Promise<`0x${string}`> {
  const { account, isTradingCredits } = props;
  const validated = validateCompleteSetTradeProps(props);
  const { completeSetLeg } = validated;

  const router = getRouterAddress(completeSetLeg.market);
  const chainId = completeSetLeg.market.chainId as SupportedChain;

  if (validated.route !== "buyMerge") {
    const { splitAmount, sellLegs } = validated;
    await sendNeededApprovals(client, account, chainId, [completeSetLeg.collateralToken], router, [splitAmount]);

    await sendTransaction(client, {
      ...getSplitExecution({
        router,
        market: completeSetLeg.market,
        collateralToken: completeSetLeg.collateralToken,
        amount: splitAmount,
      }),
      account,
      chain: client.chain,
    });

    let hash: `0x${string}` | undefined;
    for (const leg of sellLegs) {
      await sendNeededApprovals(client, account, chainId, [leg.token], leg.spender, [leg.amount]);
      hash = await sendTransaction(client, {
        ...(await buildAmmTradeExecution(leg.trade, account, isTradingCredits)),
        account,
        chain: client.chain,
      });
    }
    if (!hash) {
      throw new Error("Complete-set trade has no swap leg");
    }
    return hash;
  }

  const { mergeAmount, buyLegs, mergeOutcomeTokens } = validated;
  for (const [spender, maxIn] of sumMaxInBySpender(buyLegs)) {
    await sendNeededApprovals(client, account, chainId, [completeSetLeg.collateralToken], spender, [maxIn]);
  }
  for (const leg of buyLegs) {
    await sendTransaction(client, {
      ...(await buildAmmTradeExecution(leg.trade, account, isTradingCredits)),
      account,
      chain: client.chain,
    });
  }

  await sendNeededApprovals(
    client,
    account,
    chainId,
    mergeOutcomeTokens,
    router,
    mergeOutcomeTokens.map(() => mergeAmount),
  );

  return sendTransaction(client, {
    ...getMergeExecution({
      router,
      market: completeSetLeg.market,
      collateralToken: completeSetLeg.collateralToken,
      amount: mergeAmount,
    }),
    account,
    chain: client.chain,
  });
}

/** Every approval the sequential path may need, as parallel token / spender / amount lists. */
export function getCompleteSetApprovalTokens(props: TradeTokensProps): {
  tokensAddresses: Address[];
  spenders: Address[];
  amounts: bigint[];
} {
  const empty = { tokensAddresses: [], spenders: [], amounts: [] };
  if (!props.completeSetLeg) {
    return empty;
  }

  let validated: ValidatedCompleteSetTrade;
  try {
    validated = validateCompleteSetTradeProps(props);
  } catch {
    return empty;
  }
  const { completeSetLeg } = validated;
  const router = getRouterAddress(completeSetLeg.market);
  const tokensAddresses: Address[] = [];
  const spenders: Address[] = [];
  const amounts: bigint[] = [];
  const add = (token: Address, spender: Address, amount: bigint) => {
    tokensAddresses.push(token);
    spenders.push(spender);
    amounts.push(amount);
  };

  if (validated.route !== "buyMerge") {
    add(completeSetLeg.collateralToken, router, validated.splitAmount);
    for (const leg of validated.sellLegs) {
      add(leg.token, leg.spender, leg.amount);
    }
    return { tokensAddresses, spenders, amounts };
  }

  for (const [spender, maxIn] of sumMaxInBySpender(validated.buyLegs)) {
    add(completeSetLeg.collateralToken, spender, maxIn);
  }
  for (const token of validated.mergeOutcomeTokens) {
    add(token, router, validated.mergeAmount);
  }
  return { tokensAddresses, spenders, amounts };
}
