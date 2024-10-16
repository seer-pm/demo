import { COLLATERAL_TOKENS } from "@/lib/config";
import { toastifyTx } from "@/lib/toastify";
import { Token } from "@/lib/tokens";
import { NATIVE_TOKEN, isTwoStringsEqual } from "@/lib/utils";
import { config } from "@/wagmi";
import { SwaprV3Trade, WXDAI } from "@swapr/sdk";
import { sendTransaction } from "@wagmi/core";
import { Address, TransactionReceipt, parseUnits } from "viem";
import {
  S_DAI_ADAPTER,
  depositFromNativeToSDAI,
  depositToSDAI,
  redeemFromSDAI,
  redeemFromSDAIToNative,
} from "./handleSDAI";
import { approveIfNeeded, getConvertedShares, setSwaprTradeLimit } from "./utils";

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
    const receipt = await depositFromNativeToSDAI({ amount, chainId: trade.chainId, owner: account });
    const shares = getConvertedShares(receipt);
    if (shares) {
      await approveIfNeeded(sDAIAddress, account, trade.approveAddress as Address, shares);
      const newTrade = setSwaprTradeLimit(trade, shares);
      return newTrade.swapTransaction({
        recipient: account,
      });
    }
  }

  // wxdai to sdai

  if (isBuyOutcomeTokens && isTwoStringsEqual(collateral.address, wxDAIAddress)) {
    const amount = parseUnits(originalAmount, collateral.decimals);
    await approveIfNeeded(wxDAIAddress, account, sDAIAddress, amount);
    const receipt = await depositToSDAI({ amount, chainId: trade.chainId, owner: account });
    const shares = getConvertedShares(receipt);
    if (shares) {
      await approveIfNeeded(sDAIAddress, account, trade.approveAddress as Address, shares);
      const newTrade = setSwaprTradeLimit(trade, shares);
      return newTrade.swapTransaction({
        recipient: account,
      });
    }
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
  const receivedAmount = BigInt(trade.outputAmount.raw.toString());
  // sdai to xdai
  if (isSellOutcomeTokens && isTwoStringsEqual(collateral.address, NATIVE_TOKEN)) {
    await approveIfNeeded(sDAIAddress, account, S_DAI_ADAPTER, receivedAmount);
    await redeemFromSDAIToNative({
      amount: receivedAmount,
      chainId: trade.chainId,
      owner: account,
    });
  }

  // sdai to wxdai
  if (isSellOutcomeTokens && isTwoStringsEqual(collateral.address, wxDAIAddress)) {
    await redeemFromSDAI({
      amount: receivedAmount,
      chainId: trade.chainId,
      owner: account,
    });
  }

  return result.receipt;
}
