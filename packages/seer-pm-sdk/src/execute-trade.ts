/**
 * Trade execution: build transaction data and execute swaps.
 */

import {
  EnrichedOrder,
  OrderBookApi,
  OrderSigningUtils,
  type SupportedChainId,
  type UnsignedOrder,
} from "@cowprotocol/cow-sdk";
import { CoWTrade } from "@swapr/sdk";
import { Contract, providers } from "ethers";
import type { Signer } from "ethers";
import type { Address, Client, Hex } from "viem";
import { encodeFunctionData, parseUnits } from "viem";
import { sendTransaction } from "viem/actions";
import { creditsManagerAbi, creditsManagerAddress } from "../generated/contracts/trading-credits";
import type { AmmTrade } from "./amm-trade";
import { NATIVE_TOKEN } from "./collateral";
import { ERC20_APPROVE_ABI, ETH_FLOW_ABI } from "./execute-trade-abis";
import type { Execution } from "./execution";
import { isTwoStringsEqual } from "./quote-utils";
import type { TradeTokensProps } from "./trade-utils";
import { getMaximumAmountIn, isAmmTrade } from "./trade-utils";

export type { TradeTokensProps } from "./trade-utils";

export const ETH_FLOW_ADDRESS = "0xba3cb449bd2b4adddbc894d8697f5170800eadec" as const;

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
 * Build Lens AMM trade execution.
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
 * Wrap trade execution for Seer Credits (routes through CreditsManager).
 */
export function getWrappedSeerCreditsExecution(
  isSeerCredits: boolean,
  trade: AmmTrade,
  tradeExecution: Execution,
): Execution {
  if (!isSeerCredits) return tradeExecution;

  const creditsAddr = creditsManagerAddress[trade.chainId as keyof typeof creditsManagerAddress];
  if (!creditsAddr) {
    throw new Error(`No credits manager for chain ${trade.chainId}`);
  }

  const executeData = encodeFunctionData({
    abi: creditsManagerAbi,
    functionName: "execute",
    args: [tradeExecution.to, tradeExecution.data, getMaximumAmountIn(trade), trade.tokenOut.address as Address],
  });

  return {
    to: creditsAddr as Address,
    data: executeData,
    value: 0n,
    chainId: trade.chainId,
  };
}

/**
 * Execute CoW trade (sign + submit or eth flow).
 * Returns order ID. Wrap with toastify in the app for UI feedback.
 */
export async function executeCoWTrade(signer: Signer, trade: CoWTrade): Promise<string> {
  if (isTwoStringsEqual(trade.inputAmount.currency.address, NATIVE_TOKEN)) {
    const ethFlowContract = new Contract(ETH_FLOW_ADDRESS, ETH_FLOW_ABI, signer);
    const ethOrder = {
      ...trade.quote.quote,
      quoteId: trade.quote.id,
    };
    const orderDigest = await ethFlowContract.callStatic["createOrder"](ethOrder, {
      value: ethOrder.sellAmount,
    });
    const orderId = `${orderDigest}${ETH_FLOW_ADDRESS.slice(2)}ffffffff`.toLowerCase();
    await ethFlowContract.createOrder(ethOrder, { value: ethOrder.sellAmount });
    return orderId;
  }

  await trade.signOrder(signer);
  const orderId = await trade.submitOrder();
  return orderId;
}

/**
 * Create and submit a CoW limit order (sign + send). Returns order ID.
 * Wrap with toastify in the app for UI feedback.
 */
export async function createCowOrder(
  signer: Signer,
  params: { order: UnsignedOrder; chainId: SupportedChainId },
): Promise<string> {
  const { order, chainId } = params;
  const orderBookApi = new OrderBookApi({ chainId });
  // biome-ignore lint/suspicious/noExplicitAny:
  const orderSigningResult: any = await OrderSigningUtils.signOrder(order, chainId, signer);
  const orderId = await orderBookApi.sendOrder({ ...order, ...orderSigningResult });
  return orderId;
}

/**
 * Cancel a CoW order by order ID. Wrap with toastify in the app for UI feedback.
 */
export async function cancelCowOrder(
  signer: Signer,
  params: { orderId: string; chainId: SupportedChainId },
): Promise<string> {
  const { orderId, chainId } = params;
  const orderBookApi = new OrderBookApi({ chainId });
  const orderCancellationSigningResult = await OrderSigningUtils.signOrderCancellations([orderId], chainId, signer);
  await orderBookApi.sendSignedOrderCancellations({
    ...orderCancellationSigningResult,
    orderUids: [orderId],
  });
  return orderId;
}

/**
 * Invalidate an EthFlow order on-chain. Returns order uid.
 * Wrap with toastify in the app for UI feedback.
 */
export async function cancelEthFlowOrder(signer: Signer, params: { order: EnrichedOrder }): Promise<string> {
  const { order } = params;
  const ethFlowContract = new Contract(ETH_FLOW_ADDRESS, ETH_FLOW_ABI, signer);
  const contractOrder = {
    buyToken: order.buyToken,
    receiver: order.receiver,
    sellAmount: parseUnits(order.sellAmount, 18),
    buyAmount: parseUnits(order.buyAmount, 18),
    appData: order.appData,
    feeAmount: order.feeAmount,
    validTo: order.validTo,
    partiallyFillable: order.partiallyFillable,
    quoteId: order.quoteId ?? 0,
  };
  await ethFlowContract.invalidateOrder(contractOrder, { gasLimit: 200000 });
  return order.uid;
}

