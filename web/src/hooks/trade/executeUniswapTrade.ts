import { toastifyTx } from "@/lib/toastify";
import { config } from "@/wagmi";
import { UniswapTrade } from "@swapr/sdk";
import { sendTransaction } from "@wagmi/core";
import { Address, TransactionReceipt } from "viem";

async function getPopulatedTransaction(trade: UniswapTrade, account: Address) {
  return await trade.swapTransaction({
    recipient: account,
  });
}

export async function executeUniswapTrade(trade: UniswapTrade, account: Address): Promise<TransactionReceipt> {
  const populatedTransaction = await getPopulatedTransaction(trade, account);

  const result = await toastifyTx(
    () =>
      sendTransaction(config, {
        to: populatedTransaction.to! as `0x${string}`,
        data: populatedTransaction.data!.toString() as `0x${string}`,
        value: BigInt(populatedTransaction.value?.toString() || 0),
      }),
    { txSent: { title: "Executing trade..." }, txSuccess: { title: "Trade executed!" } },
  );

  if (!result.status) {
    throw result.error;
  }

  return result.receipt;
}
