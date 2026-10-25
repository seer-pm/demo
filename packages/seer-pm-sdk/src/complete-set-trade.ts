/**
 * Complete-set composite trade execution: mint+sell and buy+merge through the CompleteSetTrader.
 *
 * The trader runs the whole route in one transaction: it splits (or merges) through the Seer
 * Router and executes one AMM swap per leg with itself as recipient, then hands everything back.
 * The wallet only approves the trader for what it pulls up front — the collateral and any outcome
 * tokens the user contributes — and sends a single call. A leg that cannot be filled in full
 * reverts the whole trade, so the user never ends up with a partial position.
 *
 * Every transaction is still capped at 2^24 gas (EIP-7825); `estimateCompleteSetGas` is what the
 * quote uses to refuse a route with more legs than fit.
 */

import type { Address, Client, Hex } from "viem";
import { encodeFunctionData } from "viem";
import { sendTransaction } from "viem/actions";
import { gnosis } from "viem/chains";
import type { AmmTrade } from "./amm-trade";
import { fetchNeededApprovals, getApprovals7702 } from "./approvals";
import type { SupportedChain } from "./chains";
import type { CompleteSetLeg } from "./complete-set-quote";
import { completeSetTraderAbi, getCompleteSetTraderAddress } from "./complete-set-trader";
import { getTradeApprovals7702 } from "./execute-trade";
import type { Execution } from "./execution";
import type { TradeTokensProps } from "./trade-utils";
import { getMaximumAmountIn } from "./trade-utils";

/** Routes that split collateral first and then swap legs of the freshly minted set. */
const SPLIT_FIRST_ROUTES = new Set<CompleteSetLeg["route"]>(["mintSell", "mintToCover"]);

/**
 * Gas one complete-set transaction may plan for. EIP-7825 caps a transaction at 16,777,216 gas on
 * every supported chain; the rest is margin for the wallet's estimation buffer.
 */
export const COMPLETE_SET_TX_GAS_BUDGET = 12_000_000n;

/** Gas each piece of a complete-set transaction is planned with. Measured on Seer pools, rounded up. */
export interface CompleteSetGasProfile {
  swap: bigint;
  approve: bigint;
  splitBase: bigint;
  splitPerOutcome: bigint;
  mergeBase: bigint;
  mergePerOutcome: bigint;
  /** Pulling the inputs and sweeping the outputs, per outcome token of the market. */
  transferPerOutcome: bigint;
}

const UNISWAP_GAS_PROFILE: CompleteSetGasProfile = {
  swap: 200_000n,
  approve: 50_000n,
  splitBase: 150_000n,
  splitPerOutcome: 110_000n,
  mergeBase: 120_000n,
  mergePerOutcome: 110_000n,
  transferPerOutcome: 40_000n,
};

/** Swapr (Algebra) swaps cost about twice a Uniswap V3 swap. */
const SWAPR_GAS_PROFILE: CompleteSetGasProfile = { ...UNISWAP_GAS_PROFILE, swap: 400_000n };

export function getCompleteSetGasProfile(chainId: number): CompleteSetGasProfile {
  return chainId === gnosis.id ? SWAPR_GAS_PROFILE : UNISWAP_GAS_PROFILE;
}

/**
 * Gas a complete-set transaction is planned to use: the split or merge over every outcome of the
 * market, an approval and a swap per leg, and the transfers in and out.
 */
export function estimateCompleteSetGas(params: {
  chainId: number;
  route: CompleteSetLeg["route"];
  legCount: number;
  outcomeCount: number;
}): bigint {
  const { chainId, route, legCount, outcomeCount } = params;
  const gas = getCompleteSetGasProfile(chainId);
  const legs = BigInt(legCount);
  const outcomes = BigInt(outcomeCount);
  const setGas = SPLIT_FIRST_ROUTES.has(route)
    ? gas.splitBase + gas.splitPerOutcome * outcomes
    : gas.mergeBase + (gas.mergePerOutcome + gas.approve) * outcomes;

  return gas.approve + setGas + legs * (gas.approve + gas.swap) + outcomes * gas.transferPerOutcome;
}

