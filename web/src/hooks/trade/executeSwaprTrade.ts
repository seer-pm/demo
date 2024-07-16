import { toastifyTx } from "@/lib/toastify";
import { config } from "@/wagmi";
import { Currency, SwaprV3Trade, Token as SwaprToken, WXDAI } from "@swapr/sdk";
import { sendTransaction } from "@wagmi/core";
import { Address, TransactionReceipt } from "viem";
import { gnosis } from "viem/chains";

async function getPopulatedTransaction(trade: SwaprV3Trade, account: Address) {
  if (
    trade.chainId === gnosis.id &&
    (trade.inputAmount.currency.address === WXDAI[trade.chainId].address ||
      trade.outputAmount.currency.address === WXDAI[trade.chainId].address)
  ) {
    // build the route using the intermediate WXDAI<>sDAI pool
    const SDAI = new SwaprToken(trade.chainId, "0xaf204776c7245bf4147c2612bf6e5972ee483701", 18, "sDAI");
    const path: Currency[] = [trade.inputAmount.currency, SDAI, trade.outputAmount.currency];
    return await trade.multiSwapTransaction({
      recipient: account,
      path,
    });
  }

  return await trade.swapTransaction({
    recipient: account,
  });
}

export async function executeSwaprTrade(trade: SwaprV3Trade, account: Address): Promise<TransactionReceipt> {
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
