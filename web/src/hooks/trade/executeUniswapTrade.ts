import { toastifyTx } from "@/lib/toastify";
import { config } from "@/wagmi";
import { UniswapTrade } from "@swapr/sdk";
import { sendTransaction } from "@wagmi/core";
import { Address, TransactionReceipt } from "viem";
import { Execution } from "../useCheck7702Support";

export async function executeUniswapTrade(trade: UniswapTrade, account: Address): Promise<TransactionReceipt> {
  const result = await toastifyTx(async () => sendTransaction(config, await getUniswapTradeExecution(trade, account)), {
    txSent: { title: "Executing trade..." },
    txSuccess: { title: "Trade executed!" },
  });

  if (!result.status) {
    throw result.error;
  }

  return result.receipt;
}

export async function getUniswapTradeExecution(trade: UniswapTrade, account: Address): Promise<Execution> {
  const populatedTransaction = await trade.swapTransaction({
    recipient: account,
  });

  return {
    to: populatedTransaction.to! as `0x${string}`,
    data: populatedTransaction.data!.toString() as `0x${string}`,
    value: BigInt(populatedTransaction.value?.toString() || 0),
  };
}
