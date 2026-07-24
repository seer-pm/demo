/**
 * Composite trade execution: PSM3 + Lens AMM in one batch or sequential txs.
 */

import type { Address, Client } from "viem";
import { sendTransaction } from "viem/actions";
import type { AmmTrade } from "./amm-trade";
import { fetchNeededApprovals, getApprovals7702 } from "./approvals";
import type { SupportedChain } from "./chains";
import { getActivePrimaryCollateral } from "./collateral";
import { getAmmTradeExecution, getTradeApprovals7702 } from "./execute-trade";
import type { Execution } from "./execution";
import { buildPsm3SwapExecution } from "./psm3";
import type { Psm3Leg } from "./quote";
import { isTwoStringsEqual } from "./quote-utils";
import type { TradeTokensProps } from "./trade-utils";
import { getMaximumAmountIn, isAmmTrade } from "./trade-utils";

async function getAmmExecution(trade: AmmTrade, account: Address): Promise<Execution> {
  return getAmmTradeExecution(trade, account);
}

function isPsm3BeforeAmm(psm3Leg: Psm3Leg, chainId: number): boolean {
  const primary = getActivePrimaryCollateral(chainId);
  return isTwoStringsEqual(psm3Leg.assetOut, primary.address);
}

function getPsm3GuaranteedSusdsOutput(psm3Leg: Psm3Leg): bigint {
  return psm3Leg.tradeType === "exactIn" ? psm3Leg.limitAmount : psm3Leg.amountOut;
}

function assertAmmInputWithinPsm3Output(trade: AmmTrade, psm3Leg: Psm3Leg): bigint {
  const guaranteedSusds = getPsm3GuaranteedSusdsOutput(psm3Leg);
  const maxAmountIn = getMaximumAmountIn(trade);
  if (maxAmountIn > guaranteedSusds) {
    throw new Error(
      `AMM maximum input (${maxAmountIn}) exceeds PSM3 guaranteed sUSDS output (${guaranteedSusds}); re-quote using the PSM3 slippage-adjusted amount`,
    );
  }
  return guaranteedSusds;
}

export async function buildPsm3CompositeTradeCalls7702(props: TradeTokensProps): Promise<Execution[]> {
  const { trade, account, psm3Leg } = props;
  if (!psm3Leg || !isAmmTrade(trade)) {
    throw new Error("Composite trade requires AmmTrade and psm3Leg");
  }

  const chainId = trade.chainId;
  const psm3Address = buildPsm3SwapExecution(psm3Leg, chainId, account).to;
  const ammSpender = trade.approveAddress as Address;
  const calls: Execution[] = [];

  if (isPsm3BeforeAmm(psm3Leg, chainId)) {
    const psm3Approvals = getTradeApprovals7702({
      tokensAddresses: [psm3Leg.assetIn],
      account,
      spender: psm3Address,
      amounts: psm3Leg.tradeType === "exactIn" ? psm3Leg.amountIn : psm3Leg.limitAmount,
      chainId,
    });
    calls.push(...psm3Approvals);
    calls.push(buildPsm3SwapExecution(psm3Leg, chainId, account));

    const sUsdsAmount = assertAmmInputWithinPsm3Output(trade, psm3Leg);
    calls.push(
      ...getTradeApprovals7702({
        tokensAddresses: [psm3Leg.assetOut],
        account,
        spender: ammSpender,
        amounts: sUsdsAmount,
        chainId: chainId as SupportedChain,
      }),
    );
  } else {
    calls.push(
      ...getTradeApprovals7702({
        tokensAddresses: [trade.tokenIn.address as Address],
        account,
        spender: ammSpender,
        amounts: getMaximumAmountIn(trade),
        chainId: chainId as SupportedChain,
      }),
    );
  }

  const ammExecution = await getAmmExecution(trade, account);
  calls.push(ammExecution);

  if (!isPsm3BeforeAmm(psm3Leg, chainId)) {
    const sUsdsAmount = psm3Leg.tradeType === "exactIn" ? psm3Leg.amountIn : psm3Leg.limitAmount;
    calls.push(
      ...getTradeApprovals7702({
        tokensAddresses: [psm3Leg.assetIn],
        account,
        spender: psm3Address,
        amounts: sUsdsAmount,
        chainId: chainId as SupportedChain,
      }),
    );
    calls.push(buildPsm3SwapExecution(psm3Leg, chainId, account));
  }

  return calls;
}

