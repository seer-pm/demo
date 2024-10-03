import { COLLATERAL_TOKENS } from "@/lib/config";
import { toastifyTx } from "@/lib/toastify";
import { Token } from "@/lib/tokens";
import { isTwoStringsEqual } from "@/lib/utils";
import { config } from "@/wagmi";
import { UniswapTrade } from "@swapr/sdk";
import { sendTransaction } from "@wagmi/core";
import { Address, TransactionReceipt, parseUnits } from "viem";
import { approveTokens } from "../useApproveTokens";
import { depositToSDAI, redeemFromSDAI } from "./handleSDAI";

async function getPopulatedTransaction(
  trade: UniswapTrade,
  account: Address,
  collateral: Token,
  originalAmount: string,
) {
  const sDAIAddress = COLLATERAL_TOKENS[trade.chainId].primary.address;
  const DAIAddress = COLLATERAL_TOKENS[trade.chainId].secondary?.address;
  const isBuyOutcomeTokens = isTwoStringsEqual(trade.inputAmount.currency.address, sDAIAddress);
  // dai to sdai
  if (isBuyOutcomeTokens && DAIAddress && isTwoStringsEqual(collateral.address, DAIAddress)) {
    const amount = parseUnits(originalAmount, collateral.decimals);
    await approveTokens({
      amount,
      tokenAddress: DAIAddress,
      spender: sDAIAddress,
    });
    await depositToSDAI({ amount, chainId: trade.chainId, owner: account });
  }

  return await trade.swapTransaction({
    recipient: account,
  });
}

export async function executeUniswapTrade(
  trade: UniswapTrade,
  account: Address,
  collateral: Token,
  originalAmount: string,
): Promise<TransactionReceipt> {
  const populatedTransaction = await getPopulatedTransaction(trade, account, collateral, originalAmount);

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

  // sdai to dai
  const isSellOutcomeTokens = isTwoStringsEqual(
    trade.outputAmount.currency.address,
    COLLATERAL_TOKENS[trade.chainId].primary.address,
  );

  const DAIAddress = COLLATERAL_TOKENS[trade.chainId].secondary?.address;
  if (isSellOutcomeTokens && isTwoStringsEqual(collateral.address, DAIAddress)) {
    await redeemFromSDAI({
      amount: BigInt(trade.outputAmount.raw.toString()),
      chainId: trade.chainId,
      owner: account,
    });
  }

  return result.receipt;
}
