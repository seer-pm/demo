/**
 * Complete-set composite trade execution: mint+sell, mint-to-cover and buy+merge as 7702 batches
 * or sequential txs.
 *
 * A split's gas grows with the outcome count of the set it mints, and mint-to-cover on a child
 * market paid in the base collateral runs two of them, so the 7702 calls are planned with
 * `batch-gas` and packed into batches under `BATCH_GAS_BUDGET`, sent in order. Each split and its
 * approval stay together; a batch that fails after the first leaves the user holding full sets,
 * never short of anything.
 */

import type { Address, Client } from "viem";
import { sendTransaction } from "viem/actions";
import type { AmmTrade } from "./amm-trade";
import { fetchNeededApprovals, getApprovals7702 } from "./approvals";
import { APPROVE_GAS, type CallUnit, SWAP_GAS, estimateSplitGas, packByGas, packUnits } from "./batch-gas";
import type { SupportedChain } from "./chains";
import type { CompleteSetLeg, CompleteSetSplitStep } from "./complete-set-quote";
import { getSplitSteps } from "./complete-set-quote";
import { buildAmmTradeExecution, getTradeApprovals7702 } from "./execute-trade";
import type { Execution } from "./execution";
import { getMergeExecution } from "./merge-positions";
import { getRouterAddress } from "./router-addresses";
import { getSplitExecution } from "./split-position";
import type { TradeTokensProps } from "./trade-utils";
import { getMaximumAmountIn } from "./trade-utils";

/** Routes that split collateral first and then swap one leg of the freshly minted set. */
const SPLIT_FIRST_ROUTES = new Set<CompleteSetLeg["route"]>(["mintSell", "mintToCover"]);

