/**
 * Composite trade execution: PSM3 + Uniswap in one batch or sequential txs.
 */

import { UniswapTrade } from "@swapr/sdk";
import type { Address, Client, Hex } from "viem";
import { sendTransaction } from "viem/actions";
import { fetchNeededApprovals, getApprovals7702 } from "./approvals";
import type { SupportedChain } from "./chains";
import { getActivePrimaryCollateral } from "./collateral";
import { getTradeApprovals7702 } from "./execute-trade";
import type { Execution } from "./execution";
import { buildPsm3SwapExecution } from "./psm3";
import type { Psm3Leg } from "./quote";
import { isTwoStringsEqual } from "./quote-utils";
import type { TradeTokensProps } from "./trade-utils";
import { getMaximumAmountIn } from "./trade-utils";

async function getUniswapExecution(trade: UniswapTrade, account: Address): Promise<Execution> {
  const populatedTransaction = await trade.swapTransaction({ recipient: account });
  return {
    to: populatedTransaction.to! as Address,
    data: populatedTransaction.data!.toString() as Hex,
    value: BigInt(populatedTransaction.value?.toString() || 0),
    chainId: trade.chainId,
  };
}

function isPsm3BeforeUniswap(psm3Leg: Psm3Leg, chainId: number): boolean {
  const primary = getActivePrimaryCollateral(chainId);
  return isTwoStringsEqual(psm3Leg.assetOut, primary.address);
}

export async function buildPsm3CompositeTradeCalls7702(props: TradeTokensProps): Promise<Execution[]> {
  const { trade, account, psm3Leg } = props;
  if (!psm3Leg || !(trade instanceof UniswapTrade)) {
    throw new Error("Composite trade requires Uniswap trade and psm3Leg");
  }

  const chainId = trade.chainId;
  const psm3Address = buildPsm3SwapExecution(psm3Leg, chainId, account).to;
  const uniswapSpender = trade.approveAddress as Address;
  const calls: Execution[] = [];

  if (isPsm3BeforeUniswap(psm3Leg, chainId)) {
    const psm3Approvals = getTradeApprovals7702({
      tokensAddresses: [psm3Leg.assetIn],
      account,
      spender: psm3Address,
      amounts: psm3Leg.tradeType === "exactIn" ? psm3Leg.amountIn : psm3Leg.limitAmount,
      chainId,
    });
    calls.push(...psm3Approvals);
    calls.push(buildPsm3SwapExecution(psm3Leg, chainId, account));

    const sUsdsAmount = psm3Leg.tradeType === "exactIn" ? psm3Leg.limitAmount : psm3Leg.amountOut;
    calls.push(
      ...getTradeApprovals7702({
        tokensAddresses: [psm3Leg.assetOut],
        account,
        spender: uniswapSpender,
        amounts: getMaximumAmountIn(trade) > sUsdsAmount ? getMaximumAmountIn(trade) : sUsdsAmount,
        chainId: chainId as SupportedChain,
      }),
    );
  } else {
    calls.push(
      ...getTradeApprovals7702({
        tokensAddresses: [trade.executionPrice.baseCurrency.address as Address],
        account,
        spender: uniswapSpender,
        amounts: getMaximumAmountIn(trade),
        chainId: chainId as SupportedChain,
      }),
    );
  }

  const uniswapExecution = await getUniswapExecution(trade, account);
  calls.push(uniswapExecution);

  if (!isPsm3BeforeUniswap(psm3Leg, chainId)) {
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
  if (!psm3Leg || !(trade instanceof UniswapTrade)) {
    throw new Error("Composite trade requires Uniswap trade and psm3Leg");
  }

  const chainId = trade.chainId;
  const psm3Execution = buildPsm3SwapExecution(psm3Leg, chainId, account);
  const psm3Address = psm3Execution.to;
  const uniswapExecution = await getUniswapExecution(trade, account);
  const uniswapSpender = trade.approveAddress as Address;

  if (isPsm3BeforeUniswap(psm3Leg, chainId)) {
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

    const sUsdsAmount = psm3Leg.tradeType === "exactIn" ? psm3Leg.limitAmount : psm3Leg.amountOut;
    const neededSUsds = await fetchNeededApprovals(client, [psm3Leg.assetOut], account, uniswapSpender, [
      getMaximumAmountIn(trade) > sUsdsAmount ? getMaximumAmountIn(trade) : sUsdsAmount,
    ]);
    for (const approval of neededSUsds) {
      const [approvalCall] = getApprovals7702({
        tokensAddresses: [approval.tokenAddress],
        account,
        spender: uniswapSpender,
        amounts: approval.amount,
        chainId: chainId as SupportedChain,
      });
      if (approvalCall) {
        await sendTransaction(client, { ...approvalCall, account, chain: client.chain });
      }
    }

    return sendTransaction(client, { ...uniswapExecution, account, chain: client.chain });
  }

  const neededUniswap = await fetchNeededApprovals(
    client,
    [trade.executionPrice.baseCurrency.address as Address],
    account,
    uniswapSpender,
    [getMaximumAmountIn(trade)],
  );
  for (const approval of neededUniswap) {
    const [approvalCall] = getApprovals7702({
      tokensAddresses: [approval.tokenAddress],
      account,
      spender: uniswapSpender,
      amounts: approval.amount,
      chainId: chainId as SupportedChain,
    });
    if (approvalCall) {
      await sendTransaction(client, { ...approvalCall, account, chain: client.chain });
    }
  }

  await sendTransaction(client, { ...uniswapExecution, account, chain: client.chain });

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
  if (!psm3Leg || !(trade instanceof UniswapTrade)) {
    return { tokensAddresses: [], spenders: [], amounts: [] };
  }

  const chainId = trade.chainId;
  const psm3Address = buildPsm3SwapExecution(psm3Leg, chainId, props.account).to;
  const uniswapSpender = trade.approveAddress as Address;
  const tokensAddresses: Address[] = [];
  const spenders: Address[] = [];
  const amounts: bigint[] = [];

  if (isPsm3BeforeUniswap(psm3Leg, chainId)) {
    tokensAddresses.push(psm3Leg.assetIn);
    spenders.push(psm3Address);
    amounts.push(psm3Leg.tradeType === "exactIn" ? psm3Leg.amountIn : psm3Leg.limitAmount);
  } else {
    tokensAddresses.push(trade.executionPrice.baseCurrency.address as Address);
    spenders.push(uniswapSpender);
    amounts.push(getMaximumAmountIn(trade));
  }

  return { tokensAddresses, spenders, amounts };
}
