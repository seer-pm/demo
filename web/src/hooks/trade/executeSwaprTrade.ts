import { COLLATERAL_TOKENS } from "@/lib/config";
import { toastifyTx } from "@/lib/toastify";
import { Token } from "@/lib/tokens";
import { NATIVE_TOKEN, isTwoStringsEqual } from "@/lib/utils";
import { config } from "@/wagmi";
import { SwaprV3Trade, WXDAI } from "@swapr/sdk";
import { sendTransaction } from "@wagmi/core";
import { Address, TransactionReceipt, parseUnits } from "viem";
import { approveTokens } from "../useApproveTokens";
import {
  S_DAI_ADAPTER,
  depositFromNativeToSDAI,
  depositToSDAI,
  redeemFromSDAI,
  redeemFromSDAIToNative,
} from "./handleSDAI";

async function getPopulatedTransaction(
  trade: SwaprV3Trade,
  account: Address,
  collateral: Token,
  originalAmount: string,
) {
  const sDAIAddress = COLLATERAL_TOKENS[trade.chainId].primary.address;
  const wxDAIAddress = WXDAI[trade.chainId].address as Address;
  const isBuyOutcomeTokens = isTwoStringsEqual(trade.inputAmount.currency.address, sDAIAddress);
  // xdai to sdai
  if (isBuyOutcomeTokens && isTwoStringsEqual(collateral.address, NATIVE_TOKEN)) {
    const amount = parseUnits(originalAmount, collateral.decimals);
    await depositFromNativeToSDAI({ amount, chainId: trade.chainId, owner: account });
  }

  // wxdai to sdai

  if (isBuyOutcomeTokens && isTwoStringsEqual(collateral.address, wxDAIAddress)) {
    const amount = parseUnits(originalAmount, collateral.decimals);
    await approveTokens({
      amount,
      tokenAddress: wxDAIAddress,
      spender: sDAIAddress,
    });
    await depositToSDAI({ amount, chainId: trade.chainId, owner: account });
  }

  return await trade.swapTransaction({
    recipient: account,
  });
}

export async function executeSwaprTrade(
  trade: SwaprV3Trade,
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
  const sDAIAddress = COLLATERAL_TOKENS[trade.chainId].primary.address;
  const wxDAIAddress = WXDAI[trade.chainId].address as Address;
  const isSellOutcomeTokens = isTwoStringsEqual(trade.outputAmount.currency.address, sDAIAddress);
  // sdai to xdai
  if (isSellOutcomeTokens && isTwoStringsEqual(collateral.address, NATIVE_TOKEN)) {
    await approveTokens({
      amount: BigInt(trade.outputAmount.raw.toString()),
      tokenAddress: sDAIAddress,
      spender: S_DAI_ADAPTER,
    });
    await redeemFromSDAIToNative({
      amount: BigInt(trade.outputAmount.raw.toString()),
      chainId: trade.chainId,
      owner: account,
    });
  }

  // sdai to wxdai
  if (isSellOutcomeTokens && isTwoStringsEqual(collateral.address, wxDAIAddress)) {
    await redeemFromSDAI({
      amount: BigInt(trade.outputAmount.raw.toString()),
      chainId: trade.chainId,
      owner: account,
    });
  }

  return result.receipt;
}
