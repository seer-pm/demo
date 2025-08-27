import { toastifyTx } from "@/lib/toastify";
import { config } from "@/wagmi";
import { SwaprV3Trade } from "@swapr/sdk";
import { getConnectorClient, sendTransaction } from "@wagmi/core";
import { Transaction, ethers } from "ethers";
import { Address, TransactionReceipt, zeroAddress } from "viem";
import { routerAbi } from "./abis";
import { clientToSigner } from "./utils";

export async function executeSwaprTrade(
  trade: SwaprV3Trade,
  account: Address,
  isBuyExactOutputNative: boolean,
  isSellToNative: boolean
): Promise<TransactionReceipt> {
  if (isSellToNative) {
    // use muticall here to unwrap wrapped tokens to native tokens
    //recipient is zeroAddress since we want router to receive it
    const populatedTransaction = await trade.swapTransaction({
      recipient: zeroAddress,
    });
    const amountOut = `0x${trade.minimumAmountOut().raw.toString(16)}`;
    //here we unwrap router balance
    return await multicallSellToNative(
      amountOut,
      populatedTransaction.data!.toString(),
      account
    );
  }
  const populatedTransaction = await trade.swapTransaction({
    recipient: account,
  });

  if (isBuyExactOutputNative) {
    // use muticall here to refund native token
    const amountIn = `0x${trade.maximumAmountIn().raw.toString(16)}`;
    return await multicallBuyExactOutputNative(
      amountIn,
      populatedTransaction.data!.toString()
    );
  }

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
    }
  );

  if (!result.status) {
    throw result.error;
  }

  return result.receipt;
}

export async function multicallBuyExactOutputNative(
  amountIn: string,
  swapData: string
) {
  const routerAddress = "0xffb643e73f280b97809a8b41f7232ab401a04ee1";

  const client = await getConnectorClient(config);
  const signer = clientToSigner(client);

  const routerInterface = new ethers.utils.Interface(routerAbi);
  const refundNativeTokenData =
    routerInterface.encodeFunctionData("refundNativeToken");

  const contract = new ethers.Contract(routerAddress, routerInterface, signer);
  const result = await toastifyTx(
    () =>
      contract
        .multicall([swapData, refundNativeTokenData], {
          value: amountIn,
        })
        .then((result: Transaction) => result.hash),
    {
      txSent: { title: "Executing trade..." },
      txSuccess: { title: "Trade executed!" },
    }
  );

  if (!result.status) {
    throw result.error;
  }
  return result.receipt;
}

export async function multicallSellToNative(
  amountOut: string,
  swapData: string,
  recipient: string
) {
  const routerAddress = "0xffb643e73f280b97809a8b41f7232ab401a04ee1";

  const client = await getConnectorClient(config);
  const signer = clientToSigner(client);

  const routerInterface = new ethers.utils.Interface(routerAbi);
  const unwrapData = routerInterface.encodeFunctionData("unwrapWNativeToken", [
    amountOut,
    recipient,
  ]);

  const contract = new ethers.Contract(routerAddress, routerInterface, signer);
  const result = await toastifyTx(
    () =>
      contract
        .multicall([swapData, unwrapData])
        .then((result: Transaction) => result.hash),
    {
      txSent: { title: "Executing trade..." },
      txSuccess: { title: "Trade executed!" },
    }
  );

  if (!result.status) {
    throw result.error;
  }
  return result.receipt;
}