/** One AMM leg, flattened to what execution needs. */
interface ExecutableLeg {
  token: Address;
  amount: bigint;
  trade: AmmTrade;
}

/** An outcome token the user contributes to the route, pulled by the trader. */
interface HeldToken {
  token: Address;
  amount: bigint;
}

type ValidatedCompleteSetTrade = {
  completeSetLeg: NonNullable<TradeTokensProps["completeSetLeg"]>;
} & (
  | {
      route: "mintSell" | "mintToCover";
      splitAmount: bigint;
      /** Outcome tokens the user adds to the sale on top of the minted ones (mint-to-cover). */
      heldTokens: HeldToken[];
      /** Outcomes sold after the split: every other outcome for mintSell, the target for mintToCover. */
      sellLegs: ExecutableLeg[];
    }
  | {
      route: "buyMerge";
      mergeAmount: bigint;
      /** Outcome tokens the user contributes to the merged set: the target and anything already held. */
      heldTokens: HeldToken[];
      /** Outcomes bought before the merge, already net of what the wallet holds. */
      buyLegs: ExecutableLeg[];
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

function validateCompleteSetTradeProps(props: TradeTokensProps): ValidatedCompleteSetTrade {
  const { completeSetLeg, trade } = props;
  if (!completeSetLeg) {
    throw new Error("Complete-set trade requires completeSetLeg");
  }
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
        heldTokens: [],
        sellLegs: swapLegs.map((leg) => ({ token: leg.outcomeToken.address, amount: leg.amount, trade: leg.trade })),
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
    // mint-to-cover sells minted + already held: the held part has to reach the trader too.
    const existingBalance = completeSetLeg.existingBalance ?? 0n;
    return {
      completeSetLeg,
      route,
      splitAmount,
      heldTokens: existingBalance > 0n ? [{ token: swapInputToken.address, amount: existingBalance }] : [],
      sellLegs: [{ token: swapInputToken.address, amount: swapInputAmount, trade }],
    };
  }

  if (completeSetLeg.route === "buyMerge") {
    const mergeAmount = completeSetLeg.mergeAmount;
    if (!mergeAmount) {
      throw new Error("buyMerge route requires mergeAmount");
    }
    const target: HeldToken = { token: completeSetLeg.targetOutcomeToken.address, amount: mergeAmount };

    if (swapLegs && swapLegs.length > 0) {
      for (const leg of swapLegs) {
        getValidatedMaximumAmountIn(leg.trade);
      }
      return {
        completeSetLeg,
        route: "buyMerge",
        mergeAmount,
        heldTokens: [
          target,
          ...(completeSetLeg.heldOutcomeTokens ?? []).map((held) => ({
            token: held.token.address,
            amount: held.amount,
          })),
        ],
        buyLegs: swapLegs.map((leg) => ({ token: leg.outcomeToken.address, amount: leg.amount, trade: leg.trade })),
      };
    }

    // Single-leg form: buys the one outcome opposite the target and burns the whole set, so the
    // user has to contribute Invalid as well as the target.
    if (!completeSetLeg.oppositeOutcomeToken) {
      throw new Error("buyMerge route requires oppositeOutcomeToken");
    }
    getValidatedMaximumAmountIn(trade);
    return {
      completeSetLeg,
      route: "buyMerge",
      mergeAmount,
      heldTokens: [
        target,
        ...(completeSetLeg.invalidOutcomeToken
          ? [{ token: completeSetLeg.invalidOutcomeToken.address, amount: mergeAmount }]
          : []),
      ],
      buyLegs: [{ token: completeSetLeg.oppositeOutcomeToken.address, amount: mergeAmount, trade }],
    };
  }

  throw new Error(`Unsupported complete-set route: ${completeSetLeg.route as string}`);
}

/** What the trader pulls from the wallet, as parallel token / amount lists. */
function getTraderPulls(validated: ValidatedCompleteSetTrade): { tokens: Address[]; amounts: bigint[] } {
  const collateral = validated.completeSetLeg.collateralToken;
  const collateralAmount =
    validated.route === "buyMerge"
      ? validated.buyLegs.reduce((acc, leg) => acc + getMaximumAmountIn(leg.trade), 0n)
      : validated.splitAmount;

  return {
    tokens: [collateral, ...validated.heldTokens.map((held) => held.token)],
    amounts: [collateralAmount, ...validated.heldTokens.map((held) => held.amount)],
  };
}

/**
 * The trader call. Every leg is re-quoted with the trader as recipient (`swapTransaction` rebuilds
 * the swap whenever the recipient changes), so the amounts and the DEX target of each leg are read
 * after that — the route can move to another venue between quote and execution.
 */
export async function buildCompleteSetTraderExecution(props: TradeTokensProps): Promise<Execution> {
  const validated = validateCompleteSetTradeProps(props);
  const { completeSetLeg } = validated;
  const chainId = completeSetLeg.market.chainId;
  const trader = getCompleteSetTraderAddress(chainId);
  const legs = validated.route === "buyMerge" ? validated.buyLegs : validated.sellLegs;

  const swaps = await Promise.all(
    legs.map(async (leg) => {
      const tx = await leg.trade.swapTransaction({ recipient: trader });
      return { target: tx.to as Address, data: (tx.data ?? "0x") as Hex };
    }),
  );
  const heldTokens = validated.heldTokens.map((held) => held.token);
  const heldAmounts = validated.heldTokens.map((held) => held.amount);

  const data =
    validated.route === "buyMerge"
      ? encodeFunctionData({
          abi: completeSetTraderAbi,
          functionName: "buyAndMerge",
          args: [
            completeSetLeg.collateralToken,
            completeSetLeg.market.id as Address,
            validated.mergeAmount,
            // Read after the rebuild: the slippage limit of the fresh quote is what the buys may spend.
            validated.buyLegs.reduce((acc, leg) => acc + getMaximumAmountIn(leg.trade), 0n),
            heldTokens,
            heldAmounts,
            swaps,
          ],
        })
      : encodeFunctionData({
          abi: completeSetTraderAbi,
          functionName: "mintAndSell",
          args: [
            completeSetLeg.collateralToken,
            completeSetLeg.market.id as Address,
            validated.splitAmount,
            heldTokens,
            heldAmounts,
            validated.sellLegs.map((leg) => leg.token),
            swaps,
          ],
        });

  return { to: trader, data, value: 0n, chainId };
}

/** The 7702 calls: one approval per token the trader pulls, then the trader call. */
export async function buildCompleteSetTradeCalls7702(props: TradeTokensProps): Promise<Execution[]> {
  const { account } = props;
  const execution = await buildCompleteSetTraderExecution(props);
  const validated = validateCompleteSetTradeProps(props);
  const chainId = validated.completeSetLeg.market.chainId as SupportedChain;
  const pulls = getTraderPulls(validated);

  return [
    ...getTradeApprovals7702({
      tokensAddresses: pulls.tokens,
      account,
      spender: execution.to,
      amounts: pulls.amounts,
      chainId,
    }),
    execution,
  ];
}

/** Path for wallets without 7702: the approvals the trader still lacks, then the trader call. */
export async function executeCompleteSetTrade(client: Client, props: TradeTokensProps): Promise<`0x${string}`> {
  const { account } = props;
  const execution = await buildCompleteSetTraderExecution(props);
  const validated = validateCompleteSetTradeProps(props);
  const chainId = validated.completeSetLeg.market.chainId as SupportedChain;
  const pulls = getTraderPulls(validated);

  const needed = await fetchNeededApprovals(client, pulls.tokens, account, execution.to, pulls.amounts);
  for (const approval of needed) {
    const [call] = getApprovals7702({
      tokensAddresses: [approval.tokenAddress],
      account,
      spender: execution.to,
      amounts: approval.amount,
      chainId,
    });
    await sendTransaction(client, { ...call, account, chain: client.chain });
  }

  return sendTransaction(client, { ...execution, account, chain: client.chain });
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
  let trader: Address;
  try {
    validated = validateCompleteSetTradeProps(props);
    trader = getCompleteSetTraderAddress(validated.completeSetLeg.market.chainId);
  } catch {
    return empty;
  }
  const pulls = getTraderPulls(validated);

  return {
    tokensAddresses: pulls.tokens,
    spenders: pulls.tokens.map(() => trader),
    amounts: pulls.amounts,
  };
}