export async function executePsm3CompositeTrade(client: Client, props: TradeTokensProps): Promise<`0x${string}`> {
  const { trade, account, psm3Leg } = props;
  if (!psm3Leg || !isAmmTrade(trade)) {
    throw new Error("Composite trade requires AmmTrade and psm3Leg");
  }

  const chainId = trade.chainId;
  const psm3Execution = buildPsm3SwapExecution(psm3Leg, chainId, account);
  const psm3Address = psm3Execution.to;
  const ammExecution = await getAmmExecution(trade, account);
  const ammSpender = trade.approveAddress as Address;

  if (isPsm3BeforeAmm(psm3Leg, chainId)) {
    const psm3AmountIn = psm3Leg.tradeType === "exactIn" ? psm3Leg.amountIn : psm3Leg.limitAmount;
    const neededPsm3 = await fetchNeededApprovals(client, [psm3Leg.assetIn], account, psm3Address, [psm3AmountIn]);
    for (const approval of neededPsm3) {
      const [approvalCall] = getApprovals7702({
        tokensAddresses: [approval.tokenAddress],
        account,
        spender: psm3Address,
        amounts: approval.amount,
        chainId: chainId as SupportedChain,
      });
      if (approvalCall) {
        await sendTransaction(client, { ...approvalCall, account, chain: client.chain });
      }
    }

    await sendTransaction(client, { ...psm3Execution, account, chain: client.chain });

    const sUsdsAmount = assertAmmInputWithinPsm3Output(trade, psm3Leg);
    const neededSUsds = await fetchNeededApprovals(client, [psm3Leg.assetOut], account, ammSpender, [sUsdsAmount]);
    for (const approval of neededSUsds) {
      const [approvalCall] = getApprovals7702({
        tokensAddresses: [approval.tokenAddress],
        account,
        spender: ammSpender,
        amounts: approval.amount,
        chainId: chainId as SupportedChain,
      });
      if (approvalCall) {
        await sendTransaction(client, { ...approvalCall, account, chain: client.chain });
      }
    }

    return sendTransaction(client, { ...ammExecution, account, chain: client.chain });
  }

  const neededAmm = await fetchNeededApprovals(client, [trade.tokenIn.address as Address], account, ammSpender, [
    getMaximumAmountIn(trade),
  ]);
  for (const approval of neededAmm) {
    const [approvalCall] = getApprovals7702({
      tokensAddresses: [approval.tokenAddress],
      account,
      spender: ammSpender,
      amounts: approval.amount,
      chainId: chainId as SupportedChain,
    });
    if (approvalCall) {
      await sendTransaction(client, { ...approvalCall, account, chain: client.chain });
    }
  }

  await sendTransaction(client, { ...ammExecution, account, chain: client.chain });

  const sUsdsAmount = psm3Leg.tradeType === "exactIn" ? psm3Leg.amountIn : psm3Leg.limitAmount;
  const neededPsm3 = await fetchNeededApprovals(client, [psm3Leg.assetIn], account, psm3Address, [sUsdsAmount]);
  for (const approval of neededPsm3) {
    const [approvalCall] = getApprovals7702({
      tokensAddresses: [approval.tokenAddress],
      account,
      spender: psm3Address,
      amounts: approval.amount,
      chainId: chainId as SupportedChain,
    });
    if (approvalCall) {
      await sendTransaction(client, { ...approvalCall, account, chain: client.chain });
    }
  }

  return sendTransaction(client, { ...psm3Execution, account, chain: client.chain });
}

export function getPsm3CompositeApprovalTokens(props: TradeTokensProps): {
  tokensAddresses: Address[];
  spenders: Address[];
  amounts: bigint[];
} {
  const { trade, psm3Leg } = props;
  if (!psm3Leg || !isAmmTrade(trade)) {
    return { tokensAddresses: [], spenders: [], amounts: [] };
  }

  const chainId = trade.chainId;
  const psm3Address = buildPsm3SwapExecution(psm3Leg, chainId, props.account).to;
  const ammSpender = trade.approveAddress as Address;
  const tokensAddresses: Address[] = [];
  const spenders: Address[] = [];
  const amounts: bigint[] = [];

  if (isPsm3BeforeAmm(psm3Leg, chainId)) {
    tokensAddresses.push(psm3Leg.assetIn);
    spenders.push(psm3Address);
    amounts.push(psm3Leg.tradeType === "exactIn" ? psm3Leg.amountIn : psm3Leg.limitAmount);

    tokensAddresses.push(psm3Leg.assetOut);
    spenders.push(ammSpender);
    amounts.push(getPsm3GuaranteedSusdsOutput(psm3Leg));
  } else {
    tokensAddresses.push(trade.tokenIn.address as Address);
    spenders.push(ammSpender);
    amounts.push(getMaximumAmountIn(trade));

    tokensAddresses.push(psm3Leg.assetIn);
    spenders.push(psm3Address);
    amounts.push(psm3Leg.tradeType === "exactIn" ? psm3Leg.amountIn : psm3Leg.limitAmount);
  }

  return { tokensAddresses, spenders, amounts };
}
