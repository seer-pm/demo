import { SupportedChain } from "@/lib/chains";
import { queryClient } from "@/lib/query-client";
import { toastify } from "@/lib/toastify";
import { NATIVE_TOKEN, isTwoStringsEqual } from "@/lib/utils";
import { config } from "@/wagmi";
import { EnrichedOrder, OrderBookApi, OrderSigningUtils, UnsignedOrder } from "@cowprotocol/cow-sdk";
import { CoWTrade } from "@swapr/sdk";
import { getConnectorClient } from "@wagmi/core";
import { Contract } from "ethers";
import { parseUnits } from "viem";
import { ethFlowAbi } from "./abis";
import { clientToSigner } from "./utils";

export const ethFlowAddress = "0xba3cb449bd2b4adddbc894d8697f5170800eadec";

export async function executeCoWTrade(trade: CoWTrade): Promise<string> {
  const client = await getConnectorClient(config);
  const signer = clientToSigner(client);

  const ethFlowContract = new Contract(ethFlowAddress, ethFlowAbi, signer);
  if (isTwoStringsEqual(trade.inputAmount.currency.address, NATIVE_TOKEN)) {
    const ethOrder = {
      ...trade.quote.quote,
      quoteId: trade.quote.id,
    };
    const orderDigest = await ethFlowContract.callStatic["createOrder"](ethOrder, { value: ethOrder.sellAmount });
    const orderId = `${orderDigest}${ethFlowAddress.slice(2)}ffffffff`.toLowerCase();
    const result = await toastify(() => ethFlowContract.createOrder(ethOrder, { value: ethOrder.sellAmount }), {
      txSent: { title: "Confirm order..." },
      txSuccess: { title: "Order successfully placed! Check its status in your Portfolio." },
    });

    if (!result.status) {
      throw result.error;
    }
    queryClient.invalidateQueries({ queryKey: ["useCowOrders"] });
    return orderId;
  }

  await trade.signOrder(signer);
  const result = await toastify(() => trade.submitOrder(), {
    txSent: { title: "Confirm order..." },
    txSuccess: { title: "Order successfully placed! Check its status in your Portfolio." },
  });

  if (!result.status) {
    throw result.error;
  }
  queryClient.invalidateQueries({ queryKey: ["useCowOrders"] });
  const orderId = result.data;

  return orderId;
}

export async function createCowOrder({
  order,
  chainId,
}: {
  order: UnsignedOrder;
  chainId: SupportedChain;
}): Promise<string> {
  const client = await getConnectorClient(config);
  const signer = clientToSigner(client);
  const orderBookApi = new OrderBookApi({ chainId });
  // biome-ignore lint/suspicious/noExplicitAny:
  const orderSigningResult: any = await OrderSigningUtils.signOrder(order, chainId, signer);

  const result = await toastify(() => orderBookApi.sendOrder({ ...order, ...orderSigningResult }), {
    txSent: { title: "Confirm order..." },
    txSuccess: { title: "Order successfully placed! Check its status in your Portfolio." },
  });

  if (!result.status) {
    throw result.error;
  }
  queryClient.invalidateQueries({ queryKey: ["useCowOrders"] });
  const orderId = result.data;
  return orderId;
}

export async function cancelCowOrder({
  orderId,
  chainId,
}: {
  orderId: string;
  chainId: SupportedChain;
}): Promise<string> {
  const client = await getConnectorClient(config);
  const signer = clientToSigner(client);
  const orderBookApi = new OrderBookApi({ chainId });

  const orderCancellationSigningResult = await OrderSigningUtils.signOrderCancellations([orderId], chainId, signer);

  const result = await toastify(
    () =>
      orderBookApi.sendSignedOrderCancellations({
        ...orderCancellationSigningResult,
        orderUids: [orderId],
      }),
    {
      txSent: { title: "Sending cancel request..." },
      txSuccess: { title: "Cancel request sent! Check its status in your Portfolio." },
    },
  );

  if (!result.status) {
    throw result.error;
  }
  return orderId;
}

export async function cancelEthFlowOrder({ order }: { order: EnrichedOrder }): Promise<string> {
  const client = await getConnectorClient(config);
  const signer = clientToSigner(client);
  const ethFlowContract = new Contract(ethFlowAddress, ethFlowAbi, signer);
  const params = {
    buyToken: order.buyToken,
    receiver: order.receiver,
    sellAmount: parseUnits(order.sellAmount, 18),
    buyAmount: parseUnits(order.buyAmount, 18),
    appData: order.appData,
    feeAmount: order.feeAmount,
    validTo: order.validTo,
    partiallyFillable: order.partiallyFillable,
    quoteId: order.quoteId ?? 0,
  };

  const result = await toastify(() => ethFlowContract.invalidateOrder(params, { gasLimit: 200000 }), {
    txSent: { title: "Sending cancel request..." },
    txSuccess: { title: "Cancel request sent! Check its status on-chain." },
  });
  if (!result.status) {
    throw result.error;
  }
  return order.uid;
}
