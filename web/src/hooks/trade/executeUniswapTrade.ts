import { COLLATERAL_TOKENS } from "@/lib/config";
import { toastifyTx } from "@/lib/toastify";
import { Token } from "@/lib/tokens";
import { config } from "@/wagmi";
import { UniswapTrade } from "@swapr/sdk";
import { sendTransaction } from "@wagmi/core";
import { Address, TransactionReceipt } from "viem";
import { convertFromSDAI, depositToSDAI, withdrawFromSDAI } from "./handleSDAI";

async function getPopulatedTransaction(trade: UniswapTrade, account: Address, collateral: Token) {
  const isBuyOutcomeTokens =
    trade.inputAmount.currency.address?.toLocaleLowerCase() === COLLATERAL_TOKENS[trade.chainId].primary.address;
  // dai to sdai
  if (isBuyOutcomeTokens && collateral.address === COLLATERAL_TOKENS[trade.chainId].secondary?.address) {
    const sDAIInputAmount = BigInt(trade.inputAmount.raw.toString());
    const DAIAmount = await convertFromSDAI({ chainId: trade.chainId, amount: sDAIInputAmount });
    await depositToSDAI({ amount: DAIAmount, chainId: trade.chainId, owner: account });
  }

  return await trade.swapTransaction({
    recipient: account,
  });
}

export async function executeUniswapTrade(
  trade: UniswapTrade,
  account: Address,
  collateral: Token,
): Promise<TransactionReceipt> {
  const populatedTransaction = await getPopulatedTransaction(trade, account, collateral);

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

  const isSellOutcomeTokens =
    trade.outputAmount.currency.address?.toLocaleLowerCase() === COLLATERAL_TOKENS[trade.chainId].primary.address;

  if (isSellOutcomeTokens && collateral.address === COLLATERAL_TOKENS[trade.chainId].secondary?.address) {
    await withdrawFromSDAI({
      amount: BigInt(trade.outputAmount.raw.toString()),
      chainId: trade.chainId,
      owner: account,
    });
  }

  return result.receipt;
}