type ValidatedCompleteSetTrade = {
  completeSetLeg: NonNullable<TradeTokensProps["completeSetLeg"]>;
  trade: AmmTrade;
  swapSpender: Address;
} & (
  | {
      route: "mintSell" | "mintToCover";
      splitAmount: bigint;
      /** Splits to run before the swap, root market first. */
      splitSteps: CompleteSetSplitStep[];
      /** Token sold after the split: the opposite outcome for mintSell, the target for mintToCover. */
      swapInputToken: Address;
      /** Sell size: equal to splitAmount for mintSell, minted + already held for mintToCover. */
      swapInputAmount: bigint;
    }
  | {
      route: "buyMerge";
      mergeAmount: bigint;
      maxBuyIn: bigint;
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

function validateCompleteSetTradeProps(props: TradeTokensProps): ValidatedCompleteSetTrade {
  const { completeSetLeg, trade } = props;
  if (!completeSetLeg) {
    throw new Error("Complete-set trade requires completeSetLeg");
  }
  if (!trade.approveAddress) {
    throw new Error("Complete-set trade requires trade.approveAddress");
  }
  const swapSpender = trade.approveAddress as Address;

  if (SPLIT_FIRST_ROUTES.has(completeSetLeg.route)) {
    const route = completeSetLeg.route as "mintSell" | "mintToCover";
    const splitAmount = completeSetLeg.splitAmount;
    if (!splitAmount) {
      throw new Error(`${route} route requires splitAmount`);
    }
    const splitSteps = getSplitSteps(completeSetLeg);
    if (splitSteps.some((step) => step.amount <= 0n)) {
      throw new Error(`${route} route requires a positive amount on every split step`);
    }
    // Defaults keep mint+sell on its original behaviour: sell exactly what was minted.
    const swapInputAmount = completeSetLeg.swapInputAmount ?? splitAmount;
    if (swapInputAmount <= 0n) {
      throw new Error(`${route} route requires a positive swapInputAmount`);
    }
    // mint+sell sells the outcome opposite the target; mint-to-cover sells the target itself and
    // says so explicitly through swapInputToken. Exactly one of the two is always present.
    const swapInputToken = completeSetLeg.swapInputToken ?? completeSetLeg.oppositeOutcomeToken;
    if (!swapInputToken) {
      throw new Error(`${route} route requires swapInputToken or oppositeOutcomeToken`);
    }
    return {
      completeSetLeg,
      trade,
      swapSpender,
      route,
      splitAmount,
      splitSteps,
      swapInputToken: swapInputToken.address,
      swapInputAmount,
    };
  }

  if (completeSetLeg.route === "buyMerge") {
    const mergeAmount = completeSetLeg.mergeAmount;
    if (!mergeAmount) {
      throw new Error("buyMerge route requires mergeAmount");
    }
    // buy+merge is binary by construction: it buys the one outcome opposite the target and burns the
    // whole set. Without the opposite token the merge would be under-approved and revert.
    if (!completeSetLeg.oppositeOutcomeToken) {
      throw new Error("buyMerge route requires oppositeOutcomeToken");
    }
    return {
      completeSetLeg,
      trade,
      swapSpender,
      route: "buyMerge",
      mergeAmount,
      maxBuyIn: getValidatedMaximumAmountIn(trade),
      mergeOutcomeTokens: [
        completeSetLeg.targetOutcomeToken.address,
        completeSetLeg.oppositeOutcomeToken.address,
        ...(completeSetLeg.invalidOutcomeToken ? [completeSetLeg.invalidOutcomeToken.address] : []),
      ],
    };
  }

  throw new Error(`Unsupported complete-set route: ${completeSetLeg.route as string}`);
}

async function getSecondarySwapExecution(
  trade: AmmTrade,
  account: Address,
  isTradingCredits: boolean,
): Promise<Execution> {
  return buildAmmTradeExecution(trade, account, isTradingCredits);
}

/** Gas each split step is planned with: its approval plus the split of its whole set. */
function getSplitStepGas(step: CompleteSetSplitStep): bigint {
  return APPROVE_GAS + estimateSplitGas(step.outcomeCount);
}

/**
 * How many transactions the 7702 path sends for this leg, from the gas plan alone. The same
 * packing as `buildCompleteSetTradeBatches7702`, without building any calldata.
 */
export function countCompleteSetBatches(completeSetLeg: CompleteSetLeg): number {
  if (!SPLIT_FIRST_ROUTES.has(completeSetLeg.route)) {
    return 1;
  }
  const units = getSplitSteps(completeSetLeg).map((step) => ({ gas: getSplitStepGas(step) }));
  units.push({ gas: APPROVE_GAS + SWAP_GAS });
  return packByGas(units).length;
}

/**
 * The 7702 calls grouped into batches that each fit one transaction. Batches must be sent in
 * order: a later split spends what the one before it mints, and the sell needs the minted tokens.
 */
export async function buildCompleteSetTradeBatches7702(props: TradeTokensProps): Promise<Execution[][]> {
  const { account, isTradingCredits } = props;
  const validated = validateCompleteSetTradeProps(props);
  const { completeSetLeg, trade, swapSpender } = validated;

  const router = getRouterAddress(completeSetLeg.market);
  const chainId = completeSetLeg.market.chainId as SupportedChain;

  if (validated.route !== "buyMerge") {
    const { splitSteps, swapInputToken, swapInputAmount } = validated;

    // Approvals carry no balance check, so each one can precede its split inside the same unit.
    const units: CallUnit[] = splitSteps.map((step) => ({
      gas: getSplitStepGas(step),
      calls: [
        ...getTradeApprovals7702({
          tokensAddresses: [step.spendToken],
          account,
          spender: router,
          amounts: step.amount,
          chainId,
        }),
        getSplitExecution({
          router,
          market: step.market,
          collateralToken: step.routerCollateral,
          amount: step.amount,
        }),
      ],
    }));
    units.push({
      gas: APPROVE_GAS + SWAP_GAS,
      calls: [
        ...getTradeApprovals7702({
          tokensAddresses: [swapInputToken],
          account,
          spender: swapSpender,
          amounts: swapInputAmount,
          chainId,
        }),
        await getSecondarySwapExecution(trade, account, isTradingCredits),
      ],
    });
    return packUnits(units);
  }

  const { mergeAmount, maxBuyIn, mergeOutcomeTokens } = validated;
  const calls: Execution[] = [];

  calls.push(
    ...getTradeApprovals7702({
      tokensAddresses: [completeSetLeg.collateralToken],
      account,
      spender: swapSpender,
      amounts: maxBuyIn,
      chainId,
    }),
  );
  calls.push(await getSecondarySwapExecution(trade, account, isTradingCredits));
  calls.push(
    ...getTradeApprovals7702({
      tokensAddresses: mergeOutcomeTokens,
      account,
      spender: router,
      amounts: mergeAmount,
      chainId,
    }),
  );
  calls.push(
    getMergeExecution({
      router,
      market: completeSetLeg.market,
      collateralToken: completeSetLeg.collateralToken,
      amount: mergeAmount,
    }),
  );

  return [calls];
}

/** Every 7702 call in order, for callers that send the whole trade as one batch. */
export async function buildCompleteSetTradeCalls7702(props: TradeTokensProps): Promise<Execution[]> {
  const batches = await buildCompleteSetTradeBatches7702(props);
  return batches.flat();
}

async function sendApprovalCalls(client: Client, account: Address, calls: Execution[]): Promise<void> {
  for (const call of calls) {
    await sendTransaction(client, { ...call, account, chain: client.chain });
  }
}

export async function executeCompleteSetTrade(client: Client, props: TradeTokensProps): Promise<`0x${string}`> {
  const { account, isTradingCredits } = props;
  const validated = validateCompleteSetTradeProps(props);
  const { completeSetLeg, trade, swapSpender } = validated;

  const router = getRouterAddress(completeSetLeg.market);
  const chainId = completeSetLeg.market.chainId as SupportedChain;

  if (validated.route !== "buyMerge") {
    const { splitSteps, swapInputToken, swapInputAmount } = validated;

    for (const step of splitSteps) {
      const neededSplit = await fetchNeededApprovals(client, [step.spendToken], account, router, [step.amount]);
      for (const approval of neededSplit) {
        await sendApprovalCalls(
          client,
          account,
          getApprovals7702({
            tokensAddresses: [approval.tokenAddress],
            account,
            spender: router,
            amounts: approval.amount,
            chainId,
          }),
        );
      }

      await sendTransaction(client, {
        ...getSplitExecution({
          router,
          market: step.market,
          collateralToken: step.routerCollateral,
          amount: step.amount,
        }),
        account,
        chain: client.chain,
      });
    }

    const neededSell = await fetchNeededApprovals(client, [swapInputToken], account, swapSpender, [swapInputAmount]);
    for (const approval of neededSell) {
      await sendApprovalCalls(
        client,
        account,
        getApprovals7702({
          tokensAddresses: [approval.tokenAddress],
          account,
          spender: swapSpender,
          amounts: approval.amount,
          chainId,
        }),
      );
    }

    return sendTransaction(client, {
      ...(await getSecondarySwapExecution(trade, account, isTradingCredits)),
      account,
      chain: client.chain,
    });
  }

  const { mergeAmount, maxBuyIn, mergeOutcomeTokens } = validated;
  const neededBuy = await fetchNeededApprovals(client, [completeSetLeg.collateralToken], account, swapSpender, [
    maxBuyIn,
  ]);
  for (const approval of neededBuy) {
    await sendApprovalCalls(
      client,
      account,
      getApprovals7702({
        tokensAddresses: [approval.tokenAddress],
        account,
        spender: swapSpender,
        amounts: approval.amount,
        chainId,
      }),
    );
  }

  await sendTransaction(client, {
    ...(await getSecondarySwapExecution(trade, account, isTradingCredits)),
    account,
    chain: client.chain,
  });

  const neededMerge = await fetchNeededApprovals(
    client,
    mergeOutcomeTokens,
    account,
    router,
    mergeOutcomeTokens.map(() => mergeAmount),
  );
  for (const approval of neededMerge) {
    await sendApprovalCalls(
      client,
      account,
      getApprovals7702({
        tokensAddresses: [approval.tokenAddress],
        account,
        spender: router,
        amounts: approval.amount,
        chainId,
      }),
    );
  }

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

export function getCompleteSetApprovalTokens(props: TradeTokensProps): {
  tokensAddresses: Address[];
  spenders: Address[];
  amounts: bigint[];
} {
  const { completeSetLeg, trade } = props;
  if (!completeSetLeg) {
    return { tokensAddresses: [], spenders: [], amounts: [] };
  }

  const router = getRouterAddress(completeSetLeg.market);
  const tokensAddresses: Address[] = [];
  const spenders: Address[] = [];
  const amounts: bigint[] = [];

  if (SPLIT_FIRST_ROUTES.has(completeSetLeg.route) && completeSetLeg.splitAmount) {
    for (const step of getSplitSteps(completeSetLeg)) {
      tokensAddresses.push(step.spendToken);
      spenders.push(router);
      amounts.push(step.amount);
    }

    const swapInputToken = completeSetLeg.swapInputToken ?? completeSetLeg.oppositeOutcomeToken;
    if (!swapInputToken) {
      return { tokensAddresses: [], spenders: [], amounts: [] };
    }
    tokensAddresses.push(swapInputToken.address);
    spenders.push(trade.approveAddress as Address);
    amounts.push(completeSetLeg.swapInputAmount ?? completeSetLeg.splitAmount);
    return { tokensAddresses, spenders, amounts };
  }

  if (completeSetLeg.route === "buyMerge" && completeSetLeg.mergeAmount) {
    tokensAddresses.push(completeSetLeg.collateralToken);
    spenders.push(trade.approveAddress as Address);
    amounts.push(getMaximumAmountIn(trade));

    for (const outcomeToken of [
      completeSetLeg.targetOutcomeToken,
      completeSetLeg.oppositeOutcomeToken,
      completeSetLeg.invalidOutcomeToken,
    ]) {
      if (!outcomeToken) {
        continue;
      }
      tokensAddresses.push(outcomeToken.address);
      spenders.push(router);
      amounts.push(completeSetLeg.mergeAmount);
    }
  }

  return { tokensAddresses, spenders, amounts };
}
