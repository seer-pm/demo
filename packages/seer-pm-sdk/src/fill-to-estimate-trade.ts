/**
 * Fill-to-estimate multi-leg trade execution.
 * Uses primary ERC20 collateral only (e.g. sDAI) — splitPosition + AMM swaps.
 */

import { SwaprV3Trade, UniswapTrade } from "@swapr/sdk";
import type { Address, Client } from "viem";
import { sendTransaction, waitForTransactionReceipt } from "viem/actions";
import { fetchNeededApprovals, getApprovals7702 } from "./approvals";
import type { SupportedChain } from "./chains";
import { buildSwaprTradeExecution, buildUniswapTradeExecution, getTradeApprovals7702 } from "./execute-trade";
import type { Execution } from "./execution";
import type { FillToEstimateLeg, FillToEstimatePlan } from "./fill-to-estimate-plan";
import type { Market } from "./market-types";
import { getRouterAddress } from "./router-addresses";
import { isSeerCredits } from "./seer-credits";
import { getSplitExecution } from "./split-position";
import { getMaximumAmountIn } from "./trade-utils";

export interface FillToEstimateLegTrade {
  kind: "sell" | "buy";
  outcomeIndex: 0 | 1;
  trade: SwaprV3Trade | UniswapTrade;
}

export interface FillToEstimateTradeParams {
  plan: FillToEstimatePlan;
  market: Market;
  account: Address;
  collateralToken: Address;
  legTrades: FillToEstimateLegTrade[];
}

export type FillToEstimateLegExecutionStatus = "pending" | "awaiting_wallet" | "confirming" | "complete" | "failed";

export interface FillToEstimateExecutionOptions {
  onLegStatusChange?: (legIndex: number, status: FillToEstimateLegExecutionStatus) => void;
}

function findLegTrade(legTrades: FillToEstimateLegTrade[], leg: FillToEstimateLeg): FillToEstimateLegTrade | undefined {
  if (leg.kind === "split") {
    return undefined;
  }
  return legTrades.find((item) => item.kind === leg.kind && item.outcomeIndex === leg.outcomeIndex);
}

async function getSwapExecution(
  trade: SwaprV3Trade | UniswapTrade,
  account: Address,
  collateralToken: Address,
  chainId: number,
): Promise<Execution> {
  const isSeerCreditsCollateral = isSeerCredits(chainId, collateralToken);

  if (trade instanceof UniswapTrade) {
    return buildUniswapTradeExecution(trade, account, isSeerCreditsCollateral);
  }
  return buildSwaprTradeExecution(trade, account, false, false, isSeerCreditsCollateral);
}

export async function buildFillToEstimateCalls7702(params: FillToEstimateTradeParams): Promise<Execution[]> {
  const { plan, market, account, collateralToken, legTrades } = params;

  if (isSeerCredits(market.chainId, collateralToken)) {
    throw new Error("Fill-to-estimate is not supported with Seer Credits");
  }

  const router = getRouterAddress(market);
  const chainId = market.chainId as SupportedChain;
  const calls: Execution[] = [];

  for (const leg of plan.legs) {
    if (leg.kind === "split") {
      calls.push(
        ...getTradeApprovals7702({
          tokensAddresses: [collateralToken],
          account,
          spender: router,
          amounts: leg.amount,
          chainId,
        }),
      );
      calls.push(
        getSplitExecution({
          router,
          market,
          collateralToken,
          amount: leg.amount,
        }),
      );
      continue;
    }

    const legTrade = findLegTrade(legTrades, leg);
    if (!legTrade) {
      throw new Error(`Missing quoted trade for ${leg.kind} leg on outcome ${leg.outcomeIndex}`);
    }

    const { trade } = legTrade;
    const swapSpender = trade.approveAddress as Address;
    const outcomeToken = market.wrappedTokens[leg.outcomeIndex] as Address;

    if (leg.kind === "sell") {
      calls.push(
        ...getTradeApprovals7702({
          tokensAddresses: [outcomeToken],
          account,
          spender: swapSpender,
          amounts: leg.amount,
          chainId,
        }),
      );
    } else {
      calls.push(
        ...getTradeApprovals7702({
          tokensAddresses: [collateralToken],
          account,
          spender: swapSpender,
          amounts: getMaximumAmountIn(trade),
          chainId,
        }),
      );
    }

    calls.push(await getSwapExecution(trade, account, collateralToken, chainId));
  }

  return calls;
}

type LegStatusReporter = (status: FillToEstimateLegExecutionStatus) => void;

