import { toastifyTx } from "@/lib/toastify";
import { config } from "@/wagmi";
import { UniswapTrade } from "@swapr/sdk";
import { sendTransaction } from "@wagmi/core";
import { Address, TransactionReceipt } from "viem";

export async function executeUniswapTrade(trade: UniswapTrade, account: Address): Promise<TransactionReceipt> {
  const populatedTransaction = await trade.swapTransaction({
    recipient: account,
  });

  const result = await toastifyTx(
    () =>
      sendTransaction(config, {
        to: populatedTransaction.to! as `0x${string}`,
        data: populatedTransaction.data!.toString() as `0x${string}`,
        value: BigInt(populatedTransaction.value?.toString() || 0),
      }),
    {
      txSent: { title: "Executing trade..." },
      txSuccess: { title: "Trade executed!" },
    },
  );

  if (!result.status) {
    throw result.error;
  }

  return result.receipt;
}

export async function buildUniswapTrade(
  trade: UniswapTrade,
  account: Address,
): Promise<{ to: Address; value: bigint; data: `0x${string}` }> {
  const populatedTransaction = await trade.swapTransaction({
    recipient: account,
  });

  return {
    to: populatedTransaction.to! as Address,
    value: BigInt(populatedTransaction.value?.toString() || 0),
    data: populatedTransaction.data!.toString() as `0x${string}`,
  };
}
