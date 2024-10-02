import { COLLATERAL_TOKENS } from "@/lib/config";
import { toastifyTx } from "@/lib/toastify";
import { Token } from "@/lib/tokens";
import { NATIVE_TOKEN } from "@/lib/utils";
import { config } from "@/wagmi";
import { SwaprV3Trade, WXDAI } from "@swapr/sdk";
import { sendTransaction } from "@wagmi/core";
import { Address, TransactionReceipt, parseUnits } from "viem";
import { approveTokens } from "../useApproveTokens";
import {
  S_DAI_ADAPTER,
  convertFromSDAI,
  depositFromNativeToSDAI,
  depositToSDAI,
  withdrawFromSDAI,
  withdrawFromSDAIToNative,
} from "./handleSDAI";

async function getPopulatedTransaction(
  trade: SwaprV3Trade,
  account: Address,
  collateral: Token,
  originalAmount: string,
) {
  const isBuyOutcomeTokens =
    trade.inputAmount.currency.address?.toLocaleLowerCase() === COLLATERAL_TOKENS[trade.chainId].primary.address;
  // xdai to sdai
  if (isBuyOutcomeTokens && collateral.address === NATIVE_TOKEN) {
    const sDAIInputAmount = BigInt(trade.inputAmount.raw.toString());
    const xDAIAmount = await convertFromSDAI({ chainId: trade.chainId, amount: sDAIInputAmount });
    await depositFromNativeToSDAI({ amount: xDAIAmount, chainId: trade.chainId, owner: account });
  }

  // wxdai to sdai

  if (isBuyOutcomeTokens && collateral.address === WXDAI[trade.chainId].address.toLocaleLowerCase()) {
    const amount = parseUnits(originalAmount, collateral.decimals);
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
  const isSellOutcomeTokens = trade.outputAmount.currency.address?.toLocaleLowerCase() === sDAIAddress;
  // sdai to xdai
  if (isSellOutcomeTokens && collateral.address === NATIVE_TOKEN) {
    await approveTokens({
      amount: BigInt(trade.outputAmount.raw.toString()),
      tokenAddress: sDAIAddress,
      spender: S_DAI_ADAPTER,
    });
    await withdrawFromSDAIToNative({
      amount: BigInt(trade.outputAmount.raw.toString()),
      chainId: trade.chainId,
      owner: account,
    });
  }

  // sdai to wxdai
  if (isSellOutcomeTokens && collateral.address === WXDAI[trade.chainId].address.toLocaleLowerCase()) {
    await withdrawFromSDAI({
      amount: BigInt(trade.outputAmount.raw.toString()),
      chainId: trade.chainId,
      owner: account,
    });
  }

  return result.receipt;
}
