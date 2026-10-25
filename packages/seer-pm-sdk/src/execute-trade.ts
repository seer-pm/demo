/**
 * Trade execution: build transaction data and execute swaps.
 */

import type { Address, Client, Hex } from "viem";
import { encodeFunctionData } from "viem";
import { sendTransaction } from "viem/actions";
import { creditsManagerAbi } from "../generated/contracts/trading-credits";
import type { AmmTrade } from "./amm-trade";
import { NATIVE_TOKEN } from "./collateral";
import { ERC20_APPROVE_ABI } from "./execute-trade-abis";
import type { Execution } from "./execution";
import { isTwoStringsEqual } from "./quote-utils";
import type { TradeTokensProps } from "./trade-utils";
import { getMaximumAmountIn } from "./trade-utils";
import { getActiveCreditsManagerAddress } from "./trading-credits";

export type { TradeTokensProps } from "./trade-utils";

/**
 * Get maximum amount in for approval.
 */
export { getMaximumAmountIn } from "./trade-utils";

export interface GetTradeApprovals7702Params {
  tokensAddresses: Address[];
  account: Address;
  spender: Address;
  amounts: bigint | bigint[];
  chainId: number;
}

/**
 * Build ERC20 approve calls for 7702 batch (no native token).
 */
export function getTradeApprovals7702(params: GetTradeApprovals7702Params): Execution[] {
  const { tokensAddresses, spender, amounts, chainId } = params;
  const calls: Execution[] = [];

  if (!tokensAddresses.length) return calls;

  for (let i = 0; i < tokensAddresses.length; i++) {
    if (isTwoStringsEqual(tokensAddresses[i], NATIVE_TOKEN)) continue;

    const amount = typeof amounts === "bigint" ? amounts : amounts[i];
    calls.push({
      to: tokensAddresses[i],
      value: 0n,
      data: encodeFunctionData({
        abi: ERC20_APPROVE_ABI,
        functionName: "approve",
        args: [spender, amount],
      }),
      chainId,
    });
  }

  return calls;
}

/**
 * Build AMM trade execution (DEX router calldata from Lens smart quoter).
 */
export async function getAmmTradeExecution(trade: AmmTrade, account: Address): Promise<Execution> {
  const populatedTransaction = await trade.swapTransaction({ recipient: account });

  return {
    to: populatedTransaction.to! as Address,
    data: populatedTransaction.data!.toString() as Hex,
    value: BigInt(populatedTransaction.value?.toString() || 0),
    chainId: trade.chainId,
  };
}

/**
 * Wrap trade execution for trading credits (routes through the active CreditsManager).
 */
export function getWrappedCreditsExecution(
  isTradingCredits: boolean,
  trade: AmmTrade,
  tradeExecution: Execution,
): Execution {
  if (!isTradingCredits) return tradeExecution;

  const creditsAddr = getActiveCreditsManagerAddress(trade.chainId);
  if (!creditsAddr) {
    throw new Error(`No credits manager for chain ${trade.chainId}`);
  }

  const executeData = encodeFunctionData({
    abi: creditsManagerAbi,
    functionName: "execute",
    args: [tradeExecution.to, tradeExecution.data, getMaximumAmountIn(trade), trade.tokenOut.address as Address],
  });

  return {
    to: creditsAddr,
    data: executeData,
    value: 0n,
    chainId: trade.chainId,
  };
}

/**
 * Build execution for AMM trade (via Lens smart quoter → DEX router).
 */
export async function buildAmmTradeExecution(
  trade: AmmTrade,
  account: Address,
  isTradingCredits: boolean,
): Promise<Execution> {
  const swapExecution = await getAmmTradeExecution(trade, account);
  return getWrappedCreditsExecution(isTradingCredits, trade, swapExecution);
}

/**
 * Execute AMM trade. Returns tx hash; app should wrap with toastifyTx and wait for receipt.
 */
export async function executeAmmTrade(
  client: Client,
  trade: AmmTrade,
  account: Address,
  isTradingCredits: boolean,
): Promise<`0x${string}`> {
  const exec = await buildAmmTradeExecution(trade, account, isTradingCredits);
  return sendTransaction(client, { ...exec, account, chain: client.chain });
}

/**
 * Execute AMM trade via Lens smart quoter (or complete-set / PSM3 composite routes).
 * Returns tx hash. Wrap with toastifyTx in the app.
 */
export async function tradeTokens(props: TradeTokensProps, adapters: { client: Client }): Promise<string> {
  const { trade, account, isTradingCredits } = props;
  const { client } = adapters;

  if (props.completeSetLeg) {
    if (isTradingCredits) {
      throw new Error("Complete-set trades are not supported with trading credits");
    }
    const { executeCompleteSetTrade } = await import("./complete-set-trade");
    return executeCompleteSetTrade(client, props);
  }

  if (props.psm3Leg) {
    return executePsm3CompositeTradeWrapper(client, props);
  }

  return executeAmmTrade(client, trade, account, isTradingCredits);
}

async function executePsm3CompositeTradeWrapper(client: Client, props: TradeTokensProps): Promise<`0x${string}`> {
  const { executePsm3CompositeTrade } = await import("./psm3-composite-trade");
  return executePsm3CompositeTrade(client, props);
}

/**
 * Build calls for 7702 batch (approvals + swap).
 */
export async function buildTradeCalls7702(props: TradeTokensProps): Promise<Execution[]> {
  const { trade, account, isTradingCredits, psm3Leg } = props;

  if (props.completeSetLeg) {
    if (isTradingCredits) {
      throw new Error("Complete-set trades are not supported with trading credits");
    }
    const { buildCompleteSetTradeCalls7702 } = await import("./complete-set-trade");
    return buildCompleteSetTradeCalls7702(props);
  }

  if (psm3Leg) {
    const { buildPsm3CompositeTradeCalls7702 } = await import("./psm3-composite-trade");
    return buildPsm3CompositeTradeCalls7702(props);
  }

  const swapExecution = await getAmmTradeExecution(trade, account);

  const calls: Execution[] = isTradingCredits
    ? []
    : getTradeApprovals7702({
        tokensAddresses: [trade.tokenIn.address as Address],
        account,
        spender: trade.approveAddress as Address,
        amounts: getMaximumAmountIn(trade),
        chainId: trade.chainId,
      });

  calls.push(getWrappedCreditsExecution(isTradingCredits, trade, swapExecution));

  return calls;
}