type SignerCompatibleClient = {
  account: { address: Address };
  chain: { id: number; name: string };
  transport: unknown;
};

function toEthersSigner(client: SignerCompatibleClient): Signer {
  const { account, chain } = client;
  const network = {
    chainId: chain.id,
    name: chain.name,
  };
  const provider = new providers.Web3Provider(client.transport as providers.ExternalProvider, network);
  return provider.getSigner(account.address);
}

/**
 * Convert a viem client with account+chain to ethers Signer.
 */
export function viemClientToSigner(client: Client): Signer {
  if (!client.account || !client.chain) {
    throw new Error("Wallet client must include account and chain");
  }

  return toEthersSigner({
    account: { address: client.account.address },
    chain: { id: client.chain.id, name: client.chain.name },
    transport: client.transport,
  });
}

/**
 * Convert wagmi connector client to ethers Signer.
 */
export function clientToSigner(client: SignerCompatibleClient): Signer {
  return toEthersSigner(client);
}

/**
 * Build execution for AMM trade (Lens).
 */
export async function buildAmmTradeExecution(
  trade: AmmTrade,
  account: Address,
  isSeerCredits: boolean,
): Promise<Execution> {
  const swapExecution = await getAmmTradeExecution(trade, account);
  return getWrappedSeerCreditsExecution(isSeerCredits, trade, swapExecution);
}

/**
 * Execute AMM trade. Returns tx hash; app should wrap with toastifyTx and wait for receipt.
 */
export async function executeAmmTrade(
  client: Client,
  trade: AmmTrade,
  account: Address,
  isSeerCredits: boolean,
): Promise<`0x${string}`> {
  const exec = await buildAmmTradeExecution(trade, account, isSeerCredits);
  return sendTransaction(client, { ...exec, account, chain: client.chain });
}

/**
 * Execute trade. Dispatches to CoW or Lens AMM.
 * Returns order ID (string) for CoW, or tx hash for AMM.
 * Wrap with toastify (CoW) or toastifyTx (AMM) in the app.
 *
 * Pass `getSigner` only if you want to support CoW trades; without it, CoW trades will throw.
 */
export async function tradeTokens(
  props: TradeTokensProps,
  adapters: { client: Client; getSigner?: () => Promise<Signer> },
): Promise<string> {
  const { trade, account, isSeerCredits } = props;
  const { client, getSigner } = adapters;

  if (trade instanceof CoWTrade) {
    if (!getSigner) {
      throw new Error("getSigner is required to execute CoW trades; pass it in adapters or use AMM only.");
    }
    const signer = await getSigner();
    return executeCoWTrade(signer, trade);
  }

  if (props.completeSetLeg) {
    if (isSeerCredits) {
      throw new Error("Complete-set trades are not supported with Seer Credits");
    }
    const { executeCompleteSetTrade } = await import("./complete-set-trade");
    return executeCompleteSetTrade(client, props);
  }

  if (props.psm3Leg && isAmmTrade(trade)) {
    return executePsm3CompositeTradeWrapper(client, props);
  }

  return executeAmmTrade(client, trade, account, isSeerCredits);
}

async function executePsm3CompositeTradeWrapper(client: Client, props: TradeTokensProps): Promise<`0x${string}`> {
  const { executePsm3CompositeTrade } = await import("./psm3-composite-trade");
  return executePsm3CompositeTrade(client, props);
}

/**
 * Build calls for 7702 batch (approvals + swap).
 */
export async function buildTradeCalls7702(props: TradeTokensProps): Promise<Execution[]> {
  const { trade, account, isSeerCredits, psm3Leg } = props;

  if (trade instanceof CoWTrade) {
    throw new Error("buildTradeCalls7702 does not support CoW trades; use tradeTokens instead");
  }

  if (props.completeSetLeg) {
    if (isSeerCredits) {
      throw new Error("Complete-set trades are not supported with Seer Credits");
    }
    const { buildCompleteSetTradeCalls7702 } = await import("./complete-set-trade");
    return buildCompleteSetTradeCalls7702(props);
  }

  if (psm3Leg && isAmmTrade(trade)) {
    const { buildPsm3CompositeTradeCalls7702 } = await import("./psm3-composite-trade");
    return buildPsm3CompositeTradeCalls7702(props);
  }

  const calls: Execution[] = isSeerCredits
    ? []
    : getTradeApprovals7702({
        tokensAddresses: [trade.tokenIn.address as Address],
        account,
        spender: trade.approveAddress as Address,
        amounts: getMaximumAmountIn(trade),
        chainId: trade.chainId,
      });

  const swapExecution = await getAmmTradeExecution(trade, account);
  calls.push(getWrappedSeerCreditsExecution(isSeerCredits, trade, swapExecution));

  return calls;
}
