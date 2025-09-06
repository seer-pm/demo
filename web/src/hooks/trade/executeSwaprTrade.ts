import { Execution } from "@/hooks/useCheck7702Support";
import { toastifyTx } from "@/lib/toastify";
import { config } from "@/wagmi";
import { SwaprV3Trade } from "@swapr/sdk";
import { sendTransaction } from "@wagmi/core";
import { Address, TransactionReceipt, encodeFunctionData, zeroAddress } from "viem";
import { routerAbi } from "./abis";

const SWAPR_SWAP_ROUTER = "0xffb643e73f280b97809a8b41f7232ab401a04ee1";

export async function executeSwaprTrade(
  trade: SwaprV3Trade,
  account: Address,
  isBuyExactOutputNative: boolean,
  isSellToNative: boolean,
): Promise<TransactionReceipt> {
  const result = await toastifyTx(
    async () =>
      sendTransaction(config, await getSwaprTradeExecution(trade, account, isBuyExactOutputNative, isSellToNative)),
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

export async function getSwaprTradeExecution(
  trade: SwaprV3Trade,
  account: Address,
  isBuyExactOutputNative: boolean,
  isSellToNative: boolean,
): Promise<Execution> {
  if (isSellToNative) {
    // use muticall here to unwrap wrapped tokens to native tokens
    //recipient is zeroAddress since we want router to receive it
    const populatedTransaction = await trade.swapTransaction({
      recipient: zeroAddress,
    });
    const amountOut = `0x${trade.minimumAmountOut().raw.toString(16)}`;
    //here we unwrap router balance
    return multicallSellToNative(amountOut, populatedTransaction.data!.toString(), account);
  }

  const populatedTransaction = await trade.swapTransaction({
    recipient: account,
  });

  if (isBuyExactOutputNative) {
    // use muticall here to refund native token
    const amountIn = `0x${trade.maximumAmountIn().raw.toString(16)}`;
    return multicallBuyExactOutputNative(amountIn, populatedTransaction.data!.toString());
  }

  return {
    to: populatedTransaction.to! as `0x${string}`,
    data: populatedTransaction.data!.toString() as `0x${string}`,
    value: BigInt(populatedTransaction.value?.toString() || 0),
  };
}

function multicallBuyExactOutputNative(amountIn: string, swapData: string): Execution {
  const refundNativeTokenData = encodeFunctionData({
    abi: routerAbi,
    functionName: "refundNativeToken",
  });

  const data = encodeFunctionData({
    abi: routerAbi,
    functionName: "multicall",
    args: [[swapData, refundNativeTokenData]],
  });

  return {
    to: SWAPR_SWAP_ROUTER,
    value: BigInt(amountIn),
    data,
  };
}

function multicallSellToNative(amountOut: string, swapData: string, recipient: string): Execution {
  const unwrapData = encodeFunctionData({
    abi: routerAbi,
    functionName: "unwrapWNativeToken",
    args: [BigInt(amountOut), recipient],
  });

  const data = encodeFunctionData({
    abi: routerAbi,
    functionName: "multicall",
    args: [[swapData, unwrapData]],
  });

  return {
    to: SWAPR_SWAP_ROUTER,
    value: 0n,
    data,
  };
}