async function sendAndWait(
  client: Client,
  account: Address,
  call: Execution,
  reportStatus: LegStatusReporter,
): Promise<`0x${string}`> {
  reportStatus("awaiting_wallet");
  const hash = await sendTransaction(client, { ...call, account, chain: client.chain });
  reportStatus("confirming");
  await waitForTransactionReceipt(client, { hash });
  return hash;
}

async function sendApprovalCalls(
  client: Client,
  account: Address,
  calls: Execution[],
  reportStatus: LegStatusReporter,
): Promise<void> {
  for (const call of calls) {
    await sendAndWait(client, account, call, reportStatus);
  }
}

export async function executeFillToEstimate(
  client: Client,
  params: FillToEstimateTradeParams,
  options?: FillToEstimateExecutionOptions,
): Promise<`0x${string}`> {
  const { plan, market, account, collateralToken, legTrades } = params;
  const { onLegStatusChange } = options ?? {};

  if (isSeerCredits(market.chainId, collateralToken)) {
    throw new Error("Fill-to-estimate is not supported with Seer Credits");
  }

  const router = getRouterAddress(market);
  const chainId = market.chainId as SupportedChain;
  let lastHash: `0x${string}` = "0x";

  for (let legIndex = 0; legIndex < plan.legs.length; legIndex++) {
    const leg = plan.legs[legIndex];
    const reportStatus: LegStatusReporter = (status) => onLegStatusChange?.(legIndex, status);

    try {
      if (leg.kind === "split") {
        const neededSplit = await fetchNeededApprovals(client, [collateralToken], account, router, [leg.amount]);
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
            reportStatus,
          );
        }

        lastHash = await sendAndWait(
          client,
          account,
          getSplitExecution({
            router,
            market,
            collateralToken,
            amount: leg.amount,
          }),
          reportStatus,
        );
        onLegStatusChange?.(legIndex, "complete");
        continue;
      }

      const legTrade = findLegTrade(legTrades, leg);
      if (!legTrade) {
        throw new Error(`Missing quoted trade for ${leg.kind} leg on outcome ${leg.outcomeIndex}`);
      }

      const { trade } = legTrade;
      const swapSpender = trade.approveAddress as Address;
      const outcomeToken = market.wrappedTokens[leg.outcomeIndex] as Address;

      if (leg.kind === "sell") {
        const neededSell = await fetchNeededApprovals(client, [outcomeToken], account, swapSpender, [leg.amount]);
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
            reportStatus,
          );
        }
      } else {
        const neededBuy = await fetchNeededApprovals(client, [collateralToken], account, swapSpender, [
          getMaximumAmountIn(trade),
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
            reportStatus,
          );
        }
      }

      lastHash = await sendAndWait(
        client,
        account,
        await getSwapExecution(trade, account, collateralToken, chainId),
        reportStatus,
      );
      onLegStatusChange?.(legIndex, "complete");
    } catch (error) {
      onLegStatusChange?.(legIndex, "failed");
      throw error;
    }
  }

  if (lastHash === "0x") {
    throw new Error("No transactions executed for empty/no-op plan");
  }

  return lastHash;
}

export function getFillToEstimateApprovalTokens(params: FillToEstimateTradeParams): {
  tokensAddresses: Address[];
  spenders: Address[];
  amounts: bigint[];
} {
  const { plan, market, collateralToken, legTrades } = params;
  const router = getRouterAddress(market);
  const tokensAddresses: Address[] = [];
  const spenders: Address[] = [];
  const amounts: bigint[] = [];

  for (const leg of plan.legs) {
    if (leg.kind === "split") {
      tokensAddresses.push(collateralToken);
      spenders.push(router);
      amounts.push(leg.amount);
      continue;
    }

    const legTrade = findLegTrade(legTrades, leg);
    if (!legTrade) {
      throw new Error(`Missing quoted trade for ${leg.kind} leg on outcome ${leg.outcomeIndex}`);
    }

    const outcomeToken = market.wrappedTokens[leg.outcomeIndex] as Address;
    const swapSpender = legTrade.trade.approveAddress as Address;

    if (leg.kind === "sell") {
      tokensAddresses.push(outcomeToken);
      spenders.push(swapSpender);
      amounts.push(leg.amount);
    } else {
      tokensAddresses.push(collateralToken);
      spenders.push(swapSpender);
      amounts.push(getMaximumAmountIn(legTrade.trade));
    }
  }

  return { tokensAddresses, spenders, amounts };
}
