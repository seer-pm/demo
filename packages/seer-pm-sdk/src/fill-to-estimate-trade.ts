/**
 * Fill-to-estimate multi-leg trade execution.
 */

import { SwaprV3Trade, UniswapTrade } from "@swapr/sdk";
import type { Address, Client } from "viem";
import { sendTransaction } from "viem/actions";
import { fetchNeededApprovals, getApprovals7702 } from "./approvals";
import type { SupportedChain } from "./chains";
import { buildSwaprTradeExecution, buildUniswapTradeExecution, getTradeApprovals7702 } from "./execute-trade";
import type { Execution } from "./execution";
import type { FillToEstimateLeg, FillToEstimatePlan } from "./fill-to-estimate-plan";
import type { Market } from "./market-types";
import { getRouterAddress } from "./router-addresses";
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
  isBuyExactOutputNative: boolean;
  isSellToNative: boolean;
  isSeerCredits: boolean;
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
  isBuyExactOutputNative: boolean,
  isSellToNative: boolean,
  isSeerCredits: boolean,
): Promise<Execution> {
  if (trade instanceof UniswapTrade) {
    return buildUniswapTradeExecution(trade, account, isSeerCredits);
  }
  return buildSwaprTradeExecution(trade, account, isBuyExactOutputNative, isSellToNative, isSeerCredits);
}

export async function buildFillToEstimateCalls7702(params: FillToEstimateTradeParams): Promise<Execution[]> {
  const { plan, market, account, collateralToken, legTrades, isBuyExactOutputNative, isSellToNative, isSeerCredits } =
    params;

  if (isSeerCredits) {
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

    calls.push(await getSwapExecution(trade, account, isBuyExactOutputNative, isSellToNative, isSeerCredits));
  }

  return calls;
}

async function sendApprovalCalls(client: Client, account: Address, calls: Execution[]): Promise<void> {
  for (const call of calls) {
    await sendTransaction(client, { ...call, account, chain: client.chain });
  }
}

export async function executeFillToEstimate(client: Client, params: FillToEstimateTradeParams): Promise<`0x${string}`> {
  const { plan, market, account, collateralToken, legTrades, isBuyExactOutputNative, isSellToNative, isSeerCredits } =
    params;

  const router = getRouterAddress(market);
  const chainId = market.chainId as SupportedChain;
  let lastHash: `0x${string}` = "0x";

  for (const leg of plan.legs) {
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
        );
      }

      lastHash = await sendTransaction(client, {
        ...getSplitExecution({
          router,
          market,
          collateralToken,
          amount: leg.amount,
        }),
        account,
        chain: client.chain,
      });
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
        );
      }
    }

    lastHash = await sendTransaction(client, {
      ...(await getSwapExecution(trade, account, isBuyExactOutputNative, isSellToNative, isSeerCredits)),
      account,
      chain: client.chain,
    });
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
      continue;
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
